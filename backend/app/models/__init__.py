"""
Import all models here so Alembic can discover them.
"""

from app.models.user import User
from app.models.billboard import Billboard
from app.models.booking import Booking
from app.models.favorite import Favorite
from app.models.category import Category
from app.models.image import Image
from app.models.analytics import Analytics
from app.models.admin_log import AdminLog
from app.models.invoice import Invoice

__all__ = [
    "User",
    "Billboard",
    "Booking",
    "Favorite",
    "Category",
    "Image",
    "Analytics",
    "AdminLog",
    "Invoice",
]
