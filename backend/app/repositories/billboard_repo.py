"""
Billboard Repository
=====================
Data access for billboard CRUD and advanced search/filter queries.
Uses PostgreSQL full-text search for keyword matching.
"""

from decimal import Decimal
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.billboard import Billboard
from app.models.image import Image
from app.repositories.base import BaseRepository


class BillboardRepository(BaseRepository[Billboard]):
    def __init__(self, db: AsyncSession):
        super().__init__(Billboard, db)

    async def get_with_images(self, billboard_id: UUID) -> Optional[Billboard]:
        """Get a billboard with eager-loaded images."""
        result = await self.db.execute(
            select(Billboard)
            .options(selectinload(Billboard.images))
            .where(Billboard.id == billboard_id)
        )
        return result.scalar_one_or_none()

    async def search_and_filter(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        category_id: Optional[UUID] = None,
        size_type: Optional[str] = None,
        price_min: Optional[Decimal] = None,
        price_max: Optional[Decimal] = None,
        is_illuminated: Optional[bool] = None,
        status: str = "active",
        sort_by: str = "created_at",
        order: str = "desc",
    ) -> Tuple[List[Billboard], int]:
        """
        Advanced search and filter with pagination.

        Uses ILIKE for text search (upgradeable to tsvector FTS later).
        Returns (results, total_count) tuple for pagination.
        """
        query = select(Billboard).options(selectinload(Billboard.images))

        # ── Apply Filters ────────────────────────────────────
        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    Billboard.title.ilike(search_term),
                    Billboard.description.ilike(search_term),
                    Billboard.address.ilike(search_term),
                )
            )

        if city:
            query = query.where(Billboard.city.ilike(f"%{city}%"))
        if state:
            query = query.where(Billboard.state.ilike(f"%{state}%"))
        if category_id:
            query = query.where(Billboard.category_id == category_id)
        if size_type:
            query = query.where(Billboard.size_type == size_type)
        if price_min is not None:
            query = query.where(Billboard.price_per_day >= price_min)
        if price_max is not None:
            query = query.where(Billboard.price_per_day <= price_max)
        if is_illuminated is not None:
            query = query.where(Billboard.is_illuminated == is_illuminated)
        if status:
            query = query.where(Billboard.status == status)

        # ── Count Total ──────────────────────────────────────
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()

        # ── Apply Sorting ────────────────────────────────────
        sort_column = getattr(Billboard, sort_by, Billboard.created_at)
        if order == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        # ── Paginate ─────────────────────────────────────────
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        billboards = list(result.scalars().unique().all())

        return billboards, total

    async def get_by_owner(
        self, owner_id: UUID, skip: int = 0, limit: int = 20
    ) -> Tuple[List[Billboard], int]:
        """Get billboards owned by a specific user."""
        query = select(Billboard).where(Billboard.owner_id == owner_id)

        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()

        query = query.order_by(Billboard.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        billboards = list(result.scalars().all())

        return billboards, total

    async def count_by_status(self) -> dict:
        """Count billboards by status (for admin dashboard)."""
        result = await self.db.execute(
            select(Billboard.status, func.count(Billboard.id))
            .group_by(Billboard.status)
        )
        return dict(result.all())
