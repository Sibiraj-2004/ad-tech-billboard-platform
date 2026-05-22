"""
Favorite Service
=================
Business logic for managing user favorites.
"""

import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, NotFoundException
from app.repositories.billboard_repo import BillboardRepository
from app.repositories.favorite_repo import FavoriteRepository

logger = logging.getLogger(__name__)


class FavoriteService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.favorite_repo = FavoriteRepository(db)
        self.billboard_repo = BillboardRepository(db)

    async def add_favorite(self, user_id: UUID, billboard_id: UUID):
        """Add a billboard to user's favorites."""
        # Verify billboard exists
        billboard = await self.billboard_repo.get_by_id(billboard_id)
        if not billboard:
            raise NotFoundException("Billboard not found")

        # Check if already favorited
        existing = await self.favorite_repo.get_by_user_and_billboard(
            user_id, billboard_id
        )
        if existing:
            raise ConflictException("Billboard already in favorites")

        favorite = await self.favorite_repo.create({
            "user_id": user_id,
            "billboard_id": billboard_id,
        })

        logger.info(f"User {user_id} favorited billboard {billboard_id}")
        return favorite

    async def remove_favorite(self, user_id: UUID, billboard_id: UUID):
        """Remove a billboard from user's favorites."""
        removed = await self.favorite_repo.remove_favorite(user_id, billboard_id)
        if not removed:
            raise NotFoundException("Favorite not found")

        logger.info(f"User {user_id} unfavorited billboard {billboard_id}")

    async def get_user_favorites(
        self, user_id: UUID, page: int = 1, per_page: int = 20
    ):
        """Get paginated favorites for a user."""
        skip = (page - 1) * per_page
        return await self.favorite_repo.get_user_favorites(
            user_id, skip=skip, limit=per_page
        )

    async def is_favorited(self, user_id: UUID, billboard_id: UUID) -> bool:
        """Check if a billboard is favorited by the user."""
        existing = await self.favorite_repo.get_by_user_and_billboard(
            user_id, billboard_id
        )
        return existing is not None
