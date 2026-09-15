"""ORM models."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class BookingRow(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        UniqueConstraint("spot_id", "date", "period", name="uq_spot_date_period"),
        Index("ix_bookings_session", "session_id"),
        Index("ix_bookings_date", "date"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    spot_id: Mapped[str] = mapped_column(String(8), nullable=False)
    session_id: Mapped[str] = mapped_column(String(128), nullable=False)
    date: Mapped[str] = mapped_column(String(10), nullable=False)  # YYYY-MM-DD
    period: Mapped[str] = mapped_column(String(16), nullable=False)  # morning|noon|evening
    plate: Mapped[str] = mapped_column(String(16), nullable=False)
    color: Mapped[str] = mapped_column(String(16), nullable=False)
    vehicle_type: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    cancelled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
