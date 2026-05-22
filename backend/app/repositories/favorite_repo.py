"""
Favorite Repository
====================
Data access for user favorites (many-to-many with billboards).
"""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, func, select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.favorite import Favorite
from app.models.billboard import Billboard
from app.repositories.base import BaseRepository


class FavoriteRepository(BaseRepository[Favorite]):
    def __init__(self, db: AsyncSession):
        super().__init__(Favorite, db)

    async def get_by_user_and_billboard(
        self, user_id: UUID, billboard_id: UUID
    ) -> Optional[Favorite]:
        """Check if a user has favorited a specific billboard."""
        result = await self.db.execute(
            select(Favorite).where(
                and_(
                    Favorite.user_id == user_id,
                    Favorite.billboard_id == billboard_id,
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_user_favorites(
        self, user_id: UUID, skip: int = 0, limit: int = 20
    ) -> Tuple[List[Favorite], int]:
        """Get all favorites for a user with billboard data."""
        query = select(Favorite).where(Favorite.user_id == user_id)

        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()

        query = (
            query
            .options(selectinload(Favorite.billboard).selectinload(Billboard.images))
            .order_by(Favorite.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        favorites = list(result.scalars().unique().all())

        return favorites, total

    async def remove_favorite(self, user_id: UUID, billboard_id: UUID) -> bool:
        """Remove a favorite by user_id and billboard_id."""
        result = await self.db.execute(
            delete(Favorite).where(
                and_(
                    Favorite.user_id == user_id,
                    Favorite.billboard_id == billboard_id,
                )
            )
        )
        await self.db.flush()
        return result.rowcount > 0
