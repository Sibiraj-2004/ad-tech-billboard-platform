"""
Analytics Routes
=================
Dashboard stats and reporting endpoints.
Admin only.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_role
from app.db.session import get_db
from app.models.user import User
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard(
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregate dashboard stats (total users, billboards, revenue, etc.)."""
    service = AnalyticsService(db)
    stats = await service.get_dashboard_stats()

    return {
        "status": "success",
        "data": stats,
    }


@router.get("/revenue")
async def get_revenue_report(
    period: str = Query("monthly", pattern="^(daily|weekly|monthly)$"),
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Get revenue report grouped by period (daily/weekly/monthly)."""
    service = AnalyticsService(db)
    report = await service.get_revenue_report(period)

    return {
        "status": "success",
        "data": report,
    }


@router.get("/top-billboards")
async def get_top_billboards(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Get most booked billboards ranked by booking count."""
    service = AnalyticsService(db)
    top = await service.get_top_billboards(limit)

    return {
        "status": "success",
        "data": top,
    }
