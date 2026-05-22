"""
Dependencies — Dependency Injection
====================================
Provides reusable FastAPI dependencies for:
- Extracting the current authenticated user from JWT
- Enforcing role-based access control
- Getting the database session

These are injected via FastAPI's Depends() system, keeping
route handlers thin and focused on HTTP concerns.
"""

from typing import List
from uuid import UUID

from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User

# HTTP Bearer scheme — extracts token from "Authorization: Bearer <token>"
security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Extract and validate the current user from the JWT access token.

    Flow:
    1. Extract Bearer token from Authorization header
    2. Decode and validate JWT
    3. Look up user in database
    4. Return user object

    Raises:
        UnauthorizedException: If token is missing, invalid, or user not found.
    """
    if credentials is None:
        raise UnauthorizedException("Authorization header required")

    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        raise UnauthorizedException("Invalid or expired token")

    if payload.get("type") != "access":
        raise UnauthorizedException("Invalid token type")

    user_id = payload.get("sub")
    if user_id is None:
        raise UnauthorizedException("Invalid token payload")

    # Look up user in database
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()

    if user is None:
        raise UnauthorizedException("User not found")

    if not user.is_active:
        raise UnauthorizedException("User account is deactivated")

    return user


def require_role(allowed_roles: List[str]):
    """
    Factory that creates a dependency enforcing role-based access.

    Usage:
        @router.get("/admin", dependencies=[Depends(require_role(["admin"]))])
        async def admin_only_route():
            ...

    Or inject into handler to access the user:
        @router.get("/admin")
        async def admin_route(user: User = Depends(require_role(["admin"]))):
            ...
    """
    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in allowed_roles:
            raise ForbiddenException(
                f"Access denied. Required role(s): {', '.join(allowed_roles)}"
            )
        return current_user

    return role_checker
