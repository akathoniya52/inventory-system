from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables.

    Nothing here is hardcoded for production: every value can be overridden
    through the environment (see .env.example / docker-compose.yml).
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@db:5432/inventory"

    # Auth (mock login). Override SECRET_KEY in every real environment.
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    ALGORITHM: str = "HS256"

    # Seeded admin used by the mock login flow.
    ADMIN_EMAIL: str = "admin@inventorypro.com"
    ADMIN_PASSWORD: str = "admin123"

    # CORS: comma-separated list of allowed origins.
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Inventory
    DEFAULT_LOW_STOCK_THRESHOLD: int = 10

    # Port the app listens on (Render/Railway inject this).
    PORT: int = 8000

    # Keep-alive scheduler: periodically pings an endpoint so free hosts
    # (Render/Railway/Fly) don't spin the service down for inactivity.
    KEEPALIVE_ENABLED: bool = True
    KEEPALIVE_INTERVAL_SECONDS: int = 40
    # Leave empty to self-ping /health. In production set this to the service's
    # PUBLIC url (e.g. https://your-app.onrender.com/health) so external traffic
    # is generated — an internal localhost ping alone won't keep the host awake.
    KEEPALIVE_URL: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def keepalive_target(self) -> str:
        return self.KEEPALIVE_URL.strip() or f"http://localhost:{self.PORT}/health"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
