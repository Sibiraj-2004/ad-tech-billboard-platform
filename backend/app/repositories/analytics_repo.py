"""
Analytics Repository
=====================
Complex aggregation queries for dashboard and reporting.
Uses PostgreSQL DATE_TRUNC for time-series grouping.
"""

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from sqlalchemy import and_, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analytics import Analytics
from app.models.billboard import Billboard
from app.models.booking import Booking
from app.models.user import User
from app.repositories.base import BaseRepository


class AnalyticsRepository(BaseRepository[Analytics]):
    def __init__(self, db: AsyncSession):
        super().__init__(Analytics, db)

    async def get_dashboard_stats(self) -> dict:
        """Get aggregate stats for the admin dashboard."""
        total_users = (await self.db.execute(
            select(func.count()).select_from(User)
        )).scalar_one()

        total_billboards = (await self.db.execute(
            select(func.count()).select_from(Billboard)
        )).scalar_one()

        total_bookings = (await self.db.execute(
            select(func.count()).select_from(Booking)
        )).scalar_one()

        total_revenue = (await self.db.execute(
            select(func.coalesce(func.sum(Booking.total_price), 0))
            .where(Booking.status.in_(["confirmed", "completed"]))
        )).scalar_one()

        active_bookings = (await self.db.execute(
            select(func.count()).select_from(Booking)
            .where(Booking.status == "confirmed")
        )).scalar_one()

        pending_billboards = (await self.db.execute(
            select(func.count()).select_from(Billboard)
            .where(Billboard.status == "pending")
        )).scalar_one()

        return {
            "total_users": total_users,
            "total_billboards": total_billboards,
            "total_bookings": total_bookings,
            "total_revenue": total_revenue,
            "active_bookings": active_bookings,
            "pending_billboards": pending_billboards,
        }

    async def get_revenue_by_period(self, period: str = "monthly") -> list:
        """
        Get revenue grouped by time period.
        period: 'daily', 'weekly', 'monthly'
        """
        trunc_map = {
            "daily": "day",
            "weekly": "week",
            "monthly": "month",
        }
        trunc_value = trunc_map.get(period, "month")

        result = await self.db.execute(
            select(
                func.date_trunc(trunc_value, Booking.created_at).label("period"),
                func.sum(Booking.total_price).label("revenue"),
                func.count(Booking.id).label("bookings_count"),
            )
            .where(Booking.status.in_(["confirmed", "completed"]))
            .group_by(text("period"))
            .order_by(text("period"))
        )

        return [
            {
                "period": str(row.period.date()) if row.period else "",
                "revenue": float(row.revenue or 0),
                "bookings_count": row.bookings_count,
            }
            for row in result.all()
        ]

    async def get_top_billboards(self, limit: int = 10) -> list:
        """Get most booked billboards."""
        result = await self.db.execute(
            select(
                Billboard.id,
                Billboard.title,
                Billboard.city,
                func.count(Booking.id).label("total_bookings"),
                func.coalesce(func.sum(Booking.total_price), 0).label("total_revenue"),
            )
            .join(Booking, Booking.billboard_id == Billboard.id)
            .where(Booking.status.in_(["confirmed", "completed"]))
            .group_by(Billboard.id, Billboard.title, Billboard.city)
            .order_by(text("total_bookings DESC"))
            .limit(limit)
        )

        return [
            {
                "billboard_id": str(row.id),
                "title": row.title,
                "city": row.city,
                "total_bookings": row.total_bookings,
                "total_revenue": float(row.total_revenue),
            }
            for row in result.all()
        ]

    async def increment_view(self, billboard_id: UUID) -> None:
        """Increment the view counter for a billboard (today's row)."""
        today = date.today()

        # Try to find existing row for today
        existing = await self.db.execute(
            select(Analytics).where(
                and_(
                    Analytics.billboard_id == billboard_id,
                    Analytics.date == today,
                )
            )
        )
        row = existing.scalar_one_or_none()

        if row:
            row.views += 1
        else:
            new_row = Analytics(
                billboard_id=billboard_id,
                date=today,
                views=1,
            )
            self.db.add(new_row)

        await self.db.flush()
