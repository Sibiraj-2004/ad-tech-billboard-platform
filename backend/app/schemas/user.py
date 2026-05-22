"""
User Schemas
=============
Request/response models for user management.
Sensitive fields (hashed_password) are excluded from responses.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserResponse(BaseModel):
    """User data returned from API (no password hash)."""
    id: UUID
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    """Updatable user profile fields."""
    full_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = Field(None, max_length=500)


class UserAdminUpdate(BaseModel):
    """Admin-only user update fields."""
    role: Optional[str] = Field(None, pattern="^(admin|advertiser)$")
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class UserListResponse(BaseModel):
    """User info for admin user lists."""
    id: UUID
    email: str
    username: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}
