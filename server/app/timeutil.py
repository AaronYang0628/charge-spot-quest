"""Date helpers — business calendar in Asia/Shanghai (match frontend)."""

from __future__ import annotations

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

BOOKING_WINDOW_DAYS = 7
BUSINESS_TZ = ZoneInfo("Asia/Shanghai")


def now_shanghai() -> datetime:
    return datetime.now(BUSINESS_TZ)


def today_iso(d: date | None = None) -> str:
    if d is None:
        d = now_shanghai().date()
    return d.isoformat()


def shanghai_hour(dt: datetime | None = None) -> int:
    dt = dt or now_shanghai()
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=ZoneInfo("UTC")).astimezone(BUSINESS_TZ)
    else:
        dt = dt.astimezone(BUSINESS_TZ)
    return dt.hour


def current_idle_period(dt: datetime | None = None) -> str:
    hour = shanghai_hour(dt)
    if hour >= 18 or hour < 8:
        return "evening"
    if hour >= 12:
        return "noon"
    return "morning"


def add_days_iso(iso: str, days: int) -> str:
    y, m, d = (int(x) for x in iso.split("-"))
    return (date(y, m, d) + timedelta(days=days)).isoformat()


def max_booking_iso(today: str | None = None) -> str:
    return add_days_iso(today or today_iso(), BOOKING_WINDOW_DAYS - 1)


def is_bookable_date(iso: str, today: str | None = None) -> bool:
    t = today or today_iso()
    return t <= iso <= max_booking_iso(t)
