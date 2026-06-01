import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.models import Customer, Order, OrderItem, Product
from app.models.order import OrderStatus
from app.schemas.order import OrderCreate, OrderListItem, OrderOut

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=list[OrderListItem])
def list_orders(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    # Single query: order + customer (joined) + item count, no N+1.
    item_count = func.count(OrderItem.id).label("item_count")
    rows = db.execute(
        select(Order, item_count)
        .outerjoin(OrderItem, OrderItem.order_id == Order.id)
        .options(selectinload(Order.customer))
        .group_by(Order.id)
        .order_by(Order.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).all()

    result = []
    for order, count in rows:
        item = OrderListItem.model_validate(order)
        item.item_count = count
        result.append(item)
    return result


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.scalar(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items), selectinload(Order.customer))
    )
    if order is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    # 1. Customer must exist.
    customer = db.get(Customer, payload.customer_id)
    if customer is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Customer not found")

    # 2. Merge duplicate product lines so the same product can't dodge the
    #    stock check by being listed twice.
    requested: dict[int, int] = {}
    for line in payload.items:
        requested[line.product_id] = requested.get(line.product_id, 0) + line.quantity

    # 3. Lock the product rows FOR UPDATE so concurrent orders can't oversell.
    products = db.scalars(
        select(Product).where(Product.id.in_(requested.keys())).with_for_update()
    ).all()
    product_map = {p.id: p for p in products}

    missing = set(requested) - set(product_map)
    if missing:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail=f"Product(s) not found: {sorted(missing)}",
        )

    # 4. Validate stock for every line before mutating anything.
    for product_id, qty in requested.items():
        product = product_map[product_id]
        if product.quantity_in_stock < qty:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                detail=(
                    f"Insufficient stock for '{product.name}' "
                    f"(requested {qty}, available {product.quantity_in_stock})"
                ),
            )

    # 5. Build the order, decrement stock, and let the backend compute totals.
    #    A unique temp number satisfies the NOT NULL/unique column on flush;
    #    it is replaced with the human-readable ORD-<id> once the id is known.
    order = Order(
        customer_id=customer.id,
        status=OrderStatus.completed,
        notes=payload.notes,
        order_number=f"tmp-{uuid.uuid4().hex[:20]}",
    )
    db.add(order)

    total = Decimal("0.00")
    for product_id, qty in requested.items():
        product = product_map[product_id]
        unit_price = Decimal(str(product.price))
        line_total = unit_price * qty
        total += line_total
        product.quantity_in_stock -= qty  # cannot go negative: validated above
        order.items.append(
            OrderItem(
                product_id=product.id,
                product_name=product.name,
                quantity=qty,
                unit_price=unit_price,
                line_total=line_total,
            )
        )

    order.total_amount = total

    db.flush()  # assigns order.id
    order.order_number = f"ORD-{10000 + order.id}"
    db.commit()

    # Reload with relationships for the response.
    db.refresh(order)
    order = db.scalar(
        select(Order)
        .where(Order.id == order.id)
        .options(selectinload(Order.items), selectinload(Order.customer))
    )
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    """Cancel/delete an order and restock its items."""
    order = db.scalar(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    if order is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Return stock to inventory for any non-cancelled order being removed.
    if order.status != OrderStatus.cancelled:
        product_ids = [item.product_id for item in order.items]
        if product_ids:
            products = db.scalars(
                select(Product).where(Product.id.in_(product_ids)).with_for_update()
            ).all()
            product_map = {p.id: p for p in products}
            for item in order.items:
                product = product_map.get(item.product_id)
                if product is not None:
                    product.quantity_in_stock += item.quantity

    db.delete(order)
    db.commit()
    return None
