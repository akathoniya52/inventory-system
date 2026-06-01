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

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
