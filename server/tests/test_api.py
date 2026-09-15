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
    assert by_id["C"]["idleEvening"] == 0.08


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
