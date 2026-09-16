"""HTTP routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import BookResult, Booking, CreateBookingBody, HealthResponse, SpotBookingView, SpotStatus, TimePeriod
from app import service
from app.dingtalk import notify_booking
from app.seed import reset_and_seed

health_router = APIRouter(tags=["health"])
api_router = APIRouter(prefix="/api", tags=["api"])


@health_router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@health_router.get("/readyz")
def readyz(db: Session = Depends(get_db)) -> dict:
    # Simple DB ping
    try:
        db.connection()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=503, detail={"status": "not_ready", "code": "db_unavailable"}) from exc
    return {"status": "ready", "detail": None, "code": None}


@api_router.get("/spots", response_model=list[SpotStatus])
def list_spots(db: Session = Depends(get_db)) -> list[SpotStatus]:
    return service.get_spots(db)


@api_router.get("/bookings/today", response_model=list[SpotBookingView])
def today_bookings(db: Session = Depends(get_db)) -> list[SpotBookingView]:
    return service.get_today_bookings(db)


@api_router.get("/spots/{spot_id}/bookings", response_model=list[SpotBookingView])
def spot_bookings(spot_id: str, db: Session = Depends(get_db)) -> list[SpotBookingView]:
    if spot_id not in service.SPOT_IDS:
        raise HTTPException(status_code=404, detail="Unknown spot")
    return service.get_spot_bookings(db, spot_id)


@api_router.get("/spots/{spot_id}/reserved", response_model=list[TimePeriod])
def reserved_periods(
    spot_id: str,
    date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
    db: Session = Depends(get_db),
) -> list[TimePeriod]:
    if spot_id not in service.SPOT_IDS:
        raise HTTPException(status_code=404, detail="Unknown spot")
    return service.get_reserved_periods(db, spot_id, date)


@api_router.get("/me/bookings", response_model=list[Booking])
def my_bookings(
    sessionId: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
) -> list[Booking]:
    return service.get_my_bookings(db, sessionId)


@api_router.post("/bookings", response_model=BookResult)
def create_booking(request: Request, body: CreateBookingBody, db: Session = Depends(get_db)) -> BookResult:
    result = service.create_booking(db, body)
    if result.ok and result.booking is not None:
        settings = request.app.state.settings
        notify_booking(
            getattr(settings, "dingtalk_webhook_url", None),
            result.booking,
            sec_secret=getattr(settings, "dingtalk_sec_secret", None),
        )
    return result


@api_router.post("/demo/reset")
def demo_reset(request: Request, db: Session = Depends(get_db)) -> dict:
    settings = request.app.state.settings
    if not settings.allow_demo_reset:
        raise HTTPException(status_code=403, detail="Demo reset disabled (set ALLOW_DEMO_RESET=true)")
    n = reset_and_seed(db)
    return {"ok": True, "seeded": n}
