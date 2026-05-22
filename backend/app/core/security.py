"""
Security Utilities
===================
Handles JWT token creation/verification and password hashing.

Security Practices:
- bcrypt with 12 rounds for password hashing (computationally expensive to crack)
- JWT tokens with short expiry (15 min access, 7 day refresh)
- Token payload includes user ID, role, and type (access vs refresh)
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings

settings = get_settings()

# ── Password Hashing ────────────────────────────────────────
# bcrypt is intentionally slow to resist brute-force attacks
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ── JWT Token Management ────────────────────────────────────

def create_access_token(data: Dict[str, Any]) -> str:
    """
    Create a short-lived JWT access token.

    Args:
        data: Payload dict — must include 'sub' (user ID).

    Returns:
        Encoded JWT string.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({
        "exp": expire,
        "type": "access",
    })
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create a long-lived JWT refresh token.

    Args:
        data: Payload dict — must include 'sub' (user ID).

    Returns:
        Encoded JWT string.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    to_encode.update({
        "exp": expire,
        "type": "refresh",
    })
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate a JWT token.

    Returns:
        Token payload dict if valid, None if invalid/expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except JWTError:
        return None


def create_verification_token(email: str) -> str:
    """Create a token for email verification (24-hour expiry)."""
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    to_encode = {
        "sub": email,
        "type": "email_verification",
        "exp": expire,
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_password_reset_token(email: str) -> str:
    """Create a token for password reset (1-hour expiry)."""
    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    to_encode = {
        "sub": email,
        "type": "password_reset",
        "exp": expire,
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
