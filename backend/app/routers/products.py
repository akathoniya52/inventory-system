from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Product
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


def _get_or_404(db: Session, product_id: int) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.get("", response_model=list[ProductOut])
def list_products(
    db: Session = Depends(get_db),
    search: str | None = Query(None, description="Match name or SKU"),
    low_stock: bool = Query(False, description="Only products at/below their threshold"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    stmt = select(Product)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(or_(Product.name.ilike(like), Product.sku.ilike(like)))
    if low_stock:
        stmt = stmt.where(Product.quantity_in_stock <= Product.low_stock_threshold)
    stmt = stmt.order_by(Product.created_at.desc()).offset(skip).limit(limit)
    return db.scalars(stmt).all()


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, product_id)


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    # Pre-check for a friendly message; the unique constraint is the real guard.
    exists = db.scalar(select(func.count()).select_from(Product).where(Product.sku == payload.sku))
    if exists:
        raise HTTPException(status.HTTP_409_CONFLICT, detail="A product with this SKU already exists")

    product = Product(**payload.model_dump())
    db.add(product)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, detail="A product with this SKU already exists")
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = _get_or_404(db, product_id)
    data = payload.model_dump(exclude_unset=True)

    if "sku" in data and data["sku"] != product.sku:
        clash = db.scalar(
            select(func.count()).select_from(Product).where(Product.sku == data["sku"])
        )
        if clash:
            raise HTTPException(
                status.HTTP_409_CONFLICT, detail="A product with this SKU already exists"
            )

    for key, value in data.items():
        setattr(product, key, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, detail="A product with this SKU already exists")
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = _get_or_404(db, product_id)
    try:
        db.delete(product)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Cannot delete a product that is referenced by existing orders",
        )
    return None
