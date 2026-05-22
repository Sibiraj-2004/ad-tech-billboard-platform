"""
Database Initialization
========================
Seed data and initial setup for development.
"""

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.category import Category
from app.models.user import User
from app.repositories.category_repo import CategoryRepository
from app.repositories.user_repo import UserRepository
from app.utils.validators import slugify

logger = logging.getLogger(__name__)

# Default categories for billboard types
DEFAULT_CATEGORIES = [
    {"name": "Highway", "description": "Large billboards along highways and expressways"},
    {"name": "Urban", "description": "City-center billboards with high foot traffic"},
    {"name": "Digital", "description": "LED and digital display billboards"},
    {"name": "Transit", "description": "Billboards at bus stops, train stations, airports"},
    {"name": "Retail", "description": "Billboards near shopping malls and retail areas"},
    {"name": "Suburban", "description": "Billboards in residential and suburban areas"},
]


async def init_db(db: AsyncSession) -> None:
    """
    Initialize database with seed data.
    Creates default admin user and categories if they don't exist.
    """
    user_repo = UserRepository(db)
    category_repo = CategoryRepository(db)

    # ── Create default admin user ────────────────────────────
    admin = await user_repo.get_by_email("admin@adtech.com")
    if not admin:
        await user_repo.create({
            "email": "admin@adtech.com",
            "username": "admin",
            "hashed_password": hash_password("admin123456"),
            "full_name": "System Administrator",
            "role": "admin",
            "is_active": True,
            "is_verified": True,
        })
        logger.info("Default admin user created: admin@adtech.com")

    # ── Create default categories ────────────────────────────
    for cat_data in DEFAULT_CATEGORIES:
        existing = await category_repo.get_by_name(cat_data["name"])
        if not existing:
            await category_repo.create({
                "name": cat_data["name"],
                "slug": slugify(cat_data["name"]),
                "description": cat_data["description"],
                "is_active": True,
            })
            logger.info(f"Category created: {cat_data['name']}")

    await db.commit()
    logger.info("Database initialization complete")
