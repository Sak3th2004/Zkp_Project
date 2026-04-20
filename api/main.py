"""ZKProofAPI — FastAPI application factory."""

from __future__ import annotations

from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.config import settings
from api.middleware.rate_limiter import RateLimiterMiddleware
from api.middleware.request_id import RequestIdMiddleware
from api.middleware.request_logger import RequestLoggerMiddleware
from api.routes import auth, dashboard_auth, health, keys, proofs, usage


def _configure_logging() -> None:
    """Set up structured JSON logging via structlog."""
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.ConsoleRenderer()
            if settings.APP_ENV == "development"
            else structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(0),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[misc]
    """Application lifespan: startup and shutdown hooks."""
    _configure_logging()
    logger = structlog.get_logger("api.main")
    await logger.ainfo("startup", version=settings.APP_VERSION, env=settings.APP_ENV)
    yield
    await logger.ainfo("shutdown")


def create_app() -> FastAPI:
    """Build and return the FastAPI application."""
    application = FastAPI(
        title="ZKProofAPI",
        description="Zero-Knowledge Proof Authentication as a Service",
        version=settings.APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ── Middleware (applied in reverse order — last added runs first) ────
    application.add_middleware(RequestLoggerMiddleware)
    application.add_middleware(RateLimiterMiddleware)
    application.add_middleware(RequestIdMiddleware)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-Id", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
    )

    # ── Routes ──────────────────────────────────────────────────────────
    application.include_router(health.router)
    application.include_router(keys.router)
    application.include_router(proofs.router)
    application.include_router(auth.router)
    application.include_router(usage.router)
    application.include_router(dashboard_auth.router)

    return application


app = create_app()
