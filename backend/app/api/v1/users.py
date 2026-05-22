"""
User Routes
=============
Handles user profile management.
All routes require authentication.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import ChangePasswordRequest
from app.schemas.user import UserProfileUpdate, UserResponse
from app.services.user_service import UserService

router = APIRouter()


@router.get("/me")
async def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    """Get the authenticated user's profile."""
    return {
        "status": "success",
        "data": UserResponse.model_validate(current_user),
    }


@router.patch("/me")
async def update_my_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the authenticated user's profile (name, phone, avatar)."""
    service = UserService(db)
    user = await service.update_profile(current_user.id, data)

    return {
        "status": "success",
        "message": "Profile updated successfully",
        "data": UserResponse.model_validate(user),
    }


@router.patch("/me/password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change the authenticated user's password."""
    service = UserService(db)
    await service.change_password(current_user, data)

    return {
        "status": "success",
        "message": "Password changed successfully",
    }
