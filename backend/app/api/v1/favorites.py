"""
Favorites Routes
=================
Add, remove, and list favorite billboards.
All routes require authentication.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.favorite_service import FavoriteService
from app.utils.pagination import paginated_response

router = APIRouter()


@router.get("")
async def list_favorites(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List the authenticated user's favorite billboards."""
    service = FavoriteService(db)
    favorites, total = await service.get_user_favorites(
        user_id=current_user.id, page=page, per_page=per_page,
    )

    data = []
    for fav in favorites:
        billboard = fav.billboard
        primary_img = None
        if billboard and billboard.images:
            for img in billboard.images:
                if img.is_primary:
                    primary_img = img.file_path
                    break
            if not primary_img and billboard.images:
                primary_img = billboard.images[0].file_path

        data.append({
            "id": str(fav.id),
            "billboard_id": str(fav.billboard_id),
            "billboard_title": billboard.title if billboard else "",
            "billboard_city": billboard.city if billboard else "",
            "billboard_price_per_day": float(billboard.price_per_day) if billboard else 0,
            "billboard_primary_image": primary_img,
            "created_at": fav.created_at.isoformat(),
        })

    return paginated_response(data, total, page, per_page)


@router.post("/{billboard_id}", status_code=201)
async def add_favorite(
    billboard_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a billboard to favorites."""
    service = FavoriteService(db)
    await service.add_favorite(current_user.id, billboard_id)

    return {
        "status": "success",
        "message": "Billboard added to favorites",
    }


@router.delete("/{billboard_id}")
async def remove_favorite(
    billboard_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a billboard from favorites."""
    service = FavoriteService(db)
    await service.remove_favorite(current_user.id, billboard_id)

    return {
        "status": "success",
        "message": "Billboard removed from favorites",
    }
