"""
Auth Service
==============
Business logic for registration, login, token management,
password reset, and email verification.

All auth decisions are here — routes just parse HTTP and call this service.
"""

import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    BadRequestException, ConflictException, NotFoundException, UnauthorizedException,
)
from app.core.security import (
    create_access_token, create_password_reset_token, create_refresh_token,
    create_verification_token, decode_token, hash_password, verify_password,
)
from app.repositories.user_repo import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def register(self, data: RegisterRequest) -> dict:
        """
        Register a new user.

        Validates:
        - Email is unique
        - Username is unique
        - Hashes password with bcrypt

        Returns user data + JWT tokens.
        """
        # Check email uniqueness
        existing_email = await self.user_repo.get_by_email(data.email)
        if existing_email:
            raise ConflictException("Email already registered")

        # Check username uniqueness
        existing_username = await self.user_repo.get_by_username(data.username)
        if existing_username:
            raise ConflictException("Username already taken")

        # Create user with hashed password
        user = await self.user_repo.create({
            "email": data.email,
            "username": data.username,
            "hashed_password": hash_password(data.password),
            "full_name": data.full_name,
            "phone": data.phone,
            "role": data.role,
        })

        logger.info(f"New user registered: {user.email} (role={user.role})")

        # Generate tokens
        token_data = {"sub": str(user.id), "role": user.role}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        # Generate verification token
        verification_token = create_verification_token(user.email)

        return {
            "user": user,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "verification_token": verification_token,
        }

    async def login(self, data: LoginRequest) -> dict:
        """
        Authenticate a user with email + password.

        Returns JWT token pair on success.
        Raises UnauthorizedException on failure (generic message to prevent enumeration).
        """
        user = await self.user_repo.get_by_email(data.email)

        if not user or not verify_password(data.password, user.hashed_password):
            raise UnauthorizedException("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedException("Account is deactivated. Contact support.")

        logger.info(f"User logged in: {user.email}")

        token_data = {"sub": str(user.id), "role": user.role}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    async def refresh_token(self, refresh_token: str) -> dict:
        """Generate a new access token from a valid refresh token."""
        payload = decode_token(refresh_token)

        if not payload or payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid refresh token")

        user_id = payload.get("sub")
        user = await self.user_repo.get_by_id(user_id)

        if not user or not user.is_active:
            raise UnauthorizedException("User not found or deactivated")

        token_data = {"sub": str(user.id), "role": user.role}
        new_access_token = create_access_token(token_data)

        return {
            "access_token": new_access_token,
            "token_type": "bearer",
        }

    async def forgot_password(self, email: str) -> Optional[str]:
        """
        Generate a password reset token.
        Returns the token (in production, this would be emailed).
        Always returns success to prevent email enumeration.
        """
        user = await self.user_repo.get_by_email(email)

        if not user:
            logger.warning(f"Password reset requested for unknown email: {email}")
            return None  # Don't reveal whether email exists

        token = create_password_reset_token(email)
        logger.info(f"Password reset token generated for: {email}")
        return token

    async def reset_password(self, token: str, new_password: str) -> None:
        """Reset password using a valid reset token."""
        payload = decode_token(token)

        if not payload or payload.get("type") != "password_reset":
            raise BadRequestException("Invalid or expired reset token")

        email = payload.get("sub")
        user = await self.user_repo.get_by_email(email)

        if not user:
            raise NotFoundException("User not found")

        await self.user_repo.update(user.id, {
            "hashed_password": hash_password(new_password),
        })

        logger.info(f"Password reset completed for: {email}")

    async def verify_email(self, token: str) -> None:
        """Verify a user's email address using the verification token."""
        payload = decode_token(token)

        if not payload or payload.get("type") != "email_verification":
            raise BadRequestException("Invalid or expired verification token")

        email = payload.get("sub")
        user = await self.user_repo.get_by_email(email)

        if not user:
            raise NotFoundException("User not found")

        if user.is_verified:
            return  # Already verified, no-op

        await self.user_repo.update(user.id, {"is_verified": True})
        logger.info(f"Email verified for: {email}")
