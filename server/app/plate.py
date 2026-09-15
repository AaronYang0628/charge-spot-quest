"""Plate masking helpers (Chinese-plate friendly)."""

from __future__ import annotations


def mask_plate(plate: str) -> str:
    """Mask plate for privacy: 浙A12348 → 浙A···8"""
    p = plate.strip().upper()
    if not p:
        return "···"
    if len(p) <= 3:
        return f"{p[0] if p else ''}···"
    return f"{p[:2]}···{p[-1]}"
