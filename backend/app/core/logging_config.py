"""
Logging Configuration
======================
Sets up structured logging for the application.
- Development: Human-readable format with colors
- Production: JSON format for log aggregation tools
"""

import logging
import sys

from app.config import get_settings


def setup_logging() -> None:
    """Configure application-wide logging."""
    settings = get_settings()

    # Determine log level based on environment
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    # ── Formatter ────────────────────────────────────────────
    if settings.APP_ENV == "production":
        # JSON format for production (parseable by log aggregators)
        formatter = logging.Formatter(
            '{"time": "%(asctime)s", "level": "%(levelname)s", '
            '"logger": "%(name)s", "message": "%(message)s"}'
        )
    else:
        # Human-readable format for development
        formatter = logging.Formatter(
            "%(asctime)s │ %(levelname)-8s │ %(name)-30s │ %(message)s",
            datefmt="%H:%M:%S",
        )

    # ── Stream Handler (stdout) ──────────────────────────────
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    handler.setLevel(log_level)

    # ── Root Logger ──────────────────────────────────────────
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.handlers = [handler]

    # Suppress noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if settings.DEBUG else logging.WARNING
    )
