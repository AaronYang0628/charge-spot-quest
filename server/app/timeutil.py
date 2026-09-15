"""Date helpers matching frontend lib/time.ts."""

from __future__ import annotations

from datetime import date, timedelta

BOOKING_WINDOW_DAYS = 7


def today_iso(d: date | None = None) -> str:
    d = d or date.today()
    return d.isoformat()


def add_days_iso(iso: str, days: int) -> str:
    y, m, d = (int(x) for x in iso.split("-"))
    return (date(y, m, d) + timedelta(days=days)).isoformat()


def max_booking_iso(today: str | None = None) -> str:
    return add_days_iso(today or today_iso(), BOOKING_WINDOW_DAYS - 1)


def is_bookable_date(iso: str, today: str | None = None) -> bool:
    t = today or today_iso()
    return t <= iso <= max_booking_iso(t)
