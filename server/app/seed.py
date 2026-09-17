"""Seed demo bookings when DB is empty (mirrors mock.ts seeds)."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.models import BookingRow
from app.timeutil import add_days_iso, today_iso


def seed_if_empty(db: Session) -> int:
    count = db.scalar(select(func.count()).select_from(BookingRow)) or 0
    if count > 0:
        return 0

    today = today_iso()
    now = datetime.now(timezone.utc)
    demo = "demo-seed"

    def mk(
        spot_id: str,
        day_offset: int,
        period: str,
        plate: str,
        color: str,
        vtype: str,
        n: int,
    ) -> BookingRow:
        return BookingRow(
            id=f"seed-{spot_id}-{day_offset}-{period}-{n}",
            spot_id=spot_id,
            session_id=demo,
            date=add_days_iso(today, day_offset),
            period=period,
            plate=plate,
            color=color,
            vehicle_type=vtype,
            created_at=now,
            cancelled=False,
        )

    rows = [
        # Today — visible in 今日预约 (keep C morning/noon free for demo booking)
        mk("A", 0, "morning", "浙A12345", "blue", "convertible", 1),
        mk("B", 0, "evening", "苏C66552", "gray", "convertible", 1),
        mk("C", 0, "evening", "浙ACU6508", "white", "pickup", 1),
        # Future seeds
        mk("A", 2, "noon", "沪B88881", "red", "pickup", 2),
        mk("B", 3, "morning", "浙D90003", "black", "pickup", 2),
        mk("C", 2, "morning", "浙A10247", "red", "convertible", 2),
        mk("C", 4, "noon", "浙F33117", "blue", "convertible", 3),
    ]
    db.add_all(rows)
    db.commit()
    return len(rows)


def reset_and_seed(db: Session) -> int:
    db.execute(delete(BookingRow))
    db.commit()
    return seed_if_empty(db)
