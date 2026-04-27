import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv(Path(__file__).parent / ".env")
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

import models
from database import engine
from routers import auth, expenses

models.Base.metadata.create_all(bind=engine)

# Add new columns to existing DB without Alembic
with engine.connect() as _conn:
    for _stmt in (
        "ALTER TABLE users ADD COLUMN totp_secret TEXT",
        "ALTER TABLE users ADD COLUMN totp_enabled BOOLEAN DEFAULT 0 NOT NULL",
        "ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0 NOT NULL",
        "UPDATE users SET is_verified=1 WHERE is_verified=0 AND verification_token IS NULL",
        "ALTER TABLE users ADD COLUMN verification_token TEXT",
    ):
        try:
            _conn.execute(text(_stmt))
            _conn.commit()
        except Exception:
            pass

app = FastAPI(title="Expense Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(expenses.router)


@app.get("/")
def root():
    return {"status": "ok"}
