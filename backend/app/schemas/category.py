"""
Category Schemas
=================
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    """Create a new category (admin only)."""
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None


class CategoryResponse(BaseModel):
    """Category response."""
    id: UUID
    name: str
    slug: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
