from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.order import OrderStatus


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)


class OrderCreate(BaseModel):
    customer_id: int
    items: list[OrderItemCreate] = Field(..., min_length=1)
    notes: str | None = Field(None, max_length=500)


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal


class CustomerSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_number: str
    customer_id: int
    status: OrderStatus
    total_amount: Decimal
    notes: str | None
    created_at: datetime
    customer: CustomerSummary | None = None
    items: list[OrderItemOut] = []


class OrderListItem(BaseModel):
    """Lightweight row for the orders table (no line items)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    order_number: str
    status: OrderStatus
    total_amount: Decimal
    created_at: datetime
    customer: CustomerSummary | None = None
    item_count: int = 0
