import csv
import io
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

import models
import schemas
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("/", response_model=List[schemas.ExpenseOut])
def list_expenses(
    category: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Expense).filter(models.Expense.owner_id == current_user.id)
    if category:
        query = query.filter(models.Expense.category == category)
    if month:
        query = query.filter(extract("month", models.Expense.date) == month)
    if year:
        query = query.filter(extract("year", models.Expense.date) == year)
    return query.order_by(models.Expense.date.desc()).all()


@router.post("/", response_model=schemas.ExpenseOut, status_code=201)
def create_expense(
    expense: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_expense = models.Expense(**expense.model_dump(), owner_id=current_user.id)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense


@router.put("/{expense_id}", response_model=schemas.ExpenseOut)
def update_expense(
    expense_id: int,
    expense: schemas.ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.owner_id == current_user.id,
    ).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    for key, value in expense.model_dump(exclude_unset=True).items():
        setattr(db_expense, key, value)
    db.commit()
    db.refresh(db_expense)
    return db_expense


@router.delete("/{expense_id}", status_code=204)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.owner_id == current_user.id,
    ).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(db_expense)
    db.commit()


@router.get("/summary")
def get_summary(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(
        models.Expense.category,
        func.sum(models.Expense.amount).label("total"),
    ).filter(models.Expense.owner_id == current_user.id)
    if month:
        query = query.filter(extract("month", models.Expense.date) == month)
    if year:
        query = query.filter(extract("year", models.Expense.date) == year)
    results = query.group_by(models.Expense.category).all()
    return [{"category": r.category, "total": round(r.total, 2)} for r in results]


@router.get("/monthly-trend")
def get_monthly_trend(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    results = db.query(
        extract("year", models.Expense.date).label("year"),
        extract("month", models.Expense.date).label("month"),
        func.sum(models.Expense.amount).label("total"),
    ).filter(
        models.Expense.owner_id == current_user.id
    ).group_by("year", "month").order_by("year", "month").all()
    return [{"year": int(r.year), "month": int(r.month), "total": round(r.total, 2)} for r in results]


@router.get("/export")
def export_csv(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    expenses = (
        db.query(models.Expense)
        .filter(models.Expense.owner_id == current_user.id)
        .order_by(models.Expense.date.desc())
        .all()
    )
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "date", "category", "description", "amount"])
    for e in expenses:
        writer.writerow([e.id, e.date, e.category, e.description or "", e.amount])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=expenses.csv"},
    )
