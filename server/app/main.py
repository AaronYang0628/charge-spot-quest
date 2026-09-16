"""FastAPI entrypoint for Charge Spot Quest API (+ optional SPA static)."""

from __future__ import annotations

import logging
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app import __version__
from app.config import Settings, get_settings
from app.db import Base, get_engine, get_session_factory
from app.schema_migrate import ensure_schema
from app.routes import api_router, health_router
from app.seed import seed_if_empty

logger = logging.getLogger(__name__)

# Paths that must never be swallowed by the SPA fallback.
_SPA_RESERVED_PREFIXES = (
    "api",
    "health",
    "readyz",
    "docs",
    "redoc",
    "openapi.json",
)


def _resolve_static_dir() -> Path | None:
    raw = os.environ.get("STATIC_DIR", "/app/static")
    root = Path(raw)
    if (root / "index.html").is_file():
        return root
    return None


def _mount_spa(app: FastAPI, static_dir: Path) -> None:
    """Serve Vite dist: hashed assets + SPA fallback. Does not shadow API/docs."""
    assets = static_dir / "assets"
    if assets.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets)), name="assets")

    @app.get("/")
    async def spa_index() -> FileResponse:
        return FileResponse(static_dir / "index.html")

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str) -> FileResponse:
        first = full_path.split("/", 1)[0]
        if first in _SPA_RESERVED_PREFIXES or full_path in _SPA_RESERVED_PREFIXES:
            raise HTTPException(status_code=404, detail="Not Found")

        candidate = static_dir / full_path
        # Prevent path traversal
        try:
            candidate.resolve().relative_to(static_dir.resolve())
        except ValueError as exc:
            raise HTTPException(status_code=404, detail="Not Found") from exc

        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(static_dir / "index.html")

    logger.info("SPA static mounted from %s", static_dir)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        engine = get_engine(settings)
        Base.metadata.create_all(bind=engine)
        ensure_schema(engine)
        factory = get_session_factory(settings)
        db = factory()
        try:
            n = seed_if_empty(db)
            if n:
                logger.info("Seeded %s demo bookings", n)
        finally:
            db.close()
        app.state.settings = settings
        logger.info(
            "Charge Spot Quest API started env=%s db=%s",
            settings.app_env,
            "postgres" if settings.database_url else "sqlite",
        )
        yield

    app = FastAPI(
        title="Charge Spot Quest API",
        version=__version__,
        description="Thin booking API for 邻里互助 · 共享充电",
        lifespan=lifespan,
    )

    origins = settings.cors_origin_list
    # When allowing all origins, credentials must be false (Starlette CORS rule).
    allow_credentials = origins != ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=allow_credentials,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(api_router)

    static_dir = _resolve_static_dir()
    if static_dir is not None:
        _mount_spa(app, static_dir)

    return app


def run() -> None:
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.app_env == "development",
    )


app = create_app()
