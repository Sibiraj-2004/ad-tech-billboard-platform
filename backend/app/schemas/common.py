"""
Common Schemas
===============
Shared Pydantic models for pagination, standard responses, and filters.
Used across all API endpoints for consistency.
"""

from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field


# ── Pagination ───────────────────────────────────────────────

class PaginationParams(BaseModel):
    """Query parameters for paginated endpoints."""
    page: int = Field(1, ge=1, description="Page number (1-indexed)")
    per_page: int = Field(20, ge=1, le=100, description="Items per page (max 100)")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.per_page


class PaginationMeta(BaseModel):
    """Pagination metadata included in paginated responses."""
    page: int
    per_page: int
    total: int
    total_pages: int


# ── Standard Response Envelope ───────────────────────────────

class SuccessResponse(BaseModel):
    """Standard success response wrapper."""
    status: str = "success"
    message: str = ""
    data: Any = None
    meta: Optional[PaginationMeta] = None


class ErrorResponse(BaseModel):
    """Standard error response wrapper."""
    status: str = "error"
    message: str
    errors: List[dict] = []


# ── Sort Parameters ──────────────────────────────────────────

class SortParams(BaseModel):
    """Query parameters for sorted endpoints."""
    sort_by: str = Field("created_at", description="Field to sort by")
    order: str = Field("desc", pattern="^(asc|desc)$", description="Sort direction")
