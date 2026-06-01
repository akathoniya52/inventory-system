from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.models import Customer, Order, OrderItem, Product
from app.schemas.dashboard import DashboardStats, DashboardSummary, TopProduct
from app.schemas.order import OrderListItem
from app.schemas.product import ProductOut

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db)):
    # --- Aggregate stats (cheap COUNT/SUM scans, one query each) ---
    total_products = db.scalar(select(func.count()).select_from(Product)) or 0
    total_customers = db.scalar(select(func.count()).select_from(Customer)) or 0
    total_orders = db.scalar(select(func.count()).select_from(Order)) or 0

    low_stock_count = (
        db.scalar(
            select(func.count())
            .select_from(Product)
            .where(Product.quantity_in_stock <= Product.low_stock_threshold)
        )
        or 0
    )

    total_inventory_value = db.scalar(
        select(func.coalesce(func.sum(Product.price * Product.quantity_in_stock), 0))
    ) or Decimal("0")

    total_revenue = db.scalar(
        select(func.coalesce(func.sum(Order.total_amount), 0))
    ) or Decimal("0")

    stats = DashboardStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_count=low_stock_count,
        total_inventory_value=total_inventory_value,
        total_revenue=total_revenue,
    )

    # --- Recent orders (with item counts, single grouped query) ---
    item_count = func.count(OrderItem.id).label("item_count")
    recent_rows = db.execute(
        select(Order, item_count)
        .outerjoin(OrderItem, OrderItem.order_id == Order.id)
        .options(selectinload(Order.customer))
        .group_by(Order.id)
        .order_by(Order.created_at.desc())
        .limit(5)
    ).all()
    recent_orders = []
    for order, count in recent_rows:
        row = OrderListItem.model_validate(order)
        row.item_count = count
        recent_orders.append(row)

    # --- Low stock products ---
    low_stock_products = db.scalars(
        select(Product)
        .where(Product.quantity_in_stock <= Product.low_stock_threshold)
        .order_by(Product.quantity_in_stock.asc())
        .limit(10)
    ).all()

    # --- Top products by units sold (single grouped aggregate) ---
    top_rows = db.execute(
        select(
            OrderItem.product_id,
            func.max(OrderItem.product_name).label("name"),
            func.sum(OrderItem.quantity).label("units_sold"),
            func.sum(OrderItem.line_total).label("revenue"),
        )
        .group_by(OrderItem.product_id)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
    ).all()
    top_products = [
        TopProduct(id=pid, name=name, units_sold=int(units), revenue=revenue)
        for pid, name, units, revenue in top_rows
    ]

    return DashboardSummary(
        stats=stats,
        recent_orders=recent_orders,
        low_stock_products=[ProductOut.model_validate(p) for p in low_stock_products],
        top_products=top_products,
    )
