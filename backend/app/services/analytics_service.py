"""
Analytics Service
==================
Business logic for analytics and reporting.
"""

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.analytics_repo import AnalyticsRepository

logger = logging.getLogger(__name__)


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.analytics_repo = AnalyticsRepository(db)

    async def get_dashboard_stats(self) -> dict:
        """Get aggregate stats for the admin dashboard."""
        return await self.analytics_repo.get_dashboard_stats()

    async def get_revenue_report(self, period: str = "monthly") -> dict:
        """Get revenue report grouped by period."""
        data = await self.analytics_repo.get_revenue_by_period(period)
        total_revenue = sum(d["revenue"] for d in data)
        return {
            "data": data,
            "total_revenue": total_revenue,
            "period_type": period,
        }

    async def get_top_billboards(self, limit: int = 10) -> list:
        """Get most booked billboards."""
        return await self.analytics_repo.get_top_billboards(limit)

    async def track_view(self, billboard_id) -> None:
        """Track a billboard detail page view."""
        await self.analytics_repo.increment_view(billboard_id)
