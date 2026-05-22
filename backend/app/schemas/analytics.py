"""
Analytics Schemas
==================
Response models for analytics/reporting endpoints.
"""

from datetime import date
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class DashboardStats(BaseModel):
    """Overview stats for admin dashboard."""
    total_users: int
    total_billboards: int
    total_bookings: int
    total_revenue: Decimal
    active_bookings: int
    pending_billboards: int


class RevenueDataPoint(BaseModel):
    """Single data point for revenue chart."""
    period: str
    revenue: Decimal
    bookings_count: int


class RevenueReport(BaseModel):
    """Revenue report over time."""
    data: List[RevenueDataPoint]
    total_revenue: Decimal
    period_type: str


class TopBillboard(BaseModel):
    """Most booked billboard info."""
    billboard_id: UUID
    title: str
    city: str
    total_bookings: int
    total_revenue: Decimal


class BookingReport(BaseModel):
    """Booking stats over time."""
    data: List[dict]
    total_bookings: int
    period_type: str
