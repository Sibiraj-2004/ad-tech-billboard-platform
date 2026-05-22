"""
Admin Routes
==============
Admin-only endpoints for user management, billboard moderation,
booking management, and audit logs.
All endpoints require 'admin' role.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.billboard import BillboardResponse
from app.schemas.booking import BookingResponse
from app.schemas.user import UserAdminUpdate, UserListResponse
from app.services.admin_service import AdminService
from app.services.billboard_service import BillboardService
from app.services.booking_service import BookingService
from app.services.user_service import UserService
from app.utils.pagination import paginated_response

router = APIRouter()


# ── User Management ─────────────────────────────────────────

@router.get("/users")
async def list_users(
    role: Optional[str] = Query(None, pattern="^(admin|owner|advertiser)$"),
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    """List all users with filtering. Admin only."""
    service = UserService(db)
    skip = (page - 1) * per_page
    users, total = await service.get_all_users(
        skip=skip, limit=per_page,
        role=role, is_active=is_active, search=search,
    )

    data = [UserListResponse.model_validate(u) for u in users]
    return paginated_response(data, total, page, per_page)


@router.patch("/users/{user_id}")
async def update_user(
    user_id: UUID,
    data: UserAdminUpdate,
    request: Request,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Update user role, active status, or verification. Admin only."""
    service = UserService(db)
    update_data = data.model_dump(exclude_unset=True)
    user = await service.admin_update_user(user_id, update_data)

    # Log admin action
    admin_service = AdminService(db)
    await admin_service.log_action(
        admin=current_user,
        action="user_updated",
        entity_type="user",
        entity_id=user_id,
        details=update_data,
        ip_address=request.client.host if request.client else None,
    )

    return {
        "status": "success",
        "message": "User updated successfully",
        "data": UserListResponse.model_validate(user),
    }


# ── Billboard Moderation ────────────────────────────────────

@router.get("/billboards")
async def list_all_billboards(
    status: Optional[str] = Query(None, pattern="^(active|inactive|pending|rejected)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    """List all billboards including pending/rejected. Admin only."""
    from app.schemas.billboard import BillboardFilterParams
    service = BillboardService(db)
    filters = BillboardFilterParams(status=status or None)

    billboards, total = await service.search_billboards(
        filters=filters, page=page, per_page=per_page,
    )

    data = [BillboardResponse.model_validate(b) for b in billboards]
    return paginated_response(data, total, page, per_page)


@router.patch("/billboards/{billboard_id}/moderate")
async def moderate_billboard(
    billboard_id: UUID,
    status: str = Query(..., pattern="^(active|rejected)$"),
    request: Request = None,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Approve or reject a billboard listing. Admin only."""
    service = BillboardService(db)
    billboard = await service.moderate_billboard(billboard_id, status, current_user)

    # Log admin action
    admin_service = AdminService(db)
    await admin_service.log_action(
        admin=current_user,
        action=f"billboard_{status}",
        entity_type="billboard",
        entity_id=billboard_id,
        details={"new_status": status},
        ip_address=request.client.host if request and request.client else None,
    )

    return {
        "status": "success",
        "message": f"Billboard {status} successfully",
        "data": BillboardResponse.model_validate(billboard),
    }


# ── Booking Management ──────────────────────────────────────

@router.get("/bookings")
async def list_all_bookings(
    status: Optional[str] = Query(None, pattern="^(pending|confirmed|cancelled|completed)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    """List all bookings with optional status filter. Admin only."""
    service = BookingService(db)
    bookings, total = await service.get_all_bookings(
        status=status, page=page, per_page=per_page,
    )

    data = [BookingResponse.model_validate(b) for b in bookings]
    return paginated_response(data, total, page, per_page)


@router.patch("/bookings/{booking_id}")
async def update_booking_status(
    booking_id: UUID,
    status: str = Query(..., pattern="^(confirmed|cancelled|completed)$"),
    request: Request = None,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Update booking status. Admin only."""
    service = BookingService(db)
    booking = await service.admin_update_booking(booking_id, status, current_user)

    # Log admin action
    admin_service = AdminService(db)
    await admin_service.log_action(
        admin=current_user,
        action=f"booking_{status}",
        entity_type="booking",
        entity_id=booking_id,
        details={"new_status": status},
        ip_address=request.client.host if request and request.client else None,
    )

    return {
        "status": "success",
        "message": f"Booking {status} successfully",
        "data": BookingResponse.model_validate(booking),
    }


# ── Audit Logs ───────────────────────────────────────────────

@router.get("/logs")
async def get_admin_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Get admin activity audit logs. Admin only."""
    admin_service = AdminService(db)
    skip = (page - 1) * per_page
    logs = await admin_service.get_logs(skip=skip, limit=per_page)

    data = [
        {
            "id": str(log.id),
            "admin_id": str(log.admin_id),
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": str(log.entity_id) if log.entity_id else None,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]

    return {
        "status": "success",
        "data": data,
    }
