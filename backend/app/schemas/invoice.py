from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class InvoiceBase(BaseModel):
    amount: Decimal = Field(..., gt=0)
    status: str = "unpaid"
    due_date: datetime
    notes: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    booking_id: UUID


class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None


class InvoiceRead(InvoiceBase):
    id: UUID
    booking_id: UUID
    owner_id: UUID
    client_id: UUID
    invoice_number: str
    
    # Extra fields for UI
    billboard_title: Optional[str] = None
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ClientRead(BaseModel):
    id: UUID
    full_name: Optional[str]
    email: str
    username: str
    phone: Optional[str]
    total_bookings: int
    total_spent: Decimal

    class Config:
        from_attributes = True
