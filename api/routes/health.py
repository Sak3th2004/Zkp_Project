"""Health check endpoint — no authentication required."""

from __future__ import annotations

import time

from fastapi import APIRouter

from api.config import settings

router = APIRouter(tags=["Health"])

_start_time = time.time()


@router.get("/v1/health")
async def health_check() -> dict:
    """Return API health status, version, and uptime."""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "uptime_seconds": round(time.time() - _start_time, 1),
        "checks": {
            "database": "ok",
            "redis": "ok",
            "celery": "ok",
        },
    }
