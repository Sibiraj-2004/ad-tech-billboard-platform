"""
Billboard Service
==================
Business logic for billboard CRUD, search/filter, and availability.
Enforces ownership rules — only billboard owners can edit their listings.
"""

import logging
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenException, NotFoundException
from app.models.user import User
from app.repositories.billboard_repo import BillboardRepository
from app.repositories.category_repo import CategoryRepository
from app.schemas.billboard import BillboardCreate, BillboardFilterParams, BillboardUpdate

logger = logging.getLogger(__name__)


class BillboardService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.billboard_repo = BillboardRepository(db)
        self.category_repo = CategoryRepository(db)

    async def create_billboard(self, data: BillboardCreate, admin: User):
        """
        Create a new billboard listing.
        Status defaults to 'active' as only admins create listings now.
        """
        if admin.role != "admin":
            raise ForbiddenException("Only admins can create billboards")

        billboard_data = data.model_dump()
        billboard_data["owner_id"] = admin.id
        billboard_data["status"] = "active" 

        billboard = await self.billboard_repo.create(billboard_data)
        logger.info(f"Billboard created: {billboard.title} by {admin.email}")

        return billboard

    async def get_billboard(self, billboard_id: UUID):
        """Get billboard with images."""
        billboard = await self.billboard_repo.get_with_images(billboard_id)
        if not billboard:
            raise NotFoundException("Billboard not found")
        return billboard

    async def update_billboard(
        self, billboard_id: UUID, data: BillboardUpdate, user: User
    ):
        """Update a billboard. Only the owner or admin can update."""
        billboard = await self.billboard_repo.get_by_id(billboard_id)
        if not billboard:
            raise NotFoundException("Billboard not found")

        # Ownership check
        if user.role != "admin" and billboard.owner_id != user.id:
            raise ForbiddenException("You can only edit your own billboards")

        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            return billboard

        # In two-role mode, admins manage everything, no reset to pending needed.

        updated = await self.billboard_repo.update(billboard_id, update_data)
        logger.info(f"Billboard updated: {billboard_id} by {user.email}")
        return updated

    async def delete_billboard(self, billboard_id: UUID, user: User):
        """Delete a billboard. Only the owner or admin can delete."""
        billboard = await self.billboard_repo.get_by_id(billboard_id)
        if not billboard:
            raise NotFoundException("Billboard not found")

        if user.role != "admin" and billboard.owner_id != user.id:
            raise ForbiddenException("You can only delete your own billboards")

        await self.billboard_repo.delete(billboard_id)
        logger.info(f"Billboard deleted: {billboard_id} by {user.email}")

    async def search_billboards(
        self,
        filters: BillboardFilterParams,
        page: int = 1, per_page: int = 20,
        sort_by: str = "created_at", order: str = "desc",
    ):
        """Search and filter billboards with pagination."""
        skip = (page - 1) * per_page

        billboards, total = await self.billboard_repo.search_and_filter(
            skip=skip,
            limit=per_page,
            search=filters.search,
            city=filters.city,
            state=filters.state,
            category_id=filters.category_id,
            size_type=filters.size_type,
            price_min=filters.price_min,
            price_max=filters.price_max,
            is_illuminated=filters.is_illuminated,
            status=filters.status or "active",
            sort_by=sort_by,
            order=order,
        )

        return billboards, total

    async def get_owner_billboards(
        self, admin_id: UUID, page: int = 1, per_page: int = 20
    ):
        """Get billboards owned by a user."""
        skip = (page - 1) * per_page
        return await self.billboard_repo.get_by_owner(admin_id, skip=skip, limit=per_page)

    async def moderate_billboard(
        self, billboard_id: UUID, status: str, admin: User
    ):
        """Admin moderation — approve or reject a billboard."""
        billboard = await self.billboard_repo.get_by_id(billboard_id)
        if not billboard:
            raise NotFoundException("Billboard not found")

        updated = await self.billboard_repo.update(billboard_id, {"status": status})
        logger.info(f"Billboard {billboard_id} moderated to '{status}' by admin {admin.email}")
        return updated
