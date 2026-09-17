"""Booking domain logic."""

from __future__ import annotations

import secrets
from typing import get_args
from datetime import datetime, timezone

from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.host_plates import is_host_plate
from app.models import BookingRow
from app.plate import mask_plate
from app.schemas import (
    Booking,
    BookResult,
    CancelCutInBody,
    CreateBookingBody,
    CutInBookingBody,
    SpotBookingView,
    SpotStatus,
    TimePeriod,
    VehicleInfo,
    VehicleType,
)
from app.timeutil import current_idle_period, is_bookable_date, today_iso

BOOKABLE_SPOT = "C"
PERIOD_ORDER: list[TimePeriod] = ["morning", "noon", "evening"]
SPOT_IDS = ["A", "B", "C"]
VALID_COLORS = {"black", "white", "gray", "red", "blue"}
VALID_TYPES = set(get_args(VehicleType))
VALID_PERIODS = {"morning", "noon", "evening"}


def _uid(prefix: str = "bk") -> str:
    return f"{prefix}_{secrets.token_hex(8)}"


def _iso_z(dt: datetime) -> str:
    return (
        dt.isoformat().replace("+00:00", "Z")
        if dt.tzinfo
        else dt.isoformat() + "Z"
    )


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
        createdAt=_iso_z(row.created_at),
        cancelled=row.cancelled,
        supersededBy=row.superseded_by,
        cancelReason=row.cancel_reason,
    )


def _row_to_view(row: BookingRow) -> SpotBookingView:
    replaced = bool(row.cancelled and (row.cancel_reason == "cut_in" or row.superseded_by))
    return SpotBookingView(
        id=row.id,
        spotId=row.spot_id,  # type: ignore[arg-type]
        date=row.date,
        period=row.period,  # type: ignore[arg-type]
        status="cut_in_replaced" if replaced else "booked",
        plateMasked=mask_plate(row.plate),
        isHost=is_host_plate(row.plate),
        vehicleType=row.vehicle_type,  # type: ignore[arg-type]
        vehicleColor=row.color,  # type: ignore[arg-type]
        supersededBy=row.superseded_by,
    )


def _active_rows(db: Session) -> list[BookingRow]:
    return list(db.scalars(select(BookingRow).where(BookingRow.cancelled.is_(False))).all())


def _today_list_rows(db: Session, date: str) -> list[BookingRow]:
    """Active bookings + cut-in-superseded host rows (struck in UI)."""
    rows = db.scalars(
        select(BookingRow).where(
            BookingRow.date == date,
            or_(
                BookingRow.cancelled.is_(False),
                BookingRow.cancel_reason == "cut_in",
            ),
        )
    ).all()
    return list(rows)


def get_reserved_periods(db: Session, spot_id: str, date: str) -> list[TimePeriod]:
    rows = db.scalars(
        select(BookingRow).where(
            BookingRow.cancelled.is_(False),
            BookingRow.spot_id == spot_id,
            BookingRow.date == date,
        )
    ).all()
    return [r.period for r in rows]  # type: ignore[misc]


def _idle_for_period(reserved: list[str], period: str) -> float:
    """Booked period → 0% idle; free period → 100% idle."""
    return 0.0 if period in reserved else 1.0


def get_spots(db: Session) -> list[SpotStatus]:
    today = today_iso()
    reserved_a = get_reserved_periods(db, "A", today)
    reserved_b = get_reserved_periods(db, "B", today)
    reserved_c = get_reserved_periods(db, BOOKABLE_SPOT, today)

    a_morning = _idle_for_period(reserved_a, "morning")
    a_noon = _idle_for_period(reserved_a, "noon")
    a_evening = _idle_for_period(reserved_a, "evening")
    b_morning = _idle_for_period(reserved_b, "morning")
    b_noon = _idle_for_period(reserved_b, "noon")
    b_evening = _idle_for_period(reserved_b, "evening")
    c_morning = _idle_for_period(reserved_c, "morning")
    c_noon = _idle_for_period(reserved_c, "noon")
    c_evening = _idle_for_period(reserved_c, "evening")

    return [
        SpotStatus(
            id="A",
            maintenance=True,
            bookable=False,
            occupied=False,
            idleIn1h=a_morning,
            idleTonight=a_evening,
            idleMorning=a_morning,
            idleNoon=a_noon,
            idleEvening=a_evening,
            reservedPeriods=reserved_a,
        ),
        SpotStatus(
            id="B",
            maintenance=True,
            bookable=False,
            occupied=False,
            idleIn1h=b_morning,
            idleTonight=b_evening,
            idleMorning=b_morning,
            idleNoon=b_noon,
            idleEvening=b_evening,
            reservedPeriods=reserved_b,
        ),
        SpotStatus(
            id="C",
            maintenance=False,
            bookable=len(reserved_c) < 3,
            occupied=False,
            idleIn1h=c_morning,
            idleTonight=c_evening,
            idleMorning=c_morning,
            idleNoon=c_noon,
            idleEvening=c_evening,
            reservedPeriods=reserved_c,
        ),
    ]


def get_today_bookings(db: Session, date: str | None = None) -> list[SpotBookingView]:
    d = date or today_iso()
    rows = _today_list_rows(db, d)
    rows.sort(
        key=lambda r: (
            SPOT_IDS.index(r.spot_id) if r.spot_id in SPOT_IDS else 99,
            PERIOD_ORDER.index(r.period) if r.period in PERIOD_ORDER else 99,
            # Superseded host first, then active cut-in (stable list UX)
            0 if (r.cancelled and r.cancel_reason == "cut_in") else 1,
            r.created_at.isoformat() if r.created_at else "",
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


def create_cut_in(db: Session, body: CutInBookingBody) -> BookResult:
    """Optimistic ¥5 host cut-in for a host-held period on bay C (default: clock period)."""
    vehicle = normalize_vehicle(body.vehicle)
    if not vehicle.plate.strip():
        return BookResult(ok=False, reason="请先填写车牌号")

    today = today_iso()
    period = body.period or current_idle_period()

    host = db.scalar(
        select(BookingRow).where(
            BookingRow.cancelled.is_(False),
            BookingRow.spot_id == BOOKABLE_SPOT,
            BookingRow.date == today,
            BookingRow.period == period,
        )
    )
    if host is None:
        return BookResult(ok=False, reason="当前时段无可插队的车主预约")
    if not is_host_plate(host.plate):
        return BookResult(ok=False, reason="超级插队仅可插车主（浙ACU6508 / 浙AY75C1）的队")

    new_id = _uid("bk")
    row = BookingRow(
        id=new_id,
        spot_id=BOOKABLE_SPOT,
        session_id=body.sessionId,
        date=today,
        period=period,
        plate=vehicle.plate.strip().upper(),
        color=vehicle.color,
        vehicle_type=vehicle.type,
        created_at=datetime.now(timezone.utc),
        cancelled=False,
    )
    host.cancelled = True
    host.cancel_reason = "cut_in"
    host.superseded_by = new_id
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return BookResult(ok=False, reason="插队失败，请稍后重试")
    db.refresh(row)
    return BookResult(ok=True, reason="超级插队已登记", booking=_row_to_booking(row))

def _restore_host_after_cut_in(db: Session, jumper: BookingRow) -> BookingRow | None:
    """Cancel jumper (caller sets fields) and restore the superseded host row."""
    host = db.scalar(
        select(BookingRow).where(
            BookingRow.superseded_by == jumper.id,
            BookingRow.cancel_reason == "cut_in",
        )
    )
    if host is None:
        return None
    host.cancelled = False
    host.cancel_reason = None
    host.superseded_by = None
    return host


def cancel_cut_in(db: Session, body: CancelCutInBody) -> BookResult:
    """User cancels their own cut-in booking and restores the host occupancy."""
    jumper = db.get(BookingRow, body.bookingId)
    if jumper is None:
        return BookResult(ok=False, reason="找不到该插队预约")
    if jumper.session_id != body.sessionId:
        return BookResult(ok=False, reason="只能取消自己的插队")
    if jumper.cancelled:
        # Idempotent: already cancelled (by user or revoke)
        return BookResult(ok=True, reason="插队已取消，车主占用已恢复")

    jumper.cancelled = True
    jumper.cancel_reason = "user_cancel"
    # Flush first so partial UNIQUE (active spot/date/period) sees jumper gone
    # before host is restored — otherwise SQLite can IntegrityError mid-tx.
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        return BookResult(ok=False, reason="取消插队失败，请稍后重试")
    host = _restore_host_after_cut_in(db, jumper)
    if host is None:
        db.rollback()
        return BookResult(ok=False, reason="找不到被插队的车主预约，无法恢复")
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return BookResult(ok=False, reason="取消插队失败，请稍后重试")
    db.refresh(jumper)
    return BookResult(ok=True, reason="已取消插队，车主占用已恢复", booking=_row_to_booking(jumper))


def revoke_cut_in(db: Session, booking_id: str) -> BookResult:
    """Host/DingTalk signed revoke: cancel jumper + restore host. Idempotent."""
    jumper = db.get(BookingRow, booking_id)
    if jumper is None:
        return BookResult(ok=False, reason="找不到该插队预约")
    if jumper.cancelled:
        # Idempotent: already revoked/cancelled — still return booking for notify.
        return BookResult(
            ok=True,
            reason="此前已撤销，车主占用已是当前状态",
            booking=_row_to_booking(jumper),
        )

    jumper.cancelled = True
    jumper.cancel_reason = "host_revoke"
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        return BookResult(ok=False, reason="撤销失败，请稍后重试")
    host = _restore_host_after_cut_in(db, jumper)
    if host is None:
        # Jumper active but no host link — still cancel jumper so slot frees
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            return BookResult(ok=False, reason="撤销失败，请稍后重试")
        return BookResult(ok=True, reason="已撤销插队，车主占用已恢复", booking=_row_to_booking(jumper))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return BookResult(ok=False, reason="撤销失败，请稍后重试")
    db.refresh(jumper)
    return BookResult(ok=True, reason="已撤销插队，车主占用已恢复", booking=_row_to_booking(jumper))

