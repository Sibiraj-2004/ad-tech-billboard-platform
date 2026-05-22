"""
User Service
==============
Business logic for user profile management.
"""

import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestException, NotFoundException
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.auth import ChangePasswordRequest
from app.schemas.user import UserProfileUpdate

logger = logging.getLogger(__name__)


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def get_profile(self, user_id: UUID) -> User:
        """Get user profile by ID."""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        return user

    async def update_profile(self, user_id: UUID, data: UserProfileUpdate) -> User:
        """Update user profile fields (name, phone, avatar)."""
        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            raise BadRequestException("No fields to update")

        user = await self.user_repo.update(user_id, update_data)
        if not user:
            raise NotFoundException("User not found")

        logger.info(f"Profile updated for user: {user_id}")
        return user

    async def change_password(
        self, user: User, data: ChangePasswordRequest
    ) -> None:
        """
        Change password for the authenticated user.
        Requires current password verification.
        """
        if not verify_password(data.current_password, user.hashed_password):
            raise BadRequestException("Current password is incorrect")

        if data.current_password == data.new_password:
            raise BadRequestException("New password must be different from current password")

        await self.user_repo.update(user.id, {
            "hashed_password": hash_password(data.new_password),
        })

        logger.info(f"Password changed for user: {user.id}")

    async def get_all_users(
        self, skip: int = 0, limit: int = 20,
        role: str = None, is_active: bool = None, search: str = None,
    ):
        """Get all users with filtering (admin use)."""
        return await self.user_repo.get_all_users(
            skip=skip, limit=limit,
            role=role, is_active=is_active, search=search,
        )

    async def admin_update_user(self, user_id: UUID, update_data: dict) -> User:
        """Admin-level user update (role, active status, verification)."""
        user = await self.user_repo.update(user_id, update_data)
        if not user:
            raise NotFoundException("User not found")

        logger.info(f"Admin updated user {user_id}: {update_data}")
        return user
