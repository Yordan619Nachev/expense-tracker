import json
import os
import smtplib
import urllib.parse
import urllib.request
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)
APP_URL = os.getenv("APP_URL", "http://localhost:5173")

# hCaptcha test secret — always passes; swap for real key in production
HCAPTCHA_SECRET = os.getenv("HCAPTCHA_SECRET", "0x0000000000000000000000000000000000000000")


def verify_captcha(token: str) -> bool:
    if not token:
        return False
    data = urllib.parse.urlencode({"secret": HCAPTCHA_SECRET, "response": token}).encode()
    req = urllib.request.Request("https://hcaptcha.com/siteverify", data=data)
    with urllib.request.urlopen(req, timeout=5) as resp:
        return json.loads(resp.read()).get("success", False)


def send_verification_email(to_email: str, token: str):
    link = f"{APP_URL}/verify-email?token={token}"

    if not SMTP_USER or not SMTP_PASSWORD:
        # In dev: print to console instead of sending a real email
        print(f"\n[DEV] Verification link for {to_email}:\n  {link}\n")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Verify your ExpenseTracker account"
    msg["From"] = SMTP_FROM
    msg["To"] = to_email

    html = f"""
    <p>Thanks for signing up!</p>
    <p>Click the link below to verify your email address:</p>
    <p><a href="{link}">{link}</a></p>
    <p>This link expires in 24 hours.</p>
    """
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM, to_email, msg.as_string())
