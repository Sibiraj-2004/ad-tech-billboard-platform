"""
Image Routes
==============
Upload and manage billboard images.
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.image import ImageResponse
from app.services.image_service import ImageService

router = APIRouter()


@router.post("/billboards/{billboard_id}/images", status_code=201)
async def upload_images(
    billboard_id: UUID,
    files: List[UploadFile] = File(..., description="Image files to upload"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload one or more images for a billboard.
    Max 10 images per billboard. Thumbnails generated automatically.
    """
    service = ImageService(db)
    images = await service.upload_images(billboard_id, files, current_user)

    return {
        "status": "success",
        "message": f"{len(images)} image(s) uploaded successfully",
        "data": [ImageResponse.model_validate(img) for img in images],
    }


@router.delete("/{image_id}")
async def delete_image(
    image_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an image. Only billboard owner or admin."""
    service = ImageService(db)
    await service.delete_image(image_id, current_user)

    return {
        "status": "success",
        "message": "Image deleted successfully",
    }


@router.patch("/{image_id}/primary")
async def set_primary_image(
    image_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Set an image as the primary display image for its billboard."""
    service = ImageService(db)
    await service.set_primary(image_id, current_user)

    return {
        "status": "success",
        "message": "Primary image updated",
    }
