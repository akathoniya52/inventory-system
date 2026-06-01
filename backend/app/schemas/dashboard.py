from decimal import Decimal

from pydantic import BaseModel

from app.schemas.order import OrderListItem
from app.schemas.product import ProductOut


class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_count: int
    total_inventory_value: Decimal
    total_revenue: Decimal


class TopProduct(BaseModel):
    id: int
    name: str
    units_sold: int
    revenue: Decimal


class DashboardSummary(BaseModel):
    stats: DashboardStats
    recent_orders: list[OrderListItem]
    low_stock_products: list[ProductOut]
    top_products: list[TopProduct]
