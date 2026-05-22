"""
Billboard Schemas
==================
Request/response models for billboard CRUD and search/filter.
"""

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class BillboardCreate(BaseModel):
    """Create a new billboard listing."""
    title: str = Field(..., min_length=5, max_length=200)
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    price_per_day: Decimal = Field(..., gt=0, max_digits=10, decimal_places=2)
    price_per_week: Optional[Decimal] = Field(None, gt=0, max_digits=10, decimal_places=2)
    price_per_month: Optional[Decimal] = Field(None, gt=0, max_digits=10, decimal_places=2)
    address: str = Field(..., min_length=5, max_length=500)
    latitude: Optional[Decimal] = Field(None, ge=-90, le=90)
    longitude: Optional[Decimal] = Field(None, ge=-180, le=180)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    size_type: str = Field("medium", pattern="^(small|medium|large|digital)$")
    is_illuminated: bool = False
    specifications: Optional[Dict[str, Any]] = None


class BillboardUpdate(BaseModel):
    """Update an existing billboard listing."""
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    price_per_day: Optional[Decimal] = Field(None, gt=0, max_digits=10, decimal_places=2)
    price_per_week: Optional[Decimal] = Field(None, gt=0, max_digits=10, decimal_places=2)
    price_per_month: Optional[Decimal] = Field(None, gt=0, max_digits=10, decimal_places=2)
    address: Optional[str] = Field(None, min_length=5, max_length=500)
    latitude: Optional[Decimal] = Field(None, ge=-90, le=90)
    longitude: Optional[Decimal] = Field(None, ge=-180, le=180)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    size_type: Optional[str] = Field(None, pattern="^(small|medium|large|digital)$")
    is_illuminated: Optional[bool] = None
    specifications: Optional[Dict[str, Any]] = None


class ImageResponse(BaseModel):
    """Image data nested inside billboard response."""
    id: UUID
    file_path: str
    thumbnail_path: Optional[str] = None
    original_filename: str
    content_type: str
    file_size: int
    is_primary: bool
    sort_order: int

    model_config = {"from_attributes": True}


class BillboardResponse(BaseModel):
    """Full billboard response with nested images."""
    id: UUID
    owner_id: UUID
    category_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    price_per_day: Decimal
    price_per_week: Optional[Decimal] = None
    price_per_month: Optional[Decimal] = None
    address: str
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    city: str
    state: str
    size_type: str
    is_illuminated: bool
    specifications: Optional[Dict[str, Any]] = None
    status: str
    images: List[ImageResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BillboardListResponse(BaseModel):
    """Compact billboard info for list/grid views."""
    id: UUID
    title: str
    price_per_day: Decimal
    address: str
    city: str
    state: str
    size_type: str
    status: str
    is_illuminated: bool
    primary_image: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BillboardFilterParams(BaseModel):
    """Search and filter parameters for billboard listings."""
    search: Optional[str] = Field(None, max_length=200)
    city: Optional[str] = None
    state: Optional[str] = None
    category_id: Optional[UUID] = None
    size_type: Optional[str] = Field(None, pattern="^(small|medium|large|digital)$")
    price_min: Optional[Decimal] = Field(None, ge=0)
    price_max: Optional[Decimal] = Field(None, ge=0)
    is_illuminated: Optional[bool] = None
    status: Optional[str] = Field("active", pattern="^(active|inactive|pending|rejected)$")
