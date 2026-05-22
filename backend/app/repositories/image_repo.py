"""
Image Repository
=================
"""

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.image import Image
from app.repositories.base import BaseRepository


class ImageRepository(BaseRepository[Image]):
    def __init__(self, db: AsyncSession):
        super().__init__(Image, db)

    async def get_by_billboard(self, billboard_id: UUID) -> List[Image]:
        """Get all images for a billboard, ordered by sort_order."""
        result = await self.db.execute(
            select(Image)
            .where(Image.billboard_id == billboard_id)
            .order_by(Image.sort_order.asc())
        )
        return list(result.scalars().all())

    async def set_primary(self, image_id: UUID, billboard_id: UUID) -> None:
        """Set an image as primary, un-setting all others for that billboard."""
        # Un-set all existing primary flags
        await self.db.execute(
            update(Image)
            .where(Image.billboard_id == billboard_id)
            .values(is_primary=False)
        )
        # Set the new primary
        await self.db.execute(
            update(Image)
            .where(Image.id == image_id)
            .values(is_primary=True)
        )
        await self.db.flush()

    async def get_primary_for_billboard(self, billboard_id: UUID) -> Optional[Image]:
        """Get the primary image for a billboard."""
        result = await self.db.execute(
            select(Image).where(
                Image.billboard_id == billboard_id,
                Image.is_primary == True,
            )
        )
        return result.scalar_one_or_none()

    async def count_by_billboard(self, billboard_id: UUID) -> int:
        """Count images for a billboard."""
        from sqlalchemy import func
        result = await self.db.execute(
            select(func.count()).select_from(Image)
            .where(Image.billboard_id == billboard_id)
        )
        return result.scalar_one()
