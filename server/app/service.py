"""Booking domain logic."""

from __future__ import annotations

import secrets
from typing import get_args
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import BookingRow
from app.plate import mask_plate
from app.schemas import (
    Booking,
    BookResult,
    CreateBookingBody,
    SpotBookingView,
    SpotStatus,
    TimePeriod,
    VehicleInfo,
    VehicleType,
)
from app.timeutil import is_bookable_date, today_iso

BOOKABLE_SPOT = "C"
PERIOD_ORDER: list[TimePeriod] = ["morning", "noon", "evening"]
SPOT_IDS = ["A", "B", "C"]
VALID_COLORS = {"black", "white", "gray", "red", "blue"}
VALID_TYPES = set(get_args(VehicleType))
VALID_PERIODS = {"morning", "noon", "evening"}


def _uid(prefix: str = "bk") -> str:
    return f"{prefix}_{secrets.token_hex(8)}"


def _row_to_booking(row: BookingRow) -> Booking:
    return Booking(
        id=row.id,
        spotId=row.spot_id,  # type: ignore[arg-type]
        sessionId=row.session_id,
        date=row.date,
        period=row.period,  # type: ignore[arg-type]
        vehicle=VehicleInfo(
            plate=row.plate,
            color=row.color,  # type: ignore[arg-type]
            type=row.vehicle_type,  # type: ignore[arg-type]
        ),
        createdAt=row.created_at.isoformat().replace("+00:00", "Z")
        if row.created_at.tzinfo
        else row.created_at.isoformat() + "Z",
        cancelled=row.cancelled,
    )


def _row_to_view(row: BookingRow) -> SpotBookingView:
    return SpotBookingView(
        id=row.id,
        spotId=row.spot_id,  # type: ignore[arg-type]
        date=row.date,
        period=row.period,  # type: ignore[arg-type]
        status="booked",
        plateMasked=mask_plate(row.plate),
        vehicleType=row.vehicle_type,  # type: ignore[arg-type]
        vehicleColor=row.color,  # type: ignore[arg-type]
    )


def _active_rows(db: Session) -> list[BookingRow]:
    return list(db.scalars(select(BookingRow).where(BookingRow.cancelled.is_(False))).all())


def get_reserved_periods(db: Session, spot_id: str, date: str) -> list[TimePeriod]:
    rows = db.scalars(
        select(BookingRow).where(
            BookingRow.cancelled.is_(False),
            BookingRow.spot_id == spot_id,
            BookingRow.date == date,
        )
    ).all()
    return [r.period for r in rows]  # type: ignore[misc]


def _idle_from_occupancy(reserved: list[str], period: str, free_idle: float, booked_idle: float = 0.08) -> float:
    return booked_idle if period in reserved else free_idle


def get_spots(db: Session) -> list[SpotStatus]:
    today = today_iso()
    reserved_c = get_reserved_periods(db, BOOKABLE_SPOT, today)

    a_morning, a_noon, a_evening = 0.18, 0.28, 0.35
    b_morning, b_noon, b_evening = 0.1, 0.16, 0.22
    c_morning = _idle_from_occupancy(reserved_c, "morning", 0.82)
    c_noon = _idle_from_occupancy(reserved_c, "noon", 0.71)
    c_evening = _idle_from_occupancy(reserved_c, "evening", 0.64)

    return [
        SpotStatus(
            id="A",
            maintenance=True,
            bookable=False,
            occupied=False,
            idleIn1h=0.12,
            idleTonight=a_evening,
            idleMorning=a_morning,
            idleNoon=a_noon,
            idleEvening=a_evening,
        ),
        SpotStatus(
            id="B",
            maintenance=True,
            bookable=False,
            occupied=False,
            idleIn1h=0.08,
            idleTonight=b_evening,
            idleMorning=b_morning,
            idleNoon=b_noon,
            idleEvening=b_evening,
        ),
        SpotStatus(
            id="C",
            maintenance=False,
            bookable=len(reserved_c) < 3,
            occupied=False,
            idleIn1h=0.78,
            idleTonight=c_evening,
            idleMorning=c_morning,
            idleNoon=c_noon,
            idleEvening=c_evening,
            reservedPeriods=reserved_c,
        ),
    ]


def get_today_bookings(db: Session, date: str | None = None) -> list[SpotBookingView]:
    d = date or today_iso()
    rows = [
        r
        for r in _active_rows(db)
        if r.date == d
    ]
    rows.sort(
        key=lambda r: (
            SPOT_IDS.index(r.spot_id) if r.spot_id in SPOT_IDS else 99,
            PERIOD_ORDER.index(r.period) if r.period in PERIOD_ORDER else 99,
        )
    )
    return [_row_to_view(r) for r in rows]


def get_spot_bookings(db: Session, spot_id: str) -> list[SpotBookingView]:
    rows = [
        r
        for r in _active_rows(db)
        if r.spot_id == spot_id
    ]
    rows.sort(key=lambda r: (r.date, PERIOD_ORDER.index(r.period) if r.period in PERIOD_ORDER else 99))
    return [_row_to_view(r) for r in rows]


def get_my_bookings(db: Session, session_id: str) -> list[Booking]:
    rows = [
        r
        for r in _active_rows(db)
        if r.session_id == session_id
    ]
    rows.sort(key=lambda r: (r.date, PERIOD_ORDER.index(r.period) if r.period in PERIOD_ORDER else 99))
    return [_row_to_booking(r) for r in rows]


def normalize_vehicle(vehicle: VehicleInfo) -> VehicleInfo:
    plate = (vehicle.plate or "")[:10]
    color = vehicle.color if vehicle.color in VALID_COLORS else "blue"  # type: ignore[comparison-overlap]
    vtype = vehicle.type if vehicle.type in VALID_TYPES else "convertible"  # type: ignore[comparison-overlap]
    return VehicleInfo(plate=plate, color=color, type=vtype)  # type: ignore[arg-type]


def create_booking(db: Session, body: CreateBookingBody) -> BookResult:
    if not is_bookable_date(body.date) or body.period not in VALID_PERIODS:
        return BookResult(ok=False, reason="请选择今日起 7 天内的有效时段")

    vehicle = normalize_vehicle(body.vehicle)
    if not vehicle.plate.strip():
        return BookResult(ok=False, reason="请填写车牌")

    conflict = db.scalar(
        select(BookingRow).where(
            BookingRow.cancelled.is_(False),
            BookingRow.spot_id == BOOKABLE_SPOT,
            BookingRow.date == body.date,
            BookingRow.period == body.period,
        )
    )
    if conflict is not None:
        return BookResult(ok=False, reason="该时段已被预约，请选择其他时段")

    row = BookingRow(
        id=_uid("bk"),
        spot_id=BOOKABLE_SPOT,
        session_id=body.sessionId,
        date=body.date,
        period=body.period,
        plate=vehicle.plate.strip().upper(),
        color=vehicle.color,
        vehicle_type=vehicle.type,
        created_at=datetime.now(timezone.utc),
        cancelled=False,
    )
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return BookResult(ok=False, reason="该时段已被预约，请选择其他时段")
    db.refresh(row)
    return BookResult(ok=True, booking=_row_to_booking(row))
