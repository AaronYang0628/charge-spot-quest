"""Lightweight schema patches for existing SQLite/Postgres DBs (no Alembic)."""

from __future__ import annotations

import logging

from sqlalchemy import text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)


def ensure_schema(engine: Engine) -> None:
    """Add cut-in columns and replace strict unique with active-only unique index."""
    dialect = engine.dialect.name
    with engine.begin() as conn:
        if dialect == "sqlite":
            cols = {row[1] for row in conn.execute(text("PRAGMA table_info(bookings)")).fetchall()}
            if "superseded_by" not in cols:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN superseded_by VARCHAR(64)"))
                logger.info("Added bookings.superseded_by")
            if "cancel_reason" not in cols:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN cancel_reason VARCHAR(32)"))
                logger.info("Added bookings.cancel_reason")
            # Drop legacy unique (constraint or index name varies)
            for name in ("uq_spot_date_period", "sqlite_autoindex_bookings_1"):
                try:
                    conn.execute(text(f"DROP INDEX IF EXISTS {name}"))
                except Exception:  # noqa: BLE001
                    pass
            # SQLite may store UniqueConstraint as a table constraint — rebuild via
            # partial unique index only (duplicate active rows still rejected).
            conn.execute(text("DROP INDEX IF EXISTS uq_spot_date_period_active"))
            conn.execute(
                text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS uq_spot_date_period_active "
                    "ON bookings (spot_id, date, period) WHERE cancelled = 0"
                )
            )
        elif dialect in ("postgresql", "postgres"):
            conn.execute(
                text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS superseded_by VARCHAR(64)")
            )
            conn.execute(
                text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancel_reason VARCHAR(32)")
            )
            conn.execute(text("ALTER TABLE bookings DROP CONSTRAINT IF EXISTS uq_spot_date_period"))
            conn.execute(text("DROP INDEX IF EXISTS uq_spot_date_period"))
            conn.execute(text("DROP INDEX IF EXISTS uq_spot_date_period_active"))
            conn.execute(
                text(
                    "CREATE UNIQUE INDEX uq_spot_date_period_active "
                    "ON bookings (spot_id, date, period) WHERE cancelled = false"
                )
            )
