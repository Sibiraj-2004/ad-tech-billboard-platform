"""
Booking Schemas
================
Request/response models for booking management.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class BookingCreate(BaseModel):
    """Create a new booking."""
    billboard_id: UUID
    start_date: date
    end_date: date
    notes: Optional[str] = Field(None, max_length=1000)

    @model_validator(mode="after")
    def validate_dates(self):
        """Ensure start_date < end_date and both are in the future."""
        if self.start_date >= self.end_date:
            raise ValueError("start_date must be before end_date")
        if self.start_date < date.today():
            raise ValueError("start_date must be in the future")
        return self


class BookingResponse(BaseModel):
    """Full booking response."""
    id: UUID
    user_id: UUID
    billboard_id: UUID
    billboard_title: Optional[str] = None
    billboard_city: Optional[str] = None
    start_date: date
    end_date: date
    total_price: Decimal
    status: str
    notes: Optional[str] = None
    has_invoice: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BookingWithBillboard(BookingResponse):
    """Booking with nested billboard info for user dashboard."""
    billboard_title: Optional[str] = None
    billboard_city: Optional[str] = None
    billboard_address: Optional[str] = None


class BookingStatusUpdate(BaseModel):
    """Admin booking status update."""
    status: str = Field(..., pattern="^(confirmed|cancelled|completed)$")


class AvailabilityResponse(BaseModel):
    """Billboard availability info."""
    billboard_id: UUID
    booked_ranges: list[dict] = []
