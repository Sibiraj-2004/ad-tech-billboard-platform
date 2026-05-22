"""
Admin Log Model
================
Audit trail for all admin actions.
Stores who did what, to which entity, and when.
JSONB details field captures action-specific data.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AdminLog(Base):
    __tablename__ = "admin_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    admin_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Admin who performed the action",
    )

    # ── Action Details ───────────────────────────────────────
    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        comment="Action performed (e.g., 'user_deactivated', 'billboard_approved')",
    )
    entity_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Entity type affected (e.g., 'user', 'billboard', 'booking')",
    )
    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        comment="ID of the affected entity",
    )
    details: Mapped[dict] = mapped_column(
        JSONB,
        nullable=True,
        default=dict,
        comment="Extra action details (before/after values, reason, etc.)",
    )
    ip_address: Mapped[str] = mapped_column(
        String(45),
        nullable=True,
        comment="IP address of the admin (IPv4 or IPv6)",
    )

    # ── Timestamp ────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    # ── Relationships ────────────────────────────────────────
    admin = relationship("User", back_populates="admin_logs")

    def __repr__(self) -> str:
        return f"<AdminLog {self.action} by={self.admin_id}>"
