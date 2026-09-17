"""HTTP routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import (
    BookResult,
    Booking,
    CancelCutInBody,
    CreateBookingBody,
    CutInBookingBody,
    HealthResponse,
    SpotBookingView,
    SpotStatus,
    TimePeriod,
)
from app import service
from app.dingtalk import maybe_revoke_url, notify_booking, verify_revoke_sig
from app.seed import reset_and_seed

health_router = APIRouter(tags=["health"])
api_router = APIRouter(prefix="/api", tags=["api"])


def _settings(request: Request):
    return request.app.state.settings


def _notify_cut_in(request: Request, booking: Booking, *, kind: str) -> None:
    settings = _settings(request)
    revoke = maybe_revoke_url(
        getattr(settings, "public_base_url", None),
        getattr(settings, "cut_in_revoke_secret", None),
        booking.id,
    )
    notify_booking(
        getattr(settings, "dingtalk_webhook_url", None),
        booking,
        sec_secret=getattr(settings, "dingtalk_sec_secret", None),
        kind=kind,
        revoke_url=revoke,
    )


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
        settings = _settings(request)
        notify_booking(
            getattr(settings, "dingtalk_webhook_url", None),
            result.booking,
            sec_secret=getattr(settings, "dingtalk_sec_secret", None),
        )
    return result


@api_router.post("/bookings/cut-in", response_model=BookResult)
def cut_in_booking(request: Request, body: CutInBookingBody, db: Session = Depends(get_db)) -> BookResult:
    result = service.create_cut_in(db, body)
    if result.ok and result.booking is not None:
        _notify_cut_in(request, result.booking, kind="cut_in")
    return result


@api_router.post("/bookings/cut-in/cancel", response_model=BookResult)
def cancel_cut_in_booking(
    request: Request, body: CancelCutInBody, db: Session = Depends(get_db)
) -> BookResult:
    result = service.cancel_cut_in(db, body)
    if result.ok and result.booking is not None:
        _notify_cut_in(request, result.booking, kind="cut_in_cancel")
    return result


REVOKE_OK_HTML = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>插队已撤销</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
      margin:0;padding:2rem 1.25rem;background:#f8fafc;color:#0f172a;text-align:center}
    .card{max-width:22rem;margin:2rem auto;padding:1.5rem;border-radius:1.25rem;
      background:#fff;border:1px solid #e2e8f0;box-shadow:0 10px 30px -18px #64748b}
    h1{font-size:1.15rem;margin:0 0 .5rem}
    p{margin:0;font-size:.95rem;color:#475569;line-height:1.5}
  </style>
</head>
<body>
  <div class="card">
    <h1>已撤销插队，车主占用已恢复</h1>
    <p>可以关闭此页。若支付宝已到账，请忽略本操作并线下协商。</p>
  </div>
</body>
</html>
"""

REVOKE_ERR_HTML = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>撤销失败</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
      margin:0;padding:2rem 1.25rem;background:#f8fafc;color:#0f172a;text-align:center}
    .card{max-width:22rem;margin:2rem auto;padding:1.5rem;border-radius:1.25rem;
      background:#fff;border:1px solid #fecaca;box-shadow:0 10px 30px -18px #64748b}
    h1{font-size:1.15rem;margin:0 0 .5rem;color:#b91c1c}
    p{margin:0;font-size:.95rem;color:#475569;line-height:1.5}
  </style>
</head>
<body>
  <div class="card">
    <h1>无法撤销</h1>
    <p>__REASON__</p>
  </div>
</body>
</html>
"""


@api_router.get("/cut-in/revoke", response_class=HTMLResponse)
def revoke_cut_in_link(
    request: Request,
    bookingId: str = Query(..., min_length=1, max_length=64),
    exp: int = Query(...),
    sig: str = Query(..., min_length=8, max_length=128),
    db: Session = Depends(get_db),
):
    """Signed host revoke link from DingTalk. Idempotent; mobile-friendly HTML."""
    settings = _settings(request)
    secret = getattr(settings, "cut_in_revoke_secret", None)
    if not verify_revoke_sig(secret or "", bookingId, exp, sig):
        html = REVOKE_ERR_HTML.replace("__REASON__", "链接无效或已过期，请联系管理员。")
        return HTMLResponse(content=html, status_code=403)
    result = service.revoke_cut_in(db, bookingId)
    if not result.ok:
        html = REVOKE_ERR_HTML.replace("__REASON__", result.reason or "撤销失败，请稍后重试。")
        return HTMLResponse(content=html, status_code=400)
    return HTMLResponse(content=REVOKE_OK_HTML, status_code=200)


@api_router.post("/demo/reset")
def demo_reset(request: Request, db: Session = Depends(get_db)) -> dict:
    settings = request.app.state.settings
    if not settings.allow_demo_reset:
        raise HTTPException(status_code=403, detail="Demo reset disabled (set ALLOW_DEMO_RESET=true)")
    n = reset_and_seed(db)
    return {"ok": True, "seeded": n}
