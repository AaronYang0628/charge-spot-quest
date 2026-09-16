"""Host / owner plates that may be superseded by paid cut-in."""

from __future__ import annotations

HOST_PLATES = frozenset({"浙ACU6508", "浙AY75C1"})


def normalize_plate(plate: str | None) -> str:
    return (plate or "").strip().upper()


def is_host_plate(plate: str | None) -> bool:
    n = normalize_plate(plate)
    return bool(n) and n in HOST_PLATES
