"""
Auth Routes
============
Handles registration, login, token refresh, email verification,
and password reset endpoints.

All routes are public (no authentication required).
"""

from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.auth import (
    ForgotPasswordRequest, LoginRequest, RefreshTokenRequest,
    RegisterRequest, ResetPasswordRequest, TokenResponse,
)
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService
from app.services.email_service import EmailService

router = APIRouter()


@router.post("/register", status_code=201)
async def register(
    data: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user account.

    - Validates email/username uniqueness
    - Hashes password with bcrypt
    - Returns JWT tokens
    - Sends verification email (background)
    """
    service = AuthService(db)
    result = await service.register(data)

    # Send verification email in background (non-blocking)
    background_tasks.add_task(
        EmailService.send_verification_email,
        data.email,
        result["verification_token"],
    )

    return {
        "status": "success",
        "message": "Registration successful. Please verify your email.",
        "data": {
            "user": UserResponse.model_validate(result["user"]),
            "access_token": result["access_token"],
            "refresh_token": result["refresh_token"],
            "token_type": "bearer",
        },
    }


@router.post("/login")
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Login with email and password.
    Returns JWT access + refresh tokens.
    """
    service = AuthService(db)
    tokens = await service.login(data)

    return {
        "status": "success",
        "message": "Login successful",
        "data": tokens,
    }


@router.post("/refresh")
async def refresh_token(
    data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generate a new access token using a valid refresh token."""
    service = AuthService(db)
    tokens = await service.refresh_token(data.refresh_token)

    return {
        "status": "success",
        "message": "Token refreshed",
        "data": tokens,
    }


@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Request a password reset email.
    Always returns success (prevents email enumeration).
    """
    service = AuthService(db)
    token = await service.forgot_password(data.email)

    if token:
        background_tasks.add_task(
            EmailService.send_password_reset_email,
            data.email,
            token,
        )

    return {
        "status": "success",
        "message": "If the email exists, a password reset link has been sent.",
    }


@router.post("/reset-password")
async def reset_password(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Reset password using a valid reset token."""
    service = AuthService(db)
    await service.reset_password(data.token, data.new_password)

    return {
        "status": "success",
        "message": "Password reset successful. You can now login with your new password.",
    }


@router.get("/verify-email/{token}")
async def verify_email(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Verify email address using the verification token."""
    service = AuthService(db)
    await service.verify_email(token)

    return {
        "status": "success",
        "message": "Email verified successfully.",
    }
