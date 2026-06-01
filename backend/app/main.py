import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.routers import auth, customers, dashboard, orders, products
from app.seed import seed

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("inventorypro")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables and seed baseline data on startup.
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
        logger.info("Database initialised and seeded.")
    except Exception:  # pragma: no cover - seeding must never crash boot
        logger.exception("Seeding failed")
        db.rollback()
    finally:
        db.close()
    yield


app = FastAPI(
    title="InventoryPro API",
    description="Inventory & Order Management System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return a clean, consistent 422 payload for invalid request data."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation failed", "errors": exc.errors()},
    )


@app.get("/", tags=["health"])
def root():
    return {"service": "InventoryPro API", "status": "ok", "docs": "/docs"}


@app.get("/health", tags=["health"])
def health():
    return {"status": "healthy"}


app.include_router(auth.router)
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)
