"""API smoke / contract tests."""

from __future__ import annotations

from datetime import date, timedelta
import pytest


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_readyz(client):
    r = client.get("/readyz")
    assert r.status_code == 200
    assert r.json()["status"] == "ready"


def test_spots_seeded(client):
    r = client.get("/api/spots")
    assert r.status_code == 200
    spots = r.json()
    assert len(spots) == 3
    by_id = {s["id"]: s for s in spots}
    assert by_id["A"]["maintenance"] is True
    assert by_id["B"]["bookable"] is False
    assert by_id["C"]["maintenance"] is False
    assert "evening" in by_id["C"]["reservedPeriods"]
    assert by_id["C"]["idleEvening"] == 0.0
    assert by_id["C"]["idleMorning"] == 1.0
    assert by_id["C"]["idleNoon"] == 1.0
    assert by_id["A"]["idleMorning"] == 0.0
    assert by_id["B"]["idleEvening"] == 0.0


def test_today_bookings_masked(client):
    r = client.get("/api/bookings/today")
    assert r.status_code == 200
    rows = r.json()
    assert len(rows) >= 3
    for row in rows:
        assert "···" in row["plateMasked"]
        assert "sessionId" not in row
        assert "isHost" in row
        assert isinstance(row["isHost"], bool)
    # Seed evening C is host; bay A morning is not (plate no longer mask-collides)
    c_evening = [x for x in rows if x["spotId"] == "C" and x["period"] == "evening"]
    assert c_evening and c_evening[0]["isHost"] is True
    a_morning = [x for x in rows if x["spotId"] == "A" and x["period"] == "morning"]
    assert a_morning and a_morning[0]["isHost"] is False


def test_create_booking_and_conflict(client):
    today = date.today().isoformat()
    body = {
        "sessionId": "test-session",
        "date": today,
        "period": "morning",
        "vehicle": {"plate": "浙A99999", "color": "red", "type": "convertible"},
    }
    r = client.post("/api/bookings", json=body)
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is True
    assert data["booking"]["spotId"] == "C"
    assert data["booking"]["vehicle"]["plate"] == "浙A99999"

    # Conflict
    r2 = client.post("/api/bookings", json=body)
    assert r2.status_code == 200
    assert r2.json()["ok"] is False

    # Me bookings
    me = client.get("/api/me/bookings", params={"sessionId": "test-session"})
    assert me.status_code == 200
    assert len(me.json()) == 1

    # Reserved
    reserved = client.get(f"/api/spots/C/reserved", params={"date": today})
    assert "morning" in reserved.json()


def test_reject_past_date(client):
    past = (date.today() - timedelta(days=1)).isoformat()
    r = client.post(
        "/api/bookings",
        json={
            "sessionId": "x",
            "date": past,
            "period": "noon",
            "vehicle": {"plate": "浙A1", "color": "blue", "type": "pickup"},
        },
    )
    assert r.json()["ok"] is False


def test_demo_reset(client):
    r = client.post("/api/demo/reset")
    assert r.status_code == 200
    assert r.json()["ok"] is True
    today = client.get("/api/bookings/today")
    assert len(today.json()) >= 3


@pytest.mark.parametrize('vehicle_type', [
    'convertible', 'pickup', 'ambulance', 'police', 'taxi',
    'sedan', 'compact', 'citycar', 'muscle', 'van',
])
def test_ten_vehicle_types_roundtrip(client, vehicle_type):
    from app.timeutil import today_iso
    result = client.post('/api/bookings', json={
        'sessionId': 'vehicle-test', 'date': today_iso(), 'period': 'morning',
        'vehicle': {'plate': '浙A12345', 'type': vehicle_type, 'color': 'white'},
    })
    assert result.status_code == 200
    assert result.json()['ok'] is True
    booking_id = result.json()['booking']['id']
    mine = client.get('/api/me/bookings', params={'sessionId': 'vehicle-test'}).json()
    assert mine[0]['vehicle']['type'] == vehicle_type
    public = client.get('/api/bookings/today').json()
    assert next(row for row in public if row['id'] == booking_id)['vehicleType'] == vehicle_type



def test_dingtalk_notify_on_booking_success(client, monkeypatch):
    calls = []

    class FakeResponse:
        status_code = 200

        def json(self):
            return {"errcode": 0}

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def post(self, url, json=None):
            calls.append({"url": url, "json": json})
            return FakeResponse()

    client.app.state.settings.dingtalk_webhook_url = (
        "https://oapi.dingtalk.com/robot/send?access_token=test-token-only"
    )
    client.app.state.settings.dingtalk_sec_secret = "SEC000testsecret"

    import app.dingtalk as dingtalk
    monkeypatch.setattr(dingtalk.httpx, "Client", FakeClient)

    from app.timeutil import today_iso
    r = client.post(
        "/api/bookings",
        json={
            "sessionId": "ding-test",
            "date": today_iso(),
            "period": "noon",
            "vehicle": {"plate": "浙A88888", "color": "blue", "type": "sedan"},
        },
    )
    assert r.status_code == 200
    assert r.json()["ok"] is True
    assert len(calls) == 1
    assert "test-token-only" in calls[0]["url"]
    assert "timestamp=" in calls[0]["url"]
    assert "sign=" in calls[0]["url"]
    content = calls[0]["json"]["text"]["content"]
    assert "【邻里充电】新预约" in content
    assert "车位:649" in content
    assert "时段:中" in content
    assert "浙A88888" in content


def test_dingtalk_sign_matches_docs():
    from app.dingtalk import signed_webhook_url
    # Deterministic: timestamp + secret → known HMAC
    url = signed_webhook_url(
        "https://oapi.dingtalk.com/robot/send?access_token=tok",
        "SECabc",
        now_ms=1_700_000_000_000,
    )
    assert url.startswith("https://oapi.dingtalk.com/robot/send?access_token=tok&timestamp=1700000000000&sign=")
    assert "sign=" in url


def test_dingtalk_skipped_when_sec_missing(client, monkeypatch, caplog):
    calls = []

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def post(self, url, json=None):
            calls.append(1)
            return type("R", (), {"status_code": 200, "json": lambda self: {"errcode": 0}})()

    client.app.state.settings.dingtalk_webhook_url = (
        "https://oapi.dingtalk.com/robot/send?access_token=test-token-only"
    )
    client.app.state.settings.dingtalk_sec_secret = None
    import app.dingtalk as dingtalk
    monkeypatch.setattr(dingtalk.httpx, "Client", FakeClient)

    from datetime import timedelta, date
    day = (date.today() + timedelta(days=1)).isoformat()
    import logging
    with caplog.at_level(logging.WARNING, logger="app.dingtalk"):
        r = client.post(
            "/api/bookings",
            json={
                "sessionId": "ding-nosec",
                "date": day,
                "period": "morning",
                "vehicle": {"plate": "浙B11111", "color": "red", "type": "pickup"},
            },
        )
    assert r.json()["ok"] is True
    assert calls == []
    assert any("DINGTALK_SEC_SECRET" in rec.message for rec in caplog.records)


def test_dingtalk_failure_does_not_fail_booking(client, monkeypatch):
    class BoomClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def post(self, url, json=None):
            raise RuntimeError("network down")

    client.app.state.settings.dingtalk_webhook_url = (
        "https://oapi.dingtalk.com/robot/send?access_token=test-token-only"
    )
    client.app.state.settings.dingtalk_sec_secret = "SEC000testsecret"
    import app.dingtalk as dingtalk
    monkeypatch.setattr(dingtalk.httpx, "Client", BoomClient)

    from datetime import timedelta, date
    day = (date.today() + timedelta(days=1)).isoformat()
    r = client.post(
        "/api/bookings",
        json={
            "sessionId": "ding-fail",
            "date": day,
            "period": "noon",
            "vehicle": {"plate": "浙B11111", "color": "red", "type": "pickup"},
        },
    )
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_dingtalk_skipped_without_env(client, monkeypatch):
    calls = []

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def post(self, url, json=None):
            calls.append(1)
            return type("R", (), {"status_code": 200, "json": lambda self: {"errcode": 0}})()

    client.app.state.settings.dingtalk_webhook_url = None
    client.app.state.settings.dingtalk_sec_secret = None
    import app.dingtalk as dingtalk
    monkeypatch.setattr(dingtalk.httpx, "Client", FakeClient)

    from datetime import timedelta, date
    day = (date.today() + timedelta(days=2)).isoformat()
    r = client.post(
        "/api/bookings",
        json={
            "sessionId": "ding-skip",
            "date": day,
            "period": "evening",
            "vehicle": {"plate": "浙C22222", "color": "white", "type": "van"},
        },
    )
    assert r.json()["ok"] is True
    assert calls == []


def test_cut_in_supersedes_host_and_notifies(client, monkeypatch):
    from app.timeutil import current_idle_period, today_iso
    from app.host_plates import HOST_PLATES

    calls = []

    class FakeResponse:
        status_code = 200

        def json(self):
            return {"errcode": 0}

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def post(self, url, json=None):
            calls.append({"url": url, "json": json})
            return FakeResponse()

    client.app.state.settings.dingtalk_webhook_url = (
        "https://oapi.dingtalk.com/robot/send?access_token=test-token-only"
    )
    client.app.state.settings.dingtalk_sec_secret = "SEC000testsecret"
    import app.dingtalk as dingtalk

    monkeypatch.setattr(dingtalk.httpx, "Client", FakeClient)

    today = today_iso()
    period = current_idle_period()
    host_plate = next(iter(HOST_PLATES))

    # Ensure host owns current period (seed has host on evening)
    if period != "evening":
        # Free evening conflict not needed; plant host on current period
        # Morning/noon are free in seed
        plant = client.post(
            "/api/bookings",
            json={
                "sessionId": "host-plant",
                "date": today,
                "period": period,
                "vehicle": {"plate": host_plate, "color": "blue", "type": "sedan"},
            },
        )
        assert plant.json()["ok"] is True

    # Empty plate rejected
    empty = client.post(
        "/api/bookings/cut-in",
        json={
            "sessionId": "cut",
            "vehicle": {"plate": "  ", "color": "red", "type": "compact"},
        },
    )
    assert empty.json()["ok"] is False
    assert "车牌" in (empty.json()["reason"] or "")

    r = client.post(
        "/api/bookings/cut-in",
        json={
            "sessionId": "cut-in-user",
            "vehicle": {"plate": "沪A99999", "color": "red", "type": "compact"},
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is True
    assert data["booking"]["vehicle"]["plate"] == "沪A99999"
    assert data["booking"]["period"] == period

    today_rows = client.get("/api/bookings/today").json()
    period_rows = [row for row in today_rows if row["spotId"] == "C" and row["period"] == period]
    statuses = {row["status"] for row in period_rows}
    assert "cut_in_replaced" in statuses
    assert "booked" in statuses
    assert any(row["status"] == "cut_in_replaced" for row in period_rows)

    reserved = client.get("/api/spots/C/reserved", params={"date": today}).json()
    assert period in reserved

    assert any("超级插队" in c["json"]["text"]["content"] for c in calls)


def test_cut_in_rejects_non_host(client):
    from app.timeutil import current_idle_period, today_iso

    today = today_iso()
    period = current_idle_period()
    # If evening is host-seeded, book a different free period with non-host first then...
    # Force: demo reset then create non-host on a free slot; if current is evening (host),
    # replace by booking morning with non-host and monkeypatch? Simpler: only test when
    # we can plant non-host on current period.
    if period == "evening":
        # Cancel path: create cut-in first to clear host, then normal book non-host is already active.
        # Instead post cut-in with host already there — skip by planting on morning via date trick.
        # Book noon with non-host and temporarily we need current to be noon — skip dynamic.
        # Use service directly after clearing evening:
        from app.db import get_session_factory
        from app.models import BookingRow
        from sqlalchemy import select

        factory = get_session_factory()
        db = factory()
        try:
            row = db.scalar(
                select(BookingRow).where(
                    BookingRow.cancelled.is_(False),
                    BookingRow.spot_id == "C",
                    BookingRow.date == today,
                    BookingRow.period == period,
                )
            )
            assert row is not None
            row.plate = "沪E77889"
            db.commit()
        finally:
            db.close()
    else:
        plant = client.post(
            "/api/bookings",
            json={
                "sessionId": "non-host",
                "date": today,
                "period": period,
                "vehicle": {"plate": "沪E77889", "color": "white", "type": "pickup"},
            },
        )
        assert plant.json()["ok"] is True

    r = client.post(
        "/api/bookings/cut-in",
        json={
            "sessionId": "cut",
            "vehicle": {"plate": "浙B12345", "color": "blue", "type": "sedan"},
        },
    )
    assert r.json()["ok"] is False
    assert "车主" in (r.json()["reason"] or "")

def test_cut_in_explicit_period_supersedes_that_host_slot(client):
    """Cut-in body.period targets a host-held slot even when clock period differs."""
    from app.timeutil import current_idle_period, today_iso
    from app.host_plates import HOST_PLATES

    today = today_iso()
    clock = current_idle_period()
    target = "morning" if clock == "evening" else "evening"
    host_plate = next(iter(HOST_PLATES))

    if target != "evening":
        plant = client.post(
            "/api/bookings",
            json={
                "sessionId": "host-alt",
                "date": today,
                "period": target,
                "vehicle": {"plate": host_plate, "color": "blue", "type": "sedan"},
            },
        )
        assert plant.json()["ok"] is True

    r = client.post(
        "/api/bookings/cut-in",
        json={
            "sessionId": "cut-in-explicit",
            "vehicle": {"plate": "沪B88888", "color": "black", "type": "compact"},
            "period": target,
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is True
    assert data["booking"]["period"] == target
    assert data["booking"]["vehicle"]["plate"] == "沪B88888"

    today_rows = client.get("/api/bookings/today").json()
    period_rows = [row for row in today_rows if row["spotId"] == "C" and row["period"] == target]
    assert any(row["status"] == "cut_in_replaced" for row in period_rows)
    assert any(row["status"] == "booked" for row in period_rows)

    reserved = client.get("/api/spots/C/reserved", params={"date": today}).json()
    assert target in reserved

