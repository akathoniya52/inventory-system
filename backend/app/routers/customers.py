from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Customer
from app.schemas.customer import CustomerCreate, CustomerOut

router = APIRouter(prefix="/customers", tags=["customers"])


def _get_or_404(db: Session, customer_id: int) -> Customer:
    customer = db.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


@router.get("", response_model=list[CustomerOut])
def list_customers(
    db: Session = Depends(get_db),
    search: str | None = Query(None, description="Match name or email"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    stmt = select(Customer)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(or_(Customer.full_name.ilike(like), Customer.email.ilike(like)))
    stmt = stmt.order_by(Customer.created_at.desc()).offset(skip).limit(limit)
    return db.scalars(stmt).all()


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, customer_id)


@router.post("", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    exists = db.scalar(
        select(func.count()).select_from(Customer).where(Customer.email == payload.email)
    )
    if exists:
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="A customer with this email already exists"
        )

    customer = Customer(**payload.model_dump())
    db.add(customer)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="A customer with this email already exists"
        )
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = _get_or_404(db, customer_id)
    try:
        db.delete(customer)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Cannot delete a customer who has existing orders",
        )
    return None
