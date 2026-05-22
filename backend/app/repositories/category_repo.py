"""
Category Repository
====================
"""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.repositories.base import BaseRepository


class CategoryRepository(BaseRepository[Category]):
    def __init__(self, db: AsyncSession):
        super().__init__(Category, db)

    async def get_by_slug(self, slug: str) -> Optional[Category]:
        """Find a category by its URL slug."""
        result = await self.db.execute(
            select(Category).where(Category.slug == slug)
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> Optional[Category]:
        """Find a category by name."""
        result = await self.db.execute(
            select(Category).where(Category.name == name)
        )
        return result.scalar_one_or_none()

    async def get_active(self):
        """Get all active categories."""
        result = await self.db.execute(
            select(Category)
            .where(Category.is_active == True)
            .order_by(Category.name.asc())
        )
        return list(result.scalars().all())
