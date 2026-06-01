from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        # Stock can never go negative (enforced at the DB level too).
        CheckConstraint("quantity_in_stock >= 0", name="ck_products_qty_non_negative"),
        CheckConstraint("price >= 0", name="ck_products_price_non_negative"),
        # Speeds up the dashboard "low stock" query: WHERE quantity <= threshold.
        Index("ix_products_low_stock", "quantity_in_stock", "low_stock_threshold"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    sku: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    quantity_in_stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
