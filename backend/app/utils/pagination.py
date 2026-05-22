"""
Pagination Utility
===================
Helpers for building paginated responses.
"""

import math
from typing import Any, List

from app.schemas.common import PaginationMeta, SuccessResponse


def paginated_response(
    data: List[Any],
    total: int,
    page: int,
    per_page: int,
    message: str = "",
) -> dict:
    """
    Build a standard paginated response envelope.

    Args:
        data: List of items for current page
        total: Total number of items across all pages
        page: Current page number (1-indexed)
        per_page: Items per page
        message: Optional success message

    Returns:
        Dict matching SuccessResponse schema with pagination meta.
    """
    total_pages = math.ceil(total / per_page) if per_page > 0 else 0

    return {
        "status": "success",
        "message": message,
        "data": data,
        "meta": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": total_pages,
        },
    }
