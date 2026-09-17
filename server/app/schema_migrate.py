"""Lightweight schema patches for existing SQLite/Postgres DBs (no Alembic)."""

from __future__ import annotations

import logging
import re

from sqlalchemy import text
from sqlalchemy.engine import Connection, Engine

logger = logging.getLogger(__name__)

_LEGACY_UQ_RE = re.compile(
    r"CONSTRAINT\s+uq_spot_date_period\s+UNIQUE\s*\(\s*spot_id\s*,\s*date\s*,\s*period\s*\)"
    r"|UNIQUE\s*\(\s*spot_id\s*,\s*date\s*,\s*period\s*\)",
    re.IGNORECASE,
)


def _sqlite_bookings_has_legacy_unique(conn: Connection) -> bool:
    row = conn.execute(
        text("SELECT sql FROM sqlite_master WHERE type='table' AND name='bookings'")
    ).fetchone()
    if not row or not row[0]:
        return False
    return bool(_LEGACY_UQ_RE.search(row[0]))


def _sqlite_rebuild_bookings_drop_legacy_unique(conn: Connection) -> None:
    """Rebuild bookings without table-level UNIQUE (spot_id, date, period).

    SQLite cannot DROP a table UNIQUE constraint in place; DROP INDEX only removes
    standalone indexes, not CONSTRAINT ... UNIQUE baked into CREATE TABLE.
    """
    logger.info("Rebuilding bookings to drop legacy uq_spot_date_period UNIQUE")
    # Drop dependent indexes first (recreated after rename)
    for name in (
        "uq_spot_date_period_active",
        "ix_bookings_session",
        "ix_bookings_date",
        "uq_spot_date_period",
    ):
        conn.execute(text(f"DROP INDEX IF EXISTS {name}"))

    conn.execute(text("ALTER TABLE bookings RENAME TO bookings_legacy_uq"))
    conn.execute(
        text(
            """
            CREATE TABLE bookings (
                id VARCHAR(64) NOT NULL,
                spot_id VARCHAR(8) NOT NULL,
                session_id VARCHAR(128) NOT NULL,
                date VARCHAR(10) NOT NULL,
                period VARCHAR(16) NOT NULL,
                plate VARCHAR(16) NOT NULL,
                color VARCHAR(16) NOT NULL,
                vehicle_type VARCHAR(32) NOT NULL,
                created_at DATETIME NOT NULL,
                cancelled BOOLEAN NOT NULL,
                superseded_by VARCHAR(64),
                cancel_reason VARCHAR(32),
                PRIMARY KEY (id)
            )
            """
        )
    )
    conn.execute(
        text(
            """
            INSERT INTO bookings (
                id, spot_id, session_id, date, period, plate, color, vehicle_type,
                created_at, cancelled, superseded_by, cancel_reason
            )
            SELECT
                id, spot_id, session_id, date, period, plate, color, vehicle_type,
                created_at, cancelled, superseded_by, cancel_reason
            FROM bookings_legacy_uq
            """
        )
    )
    conn.execute(text("DROP TABLE bookings_legacy_uq"))
    logger.info("Rebuilt bookings without legacy table UNIQUE")


def _sqlite_ensure_active_indexes(conn: Connection) -> None:
    conn.execute(
        text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_spot_date_period_active "
            "ON bookings (spot_id, date, period) WHERE cancelled = 0"
        )
    )
    conn.execute(
        text("CREATE INDEX IF NOT EXISTS ix_bookings_session ON bookings (session_id)")
    )
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_bookings_date ON bookings (date)"))


def ensure_schema(engine: Engine) -> None:
    """Add cut-in columns and replace strict unique with active-only unique index."""
    dialect = engine.dialect.name
    with engine.begin() as conn:
        if dialect == "sqlite":
            # Table may not exist yet (fresh create_all); nothing to patch.
            exists = conn.execute(
                text(
                    "SELECT 1 FROM sqlite_master WHERE type='table' AND name='bookings'"
                )
            ).fetchone()
            if not exists:
                return

            cols = {row[1] for row in conn.execute(text("PRAGMA table_info(bookings)")).fetchall()}
            if "superseded_by" not in cols:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN superseded_by VARCHAR(64)"))
                logger.info("Added bookings.superseded_by")
            if "cancel_reason" not in cols:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN cancel_reason VARCHAR(32)"))
                logger.info("Added bookings.cancel_reason")

            # Standalone index names (harmless if table UNIQUE still holds)
            for name in ("uq_spot_date_period", "sqlite_autoindex_bookings_1"):
                try:
                    conn.execute(text(f"DROP INDEX IF EXISTS {name}"))
                except Exception:  # noqa: BLE001
                    pass

            if _sqlite_bookings_has_legacy_unique(conn):
                _sqlite_rebuild_bookings_drop_legacy_unique(conn)

            _sqlite_ensure_active_indexes(conn)

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
            conn.execute(
                text("CREATE INDEX IF NOT EXISTS ix_bookings_session ON bookings (session_id)")
            )
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_bookings_date ON bookings (date)"))
