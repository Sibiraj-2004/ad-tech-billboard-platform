"""
Application Configuration
=========================
Uses pydantic-settings to load configuration from environment variables.
All settings are validated at startup — if a required variable is missing,
the app fails fast with a clear error message.
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Application ──────────────────────────────────────────
    APP_NAME: str = "Ad-Tech"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # ── Database ─────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://adtech_user:adtech_password@localhost:5432/adtech_db"
    DATABASE_URL_SYNC: str = "postgresql://adtech_user:adtech_password@localhost:5432/adtech_db"

    # ── JWT Authentication ───────────────────────────────────
    SECRET_KEY: str = "change-this-in-production-to-a-random-32-char-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── CORS ─────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list and sanitize them."""
        origins = []
        for origin in self.CORS_ORIGINS.split(","):
            cleaned = origin.strip().strip("'").strip('"')
            if cleaned.endswith("/"):
                cleaned = cleaned[:-1]
            if cleaned:
                origins.append(cleaned)
        return origins

    # ── File Upload ──────────────────────────────────────────
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 5
    ALLOWED_IMAGE_TYPES: str = "image/jpeg,image/png,image/webp"

    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    @property
    def allowed_image_types_list(self) -> List[str]:
        return [t.strip() for t in self.ALLOWED_IMAGE_TYPES.split(",")]

    # ── Email ────────────────────────────────────────────────
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@adtech.com"

    # ── Razorpay ─────────────────────────────────────────────
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    # ── AI & LLM (Local) ─────────────────────────────────────
    # Use host.docker.internal inside Docker to reach host LLM
    AI_LLM_API_URL: str = "http://host.docker.internal:8000/v1/chat/completions"
    AI_LLM_BEARER_TOKEN: str = "local-hub"
    AI_MODEL_NAME: str = "gemma-4-26b"


@lru_cache()
def get_settings() -> Settings:
    """
    Cached settings instance.
    Using lru_cache ensures settings are loaded only once
    and reused across the application lifecycle.
    """
    return Settings()
