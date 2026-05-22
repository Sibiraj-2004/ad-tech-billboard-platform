"""
Favorite Model
===============
Junction table for user-billboard favorites (many-to-many).
Composite unique constraint prevents duplicate favorites.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Favorite(Base):
    __tablename__ = "favorites"

    # Composite unique constraint — a user can favorite a billboard only once
    __table_args__ = (
        UniqueConstraint("user_id", "billboard_id", name="uq_user_billboard_favorite"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    billboard_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("billboards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # ── Relationships ────────────────────────────────────────
    user = relationship("User", back_populates="favorites")
    billboard = relationship("Billboard", back_populates="favorites")

    def __repr__(self) -> str:
        return f"<Favorite user={self.user_id} billboard={self.billboard_id}>"
