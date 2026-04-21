"""Celery application configuration."""

from __future__ import annotations

from celery import Celery

from api.config import settings

celery_app = Celery(
    "zkproofapi",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    broker_connection_retry_on_startup=True,
)

# Auto-discover tasks in this package
celery_app.autodiscover_tasks(["api.tasks"])
