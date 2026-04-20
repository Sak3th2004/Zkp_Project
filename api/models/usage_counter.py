"""Usage counter ORM model for monthly metering."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class UsageCounter(Base):
    __tablename__ = "usage_counters"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    period: Mapped[str] = mapped_column(String(7), nullable=False)  # YYYY-MM
    proof_create_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    proof_verify_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    key_generate_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    auth_challenge_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        UniqueConstraint("org_id", "period", name="uq_usage_org_period"),
        Index("idx_usage_org_period", "org_id", "period"),
    )
