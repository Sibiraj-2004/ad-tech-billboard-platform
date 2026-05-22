"""
Image Model
============
Stores metadata for images uploaded to billboard listings.
Actual files are stored on disk (dev) or S3 (prod).

Design:
- is_primary: flag for the main display image
- sort_order: controls image gallery ordering
- thumbnail_path: stores path to auto-generated thumbnail
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Image(Base):
    __tablename__ = "images"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    billboard_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("billboards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── File Metadata ────────────────────────────────────────
    file_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        comment="Path to original uploaded file",
    )
    thumbnail_path: Mapped[str] = mapped_column(
        String(500),
        nullable=True,
        comment="Path to auto-generated thumbnail",
    )
    original_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Original upload filename",
    )
    content_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="MIME type (e.g., image/jpeg)",
    )
    file_size: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="File size in bytes",
    )

    # ── Display Settings ─────────────────────────────────────
    is_primary: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Whether this is the main display image",
    )
    sort_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Controls image ordering in the gallery",
    )

    # ── Timestamps ───────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # ── Relationships ────────────────────────────────────────
    billboard = relationship("Billboard", back_populates="images")

    def __repr__(self) -> str:
        return f"<Image {self.original_filename} (primary={self.is_primary})>"
