"""FastAPI entrypoint for Charge Spot Quest API."""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.config import Settings, get_settings
from app.db import Base, get_engine, get_session_factory
from app.routes import api_router, health_router
from app.seed import seed_if_empty

logger = logging.getLogger(__name__)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        engine = get_engine(settings)
        Base.metadata.create_all(bind=engine)
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
