"""
Billboard Routes
==================
CRUD and search/filter endpoints for billboards.
- Public: GET (list, detail, availability)
- Protected: POST (create), PATCH (update), DELETE (delete) — owner/admin only
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.billboard import (
    BillboardCreate, BillboardFilterParams, BillboardResponse, BillboardUpdate,
)
from app.services.analytics_service import AnalyticsService
from app.services.billboard_service import BillboardService
from app.services.booking_service import BookingService
from app.utils.pagination import paginated_response

router = APIRouter()


@router.get("")
async def list_billboards(
    search: Optional[str] = Query(None, max_length=200),
    city: Optional[str] = None,
    state: Optional[str] = None,
    category_id: Optional[UUID] = None,
    size_type: Optional[str] = Query(None, pattern="^(small|medium|large|digital)$"),
    price_min: Optional[float] = Query(None, ge=0),
    price_max: Optional[float] = Query(None, ge=0),
    is_illuminated: Optional[bool] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
):
    """
    List billboards with search, filtering, pagination, and sorting.
    Public endpoint — only shows 'active' billboards.
    """
    filters = BillboardFilterParams(
        search=search, city=city, state=state,
        category_id=category_id, size_type=size_type,
        price_min=price_min, price_max=price_max,
        is_illuminated=is_illuminated, status="active",
    )

    service = BillboardService(db)
    billboards, total = await service.search_billboards(
        filters=filters, page=page, per_page=per_page,
        sort_by=sort_by, order=order,
    )

    data = [BillboardResponse.model_validate(b) for b in billboards]
    return paginated_response(data, total, page, per_page)


@router.post("", status_code=201)
async def create_billboard(
    data: BillboardCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new billboard listing. Requires 'owner' or 'admin' role."""
    service = BillboardService(db)
    billboard = await service.create_billboard(data, current_user)

    return {
        "status": "success",
        "message": "Billboard created successfully and is now live!",
        "data": BillboardResponse.model_validate(billboard),
    }


@router.get("/admin/listings")
async def list_admin_billboards(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List billboards owned by the current user."""
    service = BillboardService(db)
    billboards, total = await service.get_owner_billboards(
        admin_id=current_user.id,
        page=page,
        per_page=per_page,
    )

    data = [BillboardResponse.model_validate(b) for b in billboards]
    return paginated_response(data, total, page, per_page)


@router.get("/{billboard_id}")
async def get_billboard(
    billboard_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Get billboard details by ID. Tracks view in background."""
    service = BillboardService(db)
    billboard = await service.get_billboard(billboard_id)

    # Track view asynchronously (non-blocking)
    analytics = AnalyticsService(db)
    background_tasks.add_task(analytics.track_view, billboard_id)

    return {
        "status": "success",
        "data": BillboardResponse.model_validate(billboard),
    }


@router.patch("/{billboard_id}")
async def update_billboard(
    billboard_id: UUID,
    data: BillboardUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a billboard. Only the owner or admin can update."""
    service = BillboardService(db)
    billboard = await service.update_billboard(billboard_id, data, current_user)

    return {
        "status": "success",
        "message": "Billboard updated successfully",
        "data": BillboardResponse.model_validate(billboard),
    }


@router.delete("/{billboard_id}", status_code=200)
async def delete_billboard(
    billboard_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a billboard. Only the owner or admin can delete."""
    service = BillboardService(db)
    await service.delete_billboard(billboard_id, current_user)

    return {
        "status": "success",
        "message": "Billboard deleted successfully",
    }


@router.get("/{billboard_id}/availability")
async def get_availability(
    billboard_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get booked date ranges for a billboard (availability calendar)."""
    service = BookingService(db)
    availability = await service.get_billboard_availability(billboard_id)

    return {
        "status": "success",
        "data": availability,
    }
