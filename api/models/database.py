"""Async SQLAlchemy engine and session factory.

Supports both PostgreSQL (production) and SQLite (local development).
Set DATABASE_URL=sqlite+aiosqlite:///zkproofapi.db for local dev.
"""

from __future__ import annotations

import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from api.config import settings


def _resolve_database_url() -> str:
    """Resolve the database URL — use SQLite if env says so or Postgres fails."""
    url = settings.DATABASE_URL

    # Explicit SQLite mode
    if "sqlite" in url:
        return url

    # Try Postgres — if connection fails at module load, we can't know yet.
    # We return the URL as-is and let SQLAlchemy handle connection errors.
    return url


DATABASE_URL = _resolve_database_url()
_is_sqlite = "sqlite" in DATABASE_URL

_engine_kwargs: dict = {}
if not _is_sqlite:
    _engine_kwargs["pool_size"] = settings.DB_POOL_SIZE
    _engine_kwargs["max_overflow"] = settings.DB_MAX_OVERFLOW

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    **_engine_kwargs,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


async def init_db() -> None:
    """Create all tables (used for SQLite dev mode or first-time setup)."""
    # Import all models so they register with Base.metadata
    import api.models.organization  # noqa: F401
    import api.models.user  # noqa: F401
    import api.models.api_key  # noqa: F401
    import api.models.proof_log  # noqa: F401
    import api.models.usage_counter  # noqa: F401
    import api.models.webhook  # noqa: F401
    import api.models.invoice  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncSession:  # type: ignore[misc]
    """Dependency-injection helper for FastAPI routes."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
