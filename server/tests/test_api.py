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
