"""
User Model
===========
Represents platform users with three roles:
- admin: Full platform control
- owner: Can list billboards for rent
- advertiser: Can browse and book billboard spaces

Security:
- Passwords are never stored in plain text (bcrypt hash only)
- Email must be verified before full access
- is_active flag allows soft-deactivation without deleting data
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    # ── Primary Key ──────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Unique user identifier",
    )

    # ── Authentication Fields ────────────────────────────────
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        comment="User email address (used for login)",
    )
    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
        comment="Display username",
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="bcrypt hashed password",
    )

    # ── Profile Fields ───────────────────────────────────────
    full_name: Mapped[str] = mapped_column(
        String(100),
        nullable=True,
        comment="User full name",
    )
    phone: Mapped[str] = mapped_column(
        String(20),
        nullable=True,
        comment="Contact phone number",
    )
    avatar_url: Mapped[str] = mapped_column(
        String(500),
        nullable=True,
        comment="Profile picture URL",
    )

    # ── Role & Status ────────────────────────────────────────
    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="advertiser",
        index=True,
        comment="User role: admin, advertiser",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="Whether the user account is active",
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Whether email has been verified",
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
    billboards = relationship("Billboard", back_populates="owner", lazy="selectin")
    bookings = relationship("Booking", back_populates="user", lazy="selectin")
    favorites = relationship("Favorite", back_populates="user", lazy="selectin")
    admin_logs = relationship("AdminLog", back_populates="admin", lazy="selectin")

    def __repr__(self) -> str:
        return f"<User {self.username} ({self.role})>"
