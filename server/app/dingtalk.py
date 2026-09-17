"""Optional DingTalk robot notify after successful booking (webhook + 加签)."""

from __future__ import annotations

import base64
import hashlib
import hmac
import logging
import time
from urllib.parse import quote, quote_plus

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

# Signed revoke links stay valid long enough for host Alipay offline check.
REVOKE_TTL_SEC = 72 * 3600


def build_revoke_url(
    public_base_url: str,
    revoke_secret: str,
    booking_id: str,
    *,
    ttl_sec: int = REVOKE_TTL_SEC,
    now: int | None = None,
) -> str:
    """HMAC-signed GET /api/cut-in/revoke URL for DingTalk (markdown/text)."""
    base = public_base_url.strip().rstrip("/")
    exp = int(now if now is not None else time.time()) + ttl_sec
    msg = f"{booking_id}.{exp}"
    sig = hmac.new(
        revoke_secret.encode("utf-8"),
        msg.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()
    return (
        f"{base}/api/cut-in/revoke"
        f"?bookingId={quote(booking_id, safe='')}"
        f"&exp={exp}&sig={sig}"
    )


def verify_revoke_sig(
    revoke_secret: str,
    booking_id: str,
    exp: int,
    sig: str,
    *,
    now: int | None = None,
) -> bool:
    """Return True if sig matches and exp is still in the future."""
    secret = (revoke_secret or "").strip()
    if not secret or not booking_id or not sig:
        return False
    ts = int(now if now is not None else time.time())
    if exp < ts:
        return False
    msg = f"{booking_id}.{exp}"
    expected = hmac.new(
        secret.encode("utf-8"),
        msg.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, sig)


def format_booking_text(
    booking: Booking,
    *,
    kind: str = "booking",
    revoke_url: str | None = None,
    note: str | None = None,
) -> str:
    spot = SPOT_LABELS.get(booking.spotId, booking.spotId)
    period = PERIOD_CN.get(booking.period, booking.period)
    vtype = TYPE_CN.get(booking.vehicle.type, booking.vehicle.type)
    color = COLOR_CN.get(booking.vehicle.color, booking.vehicle.color)
    if kind == "cut_in":
        title = "【邻里充电】超级插队"
    elif kind == "cut_in_cancel":
        title = "【邻里充电】取消插队"
    elif kind == "cut_in_revoked":
        title = "【邻里充电】插队已撤销 · 车主占用已恢复"
    elif kind == "cut_in_already_revoked":
        title = "【邻里充电】此前已撤销 · 车主占用已是当前状态"
    elif kind == "cut_in_revoke_failed":
        title = "【邻里充电】插队撤销失败"
    else:
        title = "【邻里充电】新预约"
    lines = [
        title,
        f"车位:{spot}",
        f"日期:{booking.date}",
        f"时段:{period}",
        f"车牌:{booking.vehicle.plate}",
        f"车型/颜色:{vtype}/{color}",
    ]
    if note:
        lines.append(f"说明:{note}")
    if revoke_url and kind in ("cut_in", "cut_in_cancel"):
        lines.append("")
        lines.append("若未收到支付宝¥5，可点此撤销插队并恢复车主占用：")
        lines.append(revoke_url)
    return "\n".join(lines)


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


def _post_dingtalk_text(
    webhook_url: str | None,
    content: str,
    *,
    sec_secret: str | None = None,
) -> None:
    """POST a text message. Never raises. Skip quietly if env unset."""
    url = (webhook_url or "").strip()
    if not url:
        return
    secret = (sec_secret or "").strip()
    if not secret:
        logger.warning("DingTalk notify skipped: DINGTALK_SEC_SECRET not set")
        return
    payload = {"msgtype": "text", "text": {"content": content}}
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


def notify_booking(
    webhook_url: str | None,
    booking: Booking,
    *,
    sec_secret: str | None = None,
    kind: str = "booking",
    revoke_url: str | None = None,
    note: str | None = None,
) -> None:
    """POST text message to DingTalk custom robot. Never raises to caller.

    Requires both DINGTALK_WEBHOOK_URL and DINGTALK_SEC_SECRET. If webhook is
    set but SEC is missing, log a warning and skip.
    """
    _post_dingtalk_text(
        webhook_url,
        format_booking_text(booking, kind=kind, revoke_url=revoke_url, note=note),
        sec_secret=sec_secret,
    )


def notify_text(
    webhook_url: str | None,
    content: str,
    *,
    sec_secret: str | None = None,
) -> None:
    """POST free-form text (e.g. revoke failure without a booking row)."""
    _post_dingtalk_text(webhook_url, content, sec_secret=sec_secret)


def maybe_revoke_url(
    public_base_url: str | None,
    revoke_secret: str | None,
    booking_id: str,
) -> str | None:
    base = (public_base_url or "").strip()
    secret = (revoke_secret or "").strip()
    if not base or not secret:
        return None
    return build_revoke_url(base, secret, booking_id)
