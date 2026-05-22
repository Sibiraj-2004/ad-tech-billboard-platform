"""
User Repository
================
Data access layer for user-related database operations.
"""

from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> Optional[User]:
        """Find a user by email address."""
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> Optional[User]:
        """Find a user by username."""
        result = await self.db.execute(
            select(User).where(User.username == username)
        )
        return result.scalar_one_or_none()

    async def get_all_users(
        self,
        skip: int = 0,
        limit: int = 20,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ):
        """Get users with optional filtering for admin panel."""
        query = select(User)

        if role:
            query = query.where(User.role == role)
        if is_active is not None:
            query = query.where(User.is_active == is_active)
        if search:
            search_term = f"%{search}%"
            query = query.where(
                (User.email.ilike(search_term)) |
                (User.username.ilike(search_term)) |
                (User.full_name.ilike(search_term))
            )

        # Get total count for pagination
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()

        # Get paginated results
        query = query.order_by(User.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        users = list(result.scalars().all())

        return users, total

    async def count_by_role(self) -> dict:
        """Count users grouped by role (for analytics)."""
        result = await self.db.execute(
            select(User.role, func.count(User.id))
            .group_by(User.role)
        )
        return dict(result.all())
