"""
Analytics Model
================
Stores daily aggregated metrics per billboard.
Data is written via BackgroundTasks to avoid blocking API responses.

Aggregations include views, inquiries, booking counts, and revenue.
Queries use DATE_TRUNC for period-based reporting.
"""

import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Analytics(Base):
    __tablename__ = "analytics"

    # One row per billboard per day
    __table_args__ = (
        UniqueConstraint("billboard_id", "date", name="uq_billboard_date_analytics"),
    )

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
    date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
        comment="Date for this analytics row",
    )

    # ── Metrics ──────────────────────────────────────────────
    views: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Number of detail page views",
    )
    inquiries: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Number of booking inquiries",
    )
    bookings_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Number of confirmed bookings",
    )
    revenue: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=0,
        nullable=False,
        comment="Revenue from bookings on this date",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # ── Relationships ────────────────────────────────────────
    billboard = relationship("Billboard", back_populates="analytics")

    def __repr__(self) -> str:
        return f"<Analytics billboard={self.billboard_id} date={self.date}>"
