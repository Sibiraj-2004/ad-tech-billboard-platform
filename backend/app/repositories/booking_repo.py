"""
Booking Repository
===================
Data access for bookings with date conflict detection.
Uses SQL date range overlap check to prevent double-booking.
"""

from datetime import date
from decimal import Decimal
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.booking import Booking
from app.repositories.base import BaseRepository


class BookingRepository(BaseRepository[Booking]):
    def __init__(self, db: AsyncSession):
        super().__init__(Booking, db)

    async def get_by_id(self, id: UUID) -> Optional[Booking]:
        """Get a single booking with relations loaded."""
        result = await self.db.execute(
            select(Booking)
            .options(joinedload(Booking.billboard), joinedload(Booking.invoice))
            .where(Booking.id == id)
        )
        return result.scalar_one_or_none()

    async def check_conflict(
        self, billboard_id: UUID, start_date: date, end_date: date,
        exclude_booking_id: Optional[UUID] = None,
    ) -> bool:
        """
        Check if a billboard has any overlapping bookings in the given date range.

        Uses the overlap condition:
            existing.start_date < new.end_date AND existing.end_date > new.start_date

        Returns True if a conflict exists.
        """
        query = select(func.count()).select_from(Booking).where(
            and_(
                Booking.billboard_id == billboard_id,
                Booking.status.in_(["pending", "confirmed"]),
                Booking.start_date < end_date,
                Booking.end_date > start_date,
            )
        )

        if exclude_booking_id:
            query = query.where(Booking.id != exclude_booking_id)

        result = await self.db.execute(query)
        count = result.scalar_one()
        return count > 0

    async def get_by_user(
        self, user_id: UUID, status: Optional[str] = None,
        skip: int = 0, limit: int = 20,
    ) -> Tuple[List[Booking], int]:
        """Get bookings for a specific user with optional status filter."""
        query = select(Booking).where(Booking.user_id == user_id)

        if status:
            query = query.where(Booking.status == status)

        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()

        query = (
            query.options(joinedload(Booking.billboard), joinedload(Booking.invoice))
            .order_by(Booking.created_at.desc())
            .offset(skip).limit(limit)
        )
        result = await self.db.execute(query)
        bookings = list(result.scalars().all())

        return bookings, total

    async def get_by_owner(
        self, owner_id: UUID, status: Optional[str] = None,
        skip: int = 0, limit: int = 20,
    ) -> Tuple[List[Booking], int]:
        """Get bookings for billboards owned by a specific owner."""
        from app.models.billboard import Billboard
        
        query = (
            select(Booking)
            .join(Billboard, Booking.billboard_id == Billboard.id)
            .where(Billboard.owner_id == owner_id)
        )

        if status:
            query = query.where(Booking.status == status)

        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()

        query = (
            query.options(joinedload(Booking.billboard), joinedload(Booking.invoice))
            .order_by(Booking.created_at.desc())
            .offset(skip).limit(limit)
        )
        result = await self.db.execute(query)
        bookings = list(result.scalars().all())

        return bookings, total

    async def get_by_billboard(
        self, billboard_id: UUID, status: Optional[str] = None,
    ) -> List[Booking]:
        """Get all bookings for a billboard (for availability calendar)."""
        query = select(Booking).where(Booking.billboard_id == billboard_id)

        if status:
            query = query.where(Booking.status == status)
        else:
            # Only show active bookings by default
            query = query.where(Booking.status.in_(["pending", "confirmed"]))

        query = query.order_by(Booking.start_date.asc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_all_bookings(
        self, status: Optional[str] = None,
        skip: int = 0, limit: int = 20,
    ) -> Tuple[List[Booking], int]:
        """Get all bookings (admin view) with optional status filter."""
        query = select(Booking)

        if status:
            query = query.where(Booking.status == status)

        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()

        query = (
            query.options(joinedload(Booking.billboard), joinedload(Booking.invoice))
            .order_by(Booking.created_at.desc())
            .offset(skip).limit(limit)
        )
        result = await self.db.execute(query)
        bookings = list(result.scalars().all())

        return bookings, total

    async def get_revenue_stats(self) -> Decimal:
        """Get total revenue from confirmed/completed bookings."""
        result = await self.db.execute(
            select(func.coalesce(func.sum(Booking.total_price), 0))
            .where(Booking.status.in_(["confirmed", "completed"]))
        )
        return result.scalar_one()

    async def count_by_status(self) -> dict:
        """Count bookings by status."""
        result = await self.db.execute(
            select(Booking.status, func.count(Booking.id))
            .group_by(Booking.status)
        )
        return dict(result.all())
