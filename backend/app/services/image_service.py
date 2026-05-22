"""
Image Service
==============
Business logic for image upload, compression, thumbnail generation,
and metadata management.

Files are saved to local disk in development.
The file_handler utility abstracts storage for easy S3 swap later.
"""

import logging
import os
import uuid as uuid_lib
from typing import List
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models.user import User
from app.repositories.billboard_repo import BillboardRepository
from app.repositories.image_repo import ImageRepository
from app.utils.file_handler import FileHandler

logger = logging.getLogger(__name__)
settings = get_settings()


class ImageService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.image_repo = ImageRepository(db)
        self.billboard_repo = BillboardRepository(db)
        self.file_handler = FileHandler()

    async def upload_images(
        self, billboard_id: UUID, files: List[UploadFile], user: User
    ) -> list:
        """
        Upload one or more images for a billboard.

        Validates:
        - Billboard exists and user owns it (or is admin)
        - File type is allowed (JPEG, PNG, WebP)
        - File size is within limit
        - Max 10 images per billboard
        """
        # Verify billboard ownership
        billboard = await self.billboard_repo.get_by_id(billboard_id)
        if not billboard:
            raise NotFoundException("Billboard not found")

        if user.role != "admin" and billboard.owner_id != user.id:
            raise ForbiddenException("You can only upload images to your own billboards")

        # Check image count limit
        current_count = await self.image_repo.count_by_billboard(billboard_id)
        if current_count + len(files) > 10:
            raise BadRequestException(
                f"Maximum 10 images per billboard. Currently {current_count}, "
                f"trying to add {len(files)}."
            )

        uploaded_images = []

        for file in files:
            # Validate file type
            if file.content_type not in settings.allowed_image_types_list:
                raise BadRequestException(
                    f"Invalid file type: {file.content_type}. "
                    f"Allowed: {', '.join(settings.allowed_image_types_list)}"
                )

            # Read file content
            content = await file.read()

            # Validate file size
            if len(content) > settings.max_file_size_bytes:
                raise BadRequestException(
                    f"File {file.filename} exceeds max size of {settings.MAX_FILE_SIZE_MB}MB"
                )

            # Save file to disk
            file_path, thumbnail_path = await self.file_handler.save_image(
                content=content,
                original_filename=file.filename,
                content_type=file.content_type,
                billboard_id=str(billboard_id),
            )

            # Determine if this should be the primary image
            is_primary = current_count == 0 and len(uploaded_images) == 0

            # Save metadata to database
            image = await self.image_repo.create({
                "billboard_id": billboard_id,
                "file_path": file_path,
                "thumbnail_path": thumbnail_path,
                "original_filename": file.filename,
                "content_type": file.content_type,
                "file_size": len(content),
                "is_primary": is_primary,
                "sort_order": current_count + len(uploaded_images),
            })

            uploaded_images.append(image)
            logger.info(f"Image uploaded: {file.filename} for billboard {billboard_id}")

        return uploaded_images

    async def delete_image(self, image_id: UUID, user: User):
        """Delete an image by ID."""
        image = await self.image_repo.get_by_id(image_id)
        if not image:
            raise NotFoundException("Image not found")

        # Verify ownership
        billboard = await self.billboard_repo.get_by_id(image.billboard_id)
        if user.role != "admin" and billboard.owner_id != user.id:
            raise ForbiddenException("You can only delete images from your own billboards")

        # Delete file from disk
        await self.file_handler.delete_file(image.file_path)
        if image.thumbnail_path:
            await self.file_handler.delete_file(image.thumbnail_path)

        # Delete from database
        await self.image_repo.delete(image_id)
        logger.info(f"Image deleted: {image_id}")

    async def set_primary(self, image_id: UUID, user: User):
        """Set an image as the primary image for its billboard."""
        image = await self.image_repo.get_by_id(image_id)
        if not image:
            raise NotFoundException("Image not found")

        billboard = await self.billboard_repo.get_by_id(image.billboard_id)
        if user.role != "admin" and billboard.owner_id != user.id:
            raise ForbiddenException("You can only manage images of your own billboards")

        await self.image_repo.set_primary(image_id, image.billboard_id)
        logger.info(f"Image {image_id} set as primary for billboard {image.billboard_id}")
