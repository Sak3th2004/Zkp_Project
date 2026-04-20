"""Application configuration loaded from environment variables."""

from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """All application settings.  Reads from environment variables and .env file."""

    # ── App ─────────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    APP_URL: str = "http://localhost:8000"
    DASHBOARD_URL: str = "http://localhost:3000"
    WEBSITE_URL: str = "http://localhost:3001"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"
    APP_VERSION: str = "1.0.0"

    # ── Database ────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://zkp:zkp@localhost:5432/zkproofapi"
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10

    # ── Redis ───────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── Security ────────────────────────────────────────────────────────
    SECRET_KEY: str = "change-me-to-a-64-char-random-string"
    JWT_SECRET: str = "change-me-to-another-64-char-random-string"
    JWT_EXPIRY_HOURS: int = 24
    JWT_ALGORITHM: str = "HS256"
    API_KEY_SALT: str = "change-me-to-a-32-char-random-string"

    # ── Stripe ──────────────────────────────────────────────────────────
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRO_PRICE_ID: str = ""
    STRIPE_ENTERPRISE_PRICE_ID: str = ""

    # ── Email ───────────────────────────────────────────────────────────
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    # ── Monitoring ──────────────────────────────────────────────────────
    SENTRY_DSN: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "case_sensitive": True}

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
