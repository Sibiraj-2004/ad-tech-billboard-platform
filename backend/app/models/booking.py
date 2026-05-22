"""
Booking Model
==============
Represents a reservation of a billboard for a date range.

Key Design Decisions:
- Date range (start_date, end_date) with overlap detection via SQL queries
- Total price calculated at booking time (not derived) to lock in the price
- Status workflow: pending → confirmed → completed, or cancelled at any point
- Row-level locking used in the service layer to prevent race conditions
"""

import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Date, DateTime, ForeignKey, Numeric, String, Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Booking(Base):
    __tablename__ = "bookings"

    # ── Primary Key ──────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # ── Foreign Keys ─────────────────────────────────────────
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="User who made the booking",
    )
    billboard_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("billboards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Billboard being booked",
    )

    # ── Booking Details ──────────────────────────────────────
    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        comment="Booking start date (inclusive)",
    )
    end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        comment="Booking end date (inclusive)",
    )
    total_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        comment="Total booking price (locked at booking time)",
    )

    # ── Status ───────────────────────────────────────────────
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",
        index=True,
        comment="Status: pending, confirmed, cancelled, completed",
    )
    notes: Mapped[str] = mapped_column(
        Text,
        nullable=True,
        comment="Additional notes from the booker",
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
    user = relationship("User", back_populates="bookings")
    billboard = relationship("Billboard", back_populates="bookings")
    invoice = relationship("Invoice", back_populates="booking", uselist=False)

    @property
    def has_invoice(self) -> bool:
        # Safe check to see if invoice is loaded, avoiding lazy-load crashes in async
        return "invoice" in self.__dict__ and self.invoice is not None

    @property
    def billboard_title(self) -> Optional[str]:
        if "billboard" in self.__dict__ and self.billboard:
            return self.billboard.title
        return None

    @property
    def billboard_city(self) -> Optional[str]:
        if "billboard" in self.__dict__ and self.billboard:
            return self.billboard.city
        return None

    def __repr__(self) -> str:
        return f"<Booking {self.start_date}→{self.end_date} ({self.status})>"
