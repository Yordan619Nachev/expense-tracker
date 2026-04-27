import secrets
from datetime import timedelta

import pyotp
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Response
from jose import JWTError, jwt
from sqlalchemy.orm import Session

import models
import schemas
from auth import (
    ALGORITHM,
    SECRET_KEY,
    clear_auth_cookie,
    create_access_token,
    get_current_user,
    hash_password,
    set_auth_cookie,
    verify_password,
)
from database import get_db
from email_utils import APP_URL, SMTP_USER, send_verification_email

router = APIRouter(prefix="/auth", tags=["auth"])


def _make_verification_response(email: str, token: str) -> dict:
    out = {"email": email}
    if not SMTP_USER:
        out["dev_verification_url"] = f"{APP_URL}/verify-email?token={token}"
    return out


@router.post("/register", status_code=201)
def register(user: schemas.UserCreate, background: BackgroundTasks, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()

    if existing:
        if existing.is_verified:
            raise HTTPException(status_code=400, detail="Email already registered")
        # Account exists but unverified — resend verification
        token = secrets.token_urlsafe(32)
        existing.verification_token = token
        db.commit()
        background.add_task(send_verification_email, existing.email, token)
        return _make_verification_response(existing.email, token)

    token = secrets.token_urlsafe(32)
    db_user = models.User(
        email=user.email,
        hashed_password=hash_password(user.password),
        verification_token=token,
        is_verified=False,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    background.add_task(send_verification_email, db_user.email, token)
    return _make_verification_response(db_user.email, token)


@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")
    user.is_verified = True
    user.verification_token = None
    db.commit()
    return {"message": "Email verified. You can now log in."}


@router.post("/resend-verification")
def resend_verification(data: schemas.ResendVerification, background: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if user and not user.is_verified:
        token = secrets.token_urlsafe(32)
        user.verification_token = token
        db.commit()
        background.add_task(send_verification_email, user.email, token)
        return _make_verification_response(user.email, token)
    return {"email": data.email}


@router.post("/login")
def login(credentials: schemas.LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email before logging in")

    if user.totp_enabled:
        pre_auth_token = create_access_token(
            {"sub": user.email, "scope": "pre_auth"},
            expires_delta=timedelta(minutes=5),
        )
        return {"requires_2fa": True, "pre_auth_token": pre_auth_token}

    token = create_access_token({"sub": user.email, "scope": "access"})
    set_auth_cookie(response, token)
    return {"requires_2fa": False}


@router.post("/logout")
def logout(response: Response):
    clear_auth_cookie(response)
    return {"message": "Logged out"}


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.post("/2fa/setup")
def setup_2fa(current_user: models.User = Depends(get_current_user)):
    secret = pyotp.random_base32()
    uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.email, issuer_name="ExpenseTracker"
    )
    return {"secret": secret, "uri": uri}


@router.post("/2fa/verify-setup")
def verify_setup_2fa(
    data: schemas.TwoFAVerifySetup,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not pyotp.TOTP(data.secret).verify(data.code):
        raise HTTPException(status_code=400, detail="Invalid code")
    current_user.totp_secret = data.secret
    current_user.totp_enabled = True
    db.commit()
    return {"message": "2FA enabled"}


@router.post("/2fa/disable")
def disable_2fa(
    data: schemas.TwoFADisable,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not current_user.totp_enabled:
        raise HTTPException(status_code=400, detail="2FA is not enabled")
    if not pyotp.TOTP(current_user.totp_secret).verify(data.code):
        raise HTTPException(status_code=400, detail="Invalid code")
    current_user.totp_secret = None
    current_user.totp_enabled = False
    db.commit()
    return {"message": "2FA disabled"}


@router.post("/2fa/verify")
def verify_2fa(data: schemas.TwoFALoginVerify, response: Response, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(data.pre_auth_token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        scope = payload.get("scope")
        if not email or scope != "pre_auth":
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not user.totp_enabled:
        raise HTTPException(status_code=401, detail="Invalid token")

    if not pyotp.TOTP(user.totp_secret).verify(data.code):
        raise HTTPException(status_code=400, detail="Invalid 2FA code")

    token = create_access_token({"sub": user.email, "scope": "access"})
    set_auth_cookie(response, token)
    return {"message": "Login successful"}
