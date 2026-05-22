"""
File Handler Utility
=====================
Handles file saving, deletion, and thumbnail generation.
Abstracted so the storage backend (local / S3) can be swapped
by changing this single module.
"""

import os
import uuid
from io import BytesIO
from pathlib import Path
from typing import Tuple

from app.config import get_settings

settings = get_settings()


class FileHandler:
    """Local file storage handler with thumbnail generation."""

    def __init__(self):
        self.upload_dir = Path.cwd() / settings.UPLOAD_DIR
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def save_image(
        self,
        content: bytes,
        original_filename: str,
        content_type: str,
        billboard_id: str,
    ) -> Tuple[str, str]:
        """
        Save an image file and generate a thumbnail.

        Returns:
            Tuple of (file_path, thumbnail_path) relative to upload dir.
        """
        # Generate unique filename to prevent collisions
        ext = original_filename.rsplit(".", 1)[-1] if "." in original_filename else "jpg"
        unique_name = f"{uuid.uuid4().hex}.{ext}"

        # Create billboard-specific directory
        billboard_dir = self.upload_dir / billboard_id
        billboard_dir.mkdir(parents=True, exist_ok=True)

        thumb_dir = billboard_dir / "thumbnails"
        thumb_dir.mkdir(parents=True, exist_ok=True)

        # Save original file
        file_path = billboard_dir / unique_name
        with open(file_path, "wb") as f:
            f.write(content)

        # Generate thumbnail
        thumbnail_path = thumb_dir / f"thumb_{unique_name}"
        try:
            from PIL import Image

            img = Image.open(BytesIO(content))
            img.thumbnail((300, 300))

            # Convert RGBA to RGB for JPEG compatibility
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            img.save(str(thumbnail_path), quality=85)
        except Exception:
            # If thumbnail generation fails, use original
            thumbnail_path = file_path

        # Return relative paths for database storage
        rel_file = str(file_path.relative_to(Path.cwd())).replace("\\", "/")
        rel_thumb = str(thumbnail_path.relative_to(Path.cwd())).replace("\\", "/")

        return rel_file, rel_thumb

    async def delete_file(self, file_path: str) -> None:
        """Delete a file from disk. Silently ignores missing files."""
        try:
            full_path = Path.cwd() / file_path
            if full_path.exists():
                os.remove(full_path)
        except Exception:
            pass  # Log but don't fail — file may already be deleted
