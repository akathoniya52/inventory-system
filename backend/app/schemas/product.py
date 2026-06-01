from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=64)
    description: str | None = Field(None, max_length=5000)
    category: str | None = Field(None, max_length=120)
    price: Decimal = Field(..., ge=0, max_digits=12, decimal_places=2)
    quantity_in_stock: int = Field(..., ge=0)
    low_stock_threshold: int = Field(10, ge=0)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    sku: str | None = Field(None, min_length=1, max_length=64)
    description: str | None = Field(None, max_length=5000)
    category: str | None = Field(None, max_length=120)
    price: Decimal | None = Field(None, ge=0, max_digits=12, decimal_places=2)
    quantity_in_stock: int | None = Field(None, ge=0)
    low_stock_threshold: int | None = Field(None, ge=0)


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
