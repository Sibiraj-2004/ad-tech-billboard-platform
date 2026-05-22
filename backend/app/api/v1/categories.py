"""
Category Routes
================
Public listing and admin-only creation of billboard categories.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User
from app.repositories.category_repo import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryResponse
from app.utils.validators import slugify

router = APIRouter()


@router.get("")
async def list_categories(
    db: AsyncSession = Depends(get_db),
):
    """List all active categories. Public endpoint."""
    repo = CategoryRepository(db)
    categories = await repo.get_active()

    return {
        "status": "success",
        "data": [CategoryResponse.model_validate(c) for c in categories],
    }


@router.post("", status_code=201)
async def create_category(
    data: CategoryCreate,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Create a new category. Admin only."""
    repo = CategoryRepository(db)

    # Check for duplicate name
    existing = await repo.get_by_name(data.name)
    if existing:
        from app.core.exceptions import ConflictException
        raise ConflictException(f"Category '{data.name}' already exists")

    # Auto-generate slug from name
    slug = slugify(data.name)

    category = await repo.create({
        "name": data.name,
        "slug": slug,
        "description": data.description,
    })

    return {
        "status": "success",
        "message": "Category created successfully",
        "data": CategoryResponse.model_validate(category),
    }
