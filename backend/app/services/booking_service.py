"""
Booking Service
================
Business logic for booking management with conflict detection.

Key workflows:
1. Create booking → check conflicts → calculate price → persist
2. Cancel booking → validate ownership → update status
3. Availability → return booked date ranges for a billboard
"""

import logging
from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    BadRequestException, ConflictException, ForbiddenException, NotFoundException
)
from app.models.user import User
from app.repositories.billboard_repo import BillboardRepository
from app.repositories.booking_repo import BookingRepository
from app.schemas.booking import BookingCreate

logger = logging.getLogger(__name__)


class BookingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.booking_repo = BookingRepository(db)
        self.billboard_repo = BillboardRepository(db)

    def _calculate_price(
        self,
        days: int,
        price_per_day: Decimal,
        price_per_week: Optional[Decimal],
        price_per_month: Optional[Decimal],
    ) -> Decimal:
        """
        Calculate total booking price with tier-based discounts.

        Logic:
        - If 30+ days and monthly price exists → use monthly rate
        - If 7+ days and weekly price exists → use weekly rate
        - Otherwise → use daily rate
        """
        if days >= 30 and price_per_month:
            months = days // 30
            remaining_days = days % 30
            total = (price_per_month * months) + (price_per_day * remaining_days)
        elif days >= 7 and price_per_week:
            weeks = days // 7
            remaining_days = days % 7
            total = (price_per_week * weeks) + (price_per_day * remaining_days)
        else:
            total = price_per_day * days

        return round(total, 2)

    async def create_booking(self, data: BookingCreate, user: User, status: str = "pending"):
        """
        Create a new booking with conflict detection.

        Steps:
        1. Verify billboard exists and is active
        2. Check for date range conflicts
        3. Calculate total price
        4. Create booking record
        """
        # 1. Verify billboard
        billboard = await self.billboard_repo.get_by_id(data.billboard_id)
        if not billboard:
            raise NotFoundException("Billboard not found")

        if billboard.status != "active":
            raise BadRequestException("Billboard is not available for booking")

        # Prevent owner from booking their own billboard
        if billboard.owner_id == user.id:
            raise BadRequestException("You cannot book your own billboard")

        # 2. Check for date conflicts
        has_conflict = await self.booking_repo.check_conflict(
            billboard_id=data.billboard_id,
            start_date=data.start_date,
            end_date=data.end_date,
        )
        if has_conflict:
            raise ConflictException(
                "Billboard is already booked for the selected dates"
            )

        # 3. Calculate price
        days = (data.end_date - data.start_date).days
        total_price = self._calculate_price(
            days=days,
            price_per_day=billboard.price_per_day,
            price_per_week=billboard.price_per_week,
            price_per_month=billboard.price_per_month,
        )

        # 4. Create booking
        booking = await self.booking_repo.create({
            "user_id": user.id,
            "billboard_id": data.billboard_id,
            "start_date": data.start_date,
            "end_date": data.end_date,
            "total_price": total_price,
            "status": status,
            "notes": data.notes,
        })

        logger.info(
            f"Booking created: {booking.id} by {user.email} "
            f"for billboard {data.billboard_id} ({data.start_date}→{data.end_date})"
        )

        return booking

    async def get_booking(self, booking_id: UUID, user: User):
        """Get a booking — users can only see their own, admins can see all."""
        booking = await self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise NotFoundException("Booking not found")

        if user.role != "admin" and booking.user_id != user.id:
            raise ForbiddenException("You can only view your own bookings")

        return booking

    async def get_user_bookings(
        self, user_id: UUID, status: Optional[str] = None,
        page: int = 1, per_page: int = 20,
    ):
        """Get bookings for the authenticated user."""
        skip = (page - 1) * per_page
        return await self.booking_repo.get_by_user(
            user_id=user_id, status=status, skip=skip, limit=per_page,
        )

    async def cancel_booking(self, booking_id: UUID, user: User):
        """Cancel a booking. Users can cancel their own, admins can cancel any."""
        booking = await self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise NotFoundException("Booking not found")

        if user.role != "admin" and booking.user_id != user.id:
            raise ForbiddenException("You can only cancel your own bookings")

        if booking.status in ("cancelled", "completed"):
            raise BadRequestException(f"Cannot cancel a {booking.status} booking")

        updated = await self.booking_repo.update(booking_id, {"status": "cancelled"})
        logger.info(f"Booking cancelled: {booking_id} by {user.email}")
        return updated

    async def approve_booking(self, booking_id: UUID, admin: User):
        """Admin approves a pending booking."""
        if admin.role != "admin":
            raise ForbiddenException("Only admins can approve bookings")

        booking = await self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise NotFoundException("Booking not found")

        if booking.status != "pending":
            raise BadRequestException(f"Cannot approve a {booking.status} booking")

        updated = await self.booking_repo.update(booking_id, {"status": "confirmed"})
        logger.info(f"Booking {booking_id} approved by admin {admin.email}")
        return updated

    async def reject_booking(self, booking_id: UUID, admin: User):
        """Admin rejects a pending booking."""
        if admin.role != "admin":
            raise ForbiddenException("Only admins can reject bookings")

        booking = await self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise NotFoundException("Booking not found")

        if booking.status != "pending":
            raise BadRequestException(f"Cannot reject a {booking.status} booking")

        updated = await self.booking_repo.update(booking_id, {"status": "rejected"})
        logger.info(f"Booking {booking_id} rejected by admin {admin.email}")
        return updated

    async def get_owner_requests(
        self, admin_id: UUID, status: Optional[str] = None,
        page: int = 1, per_page: int = 20
    ):
        """Get booking requests for billboards owned by owner_id."""
        skip = (page - 1) * per_page
        # We need a repo method for this
        return await self.booking_repo.get_by_owner(
            owner_id=admin_id, status=status, skip=skip, limit=per_page
        )

    async def get_billboard_availability(self, billboard_id: UUID):
        """Get booked date ranges for a billboard (for availability calendar)."""
        billboard = await self.billboard_repo.get_by_id(billboard_id)
        if not billboard:
            raise NotFoundException("Billboard not found")

        bookings = await self.booking_repo.get_by_billboard(billboard_id)

        booked_ranges = [
            {
                "start_date": str(b.start_date),
                "end_date": str(b.end_date),
                "status": b.status,
            }
            for b in bookings
        ]

        return {
            "billboard_id": str(billboard_id),
            "booked_ranges": booked_ranges,
        }

    async def admin_update_booking(
        self, booking_id: UUID, status: str, admin: User
    ):
        """Admin update booking status (confirm, cancel, complete)."""
        booking = await self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise NotFoundException("Booking not found")

        updated = await self.booking_repo.update(booking_id, {"status": status})
        logger.info(f"Booking {booking_id} status → {status} by admin {admin.email}")
        return updated

    async def get_all_bookings(
        self, status: Optional[str] = None,
        page: int = 1, per_page: int = 20
    ):
        """Get all bookings (admin use)."""
        skip = (page - 1) * per_page
        return await self.booking_repo.get_all_bookings(
            status=status, skip=skip, limit=per_page
        )
