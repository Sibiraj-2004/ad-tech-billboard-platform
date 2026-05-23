"""
Ad-Tech Platform — FastAPI Application Factory
================================================
Entry point for the backend application.

Creates the FastAPI app, registers middleware and exception handlers,
includes API routes, and configures static file serving for uploads.
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import setup_logging
from app.core.middleware import register_middleware

settings = get_settings()

# ── Setup logging before anything else ───────────────────────
setup_logging()
logger = logging.getLogger(__name__)


# ── Application Lifespan ─────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and shutdown events.
    - Startup: Log app info, create upload directories, print allowed CORS origins
    - Shutdown: Clean up resources
    """
    logger.info(f"🚀 {settings.APP_NAME} starting up ({settings.APP_ENV})")
    logger.info(f"🔒 Allowed CORS Origins: {settings.cors_origins_list}")

    # Ensure upload directory exists
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    yield

    logger.info(f"🛑 {settings.APP_NAME} shutting down")


# ── Create FastAPI Application ───────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    description="Digital Billboard Booking SaaS Platform — API Documentation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── Register Middleware ──────────────────────────────────────
register_middleware(app)

# ── Register Exception Handlers ─────────────────────────────
register_exception_handlers(app)

# ── Include API Routes ───────────────────────────────────────
from app.api.v1.router import api_router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# ── Static Files (serve uploaded images) ─────────────────────
upload_path = Path(settings.UPLOAD_DIR)
upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")


# ── Health Check ─────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for Docker/load balancer."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
    }


@app.get("/", tags=["Root"])
async def root():
    """API root — redirect to docs."""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "docs": "/docs",
        "health": "/health",
    }
