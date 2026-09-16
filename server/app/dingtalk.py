"""Optional DingTalk robot notify after successful booking (webhook + 加签)."""

from __future__ import annotations

import base64
import hashlib
import hmac
import logging
import time
from urllib.parse import quote_plus

import httpx

from app.schemas import Booking

logger = logging.getLogger(__name__)

PERIOD_CN = {"morning": "早", "noon": "中", "evening": "晚"}
TYPE_CN = {
    "ambulance": "救护车",
    "police": "警车",
    "taxi": "出租车",
    "sedan": "经典轿车",
    "compact": "迷你车",
    "citycar": "都市轿车",
    "muscle": "肌肉跑车",
    "van": "厢式货车",
    "convertible": "敞篷车",
    "pickup": "皮卡",
}
COLOR_CN = {
    "black": "黑色",
    "white": "白色",
    "gray": "灰色",
    "red": "红色",
    "blue": "蓝色",
}
SPOT_LABELS = {"A": "647", "B": "648", "C": "649"}


def format_booking_text(booking: Booking, *, kind: str = "booking") -> str:
    spot = SPOT_LABELS.get(booking.spotId, booking.spotId)
    period = PERIOD_CN.get(booking.period, booking.period)
    vtype = TYPE_CN.get(booking.vehicle.type, booking.vehicle.type)
    color = COLOR_CN.get(booking.vehicle.color, booking.vehicle.color)
    title = "【邻里充电】超级插队" if kind == "cut_in" else "【邻里充电】新预约"
    return (
        f"{title}\n"
        f"车位:{spot}\n"
        f"日期:{booking.date}\n"
        f"时段:{period}\n"
        f"车牌:{booking.vehicle.plate}\n"
        f"车型/颜色:{vtype}/{color}"
    )


def signed_webhook_url(webhook_url: str, sec_secret: str, *, now_ms: int | None = None) -> str:
    """Append DingTalk 加签 timestamp + sign query params."""
    timestamp = str(now_ms if now_ms is not None else int(time.time() * 1000))
    string_to_sign = f"{timestamp}\n{sec_secret}"
    digest = hmac.new(
        sec_secret.encode("utf-8"),
        string_to_sign.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).digest()
    sign = quote_plus(base64.b64encode(digest))
    sep = "&" if "?" in webhook_url else "?"
    return f"{webhook_url}{sep}timestamp={timestamp}&sign={sign}"


def notify_booking(
    webhook_url: str | None,
    booking: Booking,
    *,
    sec_secret: str | None = None,
    kind: str = "booking",
) -> None:
    """POST text message to DingTalk custom robot. Never raises to caller.

    Requires both DINGTALK_WEBHOOK_URL and DINGTALK_SEC_SECRET. If webhook is
    set but SEC is missing, log a warning and skip.
    """
    url = (webhook_url or "").strip()
    if not url:
        return
    secret = (sec_secret or "").strip()
    if not secret:
        logger.warning("DingTalk notify skipped: DINGTALK_SEC_SECRET not set")
        return
    payload = {"msgtype": "text", "text": {"content": format_booking_text(booking, kind=kind)}}
    try:
        signed = signed_webhook_url(url, secret)
        with httpx.Client(timeout=5.0) as client:
            resp = client.post(signed, json=payload)
            if resp.status_code >= 400:
                logger.warning(
                    "DingTalk notify HTTP %s: %s",
                    resp.status_code,
                    (resp.text or "")[:200],
                )
            else:
                try:
                    body = resp.json()
                except Exception:  # noqa: BLE001
                    body = None
                if isinstance(body, dict) and body.get("errcode", 0) not in (0, None):
                    logger.warning(
                        "DingTalk notify errcode=%s errmsg=%s",
                        body.get("errcode"),
                        body.get("errmsg"),
                    )
    except Exception as exc:  # noqa: BLE001
        logger.warning("DingTalk notify failed: %s", exc)
