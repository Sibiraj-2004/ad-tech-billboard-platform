"""
Booking Routes
===============
Endpoints for creating, viewing, and cancelling bookings.
All routes require authentication.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingResponse
from app.services.booking_service import BookingService
from app.utils.pagination import paginated_response

router = APIRouter()


@router.post("", status_code=201)
async def create_booking(
    data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new booking.

    Validates:
    - Billboard exists and is active
    - No date conflicts with existing bookings
    - User is not the billboard owner
    - Calculates total price based on duration and pricing tiers
    """
    service = BookingService(db)
    booking = await service.create_booking(data, current_user)

    return {
        "status": "success",
        "message": "Booking created successfully",
        "data": BookingResponse.model_validate(booking),
    }


@router.get("")
async def list_my_bookings(
    status: Optional[str] = Query(None, pattern="^(pending|confirmed|cancelled|completed)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List the authenticated user's bookings with optional status filter."""
    service = BookingService(db)
    bookings, total = await service.get_user_bookings(
        user_id=current_user.id, status=status,
        page=page, per_page=per_page,
    )

    data = [BookingResponse.model_validate(b) for b in bookings]
    return paginated_response(data, total, page, per_page)


@router.get("/requests/admin")
async def list_admin_requests(
    status: Optional[str] = Query(None, pattern="^(pending|confirmed|rejected|cancelled|completed)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List ALL booking requests (admin sees all bookings across the platform)."""
    if current_user.role != "admin":
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("Only admins can view booking requests")
        
    service = BookingService(db)
    bookings, total = await service.get_all_bookings(
        status=status,
        page=page, per_page=per_page,
    )

    data = [BookingResponse.model_validate(b) for b in bookings]
    return paginated_response(data, total, page, per_page)


@router.get("/{booking_id}")
async def get_booking(
    booking_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get booking details. Users can only view their own bookings."""
    service = BookingService(db)
    booking = await service.get_booking(booking_id, current_user)

    return {
        "status": "success",
        "data": BookingResponse.model_validate(booking),
    }


@router.patch("/{booking_id}/cancel")
async def cancel_booking(
    booking_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a booking. Users can only cancel their own bookings."""
    service = BookingService(db)
    booking = await service.cancel_booking(booking_id, current_user)

    return {
        "status": "success",
        "message": "Booking cancelled successfully",
        "data": BookingResponse.model_validate(booking),
    }


@router.post("/{booking_id}/approve")
async def approve_booking(
    booking_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Owner approves a pending booking."""
    service = BookingService(db)
    booking = await service.approve_booking(booking_id, current_user)

    return {
        "status": "success",
        "message": "Booking approved successfully",
        "data": BookingResponse.model_validate(booking),
    }


@router.post("/{booking_id}/reject")
async def reject_booking(
    booking_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Owner rejects a pending booking."""
    service = BookingService(db)
    booking = await service.reject_booking(booking_id, current_user)

    return {
        "status": "success",
        "message": "Booking rejected successfully",
        "data": BookingResponse.model_validate(booking),
    }
