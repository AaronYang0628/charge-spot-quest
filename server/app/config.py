"""Application settings."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# server/ package root (parent of app/)
SERVER_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SQLITE = SERVER_ROOT / "data" / "chargespot.sqlite"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8080
    log_level: str = "INFO"

    # Prefer Postgres via DATABASE_URL; fall back to local SQLite for demos.
    database_url: str | None = None

    # When true, POST /api/demo/reset is allowed.
    allow_demo_reset: bool = False

    # Full DingTalk custom-robot webhook URL (optional). Never commit the real token.
    dingtalk_webhook_url: str | None = None
    # DingTalk 加签 secret (SEC). Required together with webhook URL.
    dingtalk_sec_secret: str | None = None

    # Comma-separated origins; empty / * → allow all (local Vite + same-origin later).
    cors_origins: str = "*"

    @property
    def sqlalchemy_url(self) -> str:
        if self.database_url:
            url = self.database_url
            # Normalize classic postgres:// → postgresql+psycopg://
            if url.startswith("postgres://"):
                url = "postgresql+psycopg://" + url[len("postgres://") :]
            elif url.startswith("postgresql://") and "+psycopg" not in url:
                url = "postgresql+psycopg://" + url[len("postgresql://") :]
            return url
        DEFAULT_SQLITE.parent.mkdir(parents=True, exist_ok=True)
        return f"sqlite:///{DEFAULT_SQLITE}"

    @property
    def cors_origin_list(self) -> list[str]:
        raw = (self.cors_origins or "*").strip()
        if raw == "*":
            return ["*"]
        return [o.strip() for o in raw.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
