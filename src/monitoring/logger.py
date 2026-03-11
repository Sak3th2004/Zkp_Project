"""Structured logging for ZKP chains."""
from __future__ import annotations

import structlog

structlog.configure(processors=[structlog.processors.TimeStamper(fmt="iso"), structlog.processors.JSONRenderer()])
logger = structlog.get_logger()


def log_event(event: str, **payload) -> None:
    logger.info(event, **payload)
