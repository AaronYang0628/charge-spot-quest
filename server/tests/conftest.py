"""Pytest fixtures — isolated in-memory SQLite."""

from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

# Force SQLite before app imports settings cache
os.environ.pop("DATABASE_URL", None)
os.environ["ALLOW_DEMO_RESET"] = "true"


@pytest.fixture()
def client(tmp_path, monkeypatch):
    db_path = tmp_path / "test.sqlite"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("ALLOW_DEMO_RESET", "true")

    from app.config import get_settings
    from app.db import reset_engine

    get_settings.cache_clear()
    reset_engine()

    from app.config import Settings
    from app.main import create_app

    settings = Settings(database_url=f"sqlite:///{db_path}", allow_demo_reset=True)
    app = create_app(settings)
    with TestClient(app) as c:
        yield c

    reset_engine()
    get_settings.cache_clear()
