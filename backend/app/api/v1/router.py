"""
API v1 Router
==============
Aggregates all v1 route modules into a single router.
Mounted at /api/v1 in main.py.
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.billboards import router as billboards_router
from app.api.v1.bookings import router as bookings_router
from app.api.v1.favorites import router as favorites_router
from app.api.v1.images import router as images_router
from app.api.v1.categories import router as categories_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.admin import router as admin_router
from app.api.v1.invoices import router as invoices_router
from app.api.v1.payments import router as payments_router
from app.api.v1.campaigns import router as campaigns_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(billboards_router, prefix="/billboards", tags=["Billboards"])
api_router.include_router(bookings_router, prefix="/bookings", tags=["Bookings"])
api_router.include_router(favorites_router, prefix="/favorites", tags=["Favorites"])
api_router.include_router(images_router, prefix="/images", tags=["Images"])
api_router.include_router(categories_router, prefix="/categories", tags=["Categories"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin"])
api_router.include_router(invoices_router, prefix="/invoices", tags=["Invoices"])
api_router.include_router(payments_router, prefix="/payments", tags=["Payments"])
api_router.include_router(campaigns_router, prefix="/campaigns", tags=["AI Campaigns"])
