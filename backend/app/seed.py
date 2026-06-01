"""Idempotent seed data: the admin user plus a few demo records.

Runs automatically on startup (see main.py). Safe to run repeatedly.
"""

from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models import Customer, Product, User


def seed(db: Session) -> None:
    _seed_admin(db)
    _seed_demo_data(db)
    db.commit()


def _seed_admin(db: Session) -> None:
    existing = db.scalar(select(User).where(User.email == settings.ADMIN_EMAIL))
    if existing is None:
        db.add(
            User(
                email=settings.ADMIN_EMAIL,
                full_name="Administrator",
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
            )
        )


def _seed_demo_data(db: Session) -> None:
    # Only seed demo content into an empty catalogue.
    if db.scalar(select(func.count()).select_from(Product)):
        return

    db.add_all(
        [
            Product(name="ThinkPad X1 Carbon", sku="LAP-X1C-001", category="Laptops",
                    description="14\" business ultrabook", price=Decimal("1899.00"),
                    quantity_in_stock=34, low_stock_threshold=10),
            Product(name="ErgoChair Pro", sku="FUR-ERG-002", category="Furniture",
                    description="Ergonomic office chair", price=Decimal("449.00"),
                    quantity_in_stock=86, low_stock_threshold=15),
            Product(name="USB-C Dock 4K", sku="ACC-DOCK-003", category="Accessories",
                    description="11-in-1 docking station", price=Decimal("129.00"),
                    quantity_in_stock=8, low_stock_threshold=20),
            Product(name="27\" 4K Monitor", sku="MON-4K27-004", category="Monitors",
                    description="UHD IPS display", price=Decimal("389.00"),
                    quantity_in_stock=5, low_stock_threshold=12),
        ]
    )

    if not db.scalar(select(func.count()).select_from(Customer)):
        db.add_all(
            [
                Customer(full_name="Acme Corp", email="ops@acme.com", phone="+1-202-555-0143", company="Acme Corp"),
                Customer(full_name="Globex Inc", email="buy@globex.com", phone="+1-202-555-0177", company="Globex Inc"),
                Customer(full_name="Soylent Corp", email="orders@soylent.com", phone="+1-202-555-0199", company="Soylent Corp"),
            ]
        )
