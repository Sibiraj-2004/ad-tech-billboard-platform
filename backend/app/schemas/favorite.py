"""
Favorite Schemas
=================
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class FavoriteResponse(BaseModel):
    """Favorite entry with billboard summary."""
    id: UUID
    billboard_id: UUID
    billboard_title: str = ""
    billboard_city: str = ""
    billboard_price_per_day: float = 0
    billboard_primary_image: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
