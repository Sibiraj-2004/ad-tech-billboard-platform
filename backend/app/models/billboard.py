"""
Billboard Model
================
Core entity representing a physical or digital billboard available for booking.

Design Decisions:
- Three pricing tiers (daily/weekly/monthly) for flexible booking
- Latitude/longitude stored as Numeric for precision (not Float)
- JSONB specifications field for extensible metadata (dimensions, material, etc.)
- Status: active (default), inactive, or rejected
- Admin can still deactivate or reject listings if needed
"""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Numeric, String, Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Billboard(Base):
    __tablename__ = "billboards"

    # ── Primary Key ──────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # ── Foreign Keys ─────────────────────────────────────────
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Billboard owner (user with 'owner' role)",
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Billboard category",
    )

    # ── Billboard Details ────────────────────────────────────
    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        index=True,
        comment="Billboard listing title",
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=True,
        comment="Detailed description",
    )

    # ── Pricing ──────────────────────────────────────────────
    price_per_day: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        comment="Daily rental price",
    )
    price_per_week: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=True,
        comment="Weekly rental price (discount)",
    )
    price_per_month: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=True,
        comment="Monthly rental price (discount)",
    )

    # ── Location ─────────────────────────────────────────────
    address: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        comment="Full street address",
    )
    latitude: Mapped[Decimal] = mapped_column(
        Numeric(10, 7),
        nullable=True,
        comment="GPS latitude",
    )
    longitude: Mapped[Decimal] = mapped_column(
        Numeric(10, 7),
        nullable=True,
        comment="GPS longitude",
    )
    city: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        comment="City name for filtering",
    )
    state: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        comment="State/province for filtering",
    )

    # ── Specifications ───────────────────────────────────────
    size_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="medium",
        index=True,
        comment="Size: small, medium, large, digital",
    )
    is_illuminated: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Whether the billboard has lighting",
    )
    specifications: Mapped[dict] = mapped_column(
        JSONB,
        nullable=True,
        default=dict,
        comment="Flexible specs: dimensions, material, traffic count, etc.",
    )

    # ── Status ───────────────────────────────────────────────
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="active",
        index=True,
        comment="Status: active, inactive, pending, rejected",
    )

    # ── Timestamps ───────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # ── Relationships ────────────────────────────────────────
    owner = relationship("User", back_populates="billboards")
    category = relationship("Category", back_populates="billboards")
    bookings = relationship("Booking", back_populates="billboard", lazy="selectin")
    favorites = relationship("Favorite", back_populates="billboard", lazy="selectin")
    images = relationship(
        "Image", back_populates="billboard", lazy="selectin",
        order_by="Image.sort_order",
    )
    analytics = relationship("Analytics", back_populates="billboard", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Billboard {self.title} ({self.status})>"
