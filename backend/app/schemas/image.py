"""
Image Schemas
==============
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class ImageResponse(BaseModel):
    """Image metadata response."""
    id: UUID
    billboard_id: UUID
    file_path: str
    thumbnail_path: Optional[str] = None
    original_filename: str
    content_type: str
    file_size: int
    is_primary: bool
    sort_order: int
    created_at: datetime

    model_config = {"from_attributes": True}
