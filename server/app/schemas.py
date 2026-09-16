"""Pydantic request/response models mirroring frontend types."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

SpotId = Literal["A", "B", "C"]
TimePeriod = Literal["morning", "noon", "evening"]
VehicleType = Literal["convertible", "pickup", "ambulance", "police", "taxi", "sedan", "compact", "citycar", "muscle", "van"]
VehicleColor = Literal["black", "white", "gray", "red", "blue"]
BookingStatus = Literal["booked", "cut_in_replaced"]


class VehicleInfo(BaseModel):
    plate: str = Field(max_length=10)
    color: VehicleColor
    type: VehicleType


class SpotStatus(BaseModel):
    id: SpotId
    bookable: bool
    maintenance: bool
    occupied: bool
    idleIn1h: float
    idleTonight: float
    idleMorning: float
    idleNoon: float
    idleEvening: float
    occupiedSince: str | None = None
    reservedPeriods: list[TimePeriod] | None = None
    vehicle: VehicleInfo | None = None


class Booking(BaseModel):
    id: str
    spotId: SpotId
    sessionId: str
    date: str
    period: TimePeriod
    vehicle: VehicleInfo
    createdAt: str
    cancelled: bool
    supersededBy: str | None = None
    cancelReason: str | None = None


class SpotBookingView(BaseModel):
    id: str
    spotId: SpotId
    date: str
    period: TimePeriod
    status: BookingStatus = "booked"
    plateMasked: str
    vehicleType: VehicleType
    vehicleColor: VehicleColor
    supersededBy: str | None = None


class CreateBookingBody(BaseModel):
    sessionId: str = Field(min_length=1, max_length=128)
    date: str  # YYYY-MM-DD
    period: TimePeriod
    vehicle: VehicleInfo


class CutInBookingBody(BaseModel):
    sessionId: str = Field(min_length=1, max_length=128)
    vehicle: VehicleInfo


class BookResult(BaseModel):
    ok: bool
    reason: str | None = None
    booking: Booking | None = None


class HealthResponse(BaseModel):
    status: str = "ok"
