from datetime import date as Date
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: str
    password: str


class ExpenseCreate(BaseModel):
    amount: float
    category: str
    description: Optional[str] = ""
    date: Date


class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[Date] = None


class ExpenseOut(BaseModel):
    id: int
    amount: float
    category: str
    description: Optional[str]
    date: Date

    model_config = {"from_attributes": True}
