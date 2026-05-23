"""
Middleware Configuration
========================
Registers CORS, request logging, and timing middleware.
"""

import logging
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def register_middleware(app: FastAPI) -> None:
    """Register all middleware on the FastAPI application."""

    # ── CORS Middleware ──────────────────────────────────────
    # Allows the React frontend to make API requests
    origins = settings.cors_origins_list
    
    if "*" in origins:
        # Starlette/FastAPI doesn't allow allow_origins=["*"] when allow_credentials=True.
        # We use allow_origin_regex=".*" to dynamically echo the request's origin, satisfying the browser's credentials rules!
        app.add_middleware(
            CORSMiddleware,
            allow_origin_regex=".*",
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    else:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # ── Request Logging & Timing Middleware ──────────────────
    @app.middleware("http")
    async def request_logging_middleware(request: Request, call_next):
        """
        Logs every request with a unique request ID for traceability.
        Also measures and logs response time.
        """
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id

        start_time = time.time()

        # Log incoming request
        logger.info(
            f"[{request_id}] → {request.method} {request.url.path}"
        )

        response = await call_next(request)

        # Calculate and log response time
        duration_ms = round((time.time() - start_time) * 1000, 2)
        logger.info(
            f"[{request_id}] ← {response.status_code} ({duration_ms}ms)"
        )

        # Attach request ID to response headers for debugging
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{duration_ms}ms"

        return response
