"""
Custom Exceptions & Global Error Handlers
==========================================
Defines domain-specific exceptions and registers global handlers
so all errors return a consistent JSON response envelope.
"""

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


# ── Custom Exception Classes ─────────────────────────────────

class AppException(Exception):
    """Base application exception. All custom exceptions inherit from this."""
    def __init__(self, message: str, status_code: int = 400, errors: list = None):
        self.message = message
        self.status_code = status_code
        self.errors = errors or []
        super().__init__(self.message)


class NotFoundException(AppException):
    """Resource not found (404)."""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message=message, status_code=404)


class UnauthorizedException(AppException):
    """Authentication failed (401)."""
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message=message, status_code=401)


class ForbiddenException(AppException):
    """Insufficient permissions (403)."""
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message=message, status_code=403)


class ConflictException(AppException):
    """Resource conflict — e.g., duplicate email, booking overlap (409)."""
    def __init__(self, message: str = "Resource conflict"):
        super().__init__(message=message, status_code=409)


class BadRequestException(AppException):
    """Invalid request data (400)."""
    def __init__(self, message: str = "Bad request", errors: list = None):
        super().__init__(message=message, status_code=400, errors=errors)


# ── Global Exception Handlers ────────────────────────────────

def get_cors_headers(request: Request) -> dict:
    """Get CORS headers based on the request's origin to prevent CORS masking on errors."""
    headers = {}
    origin = request.headers.get("origin")
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return headers


def register_exception_handlers(app: FastAPI) -> None:
    """Register all global exception handlers on the FastAPI app."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        """Handle all custom application exceptions."""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "message": exc.message,
                "errors": exc.errors,
            },
            headers=get_cors_headers(request)
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle Pydantic validation errors with a clean response format."""
        errors = []
        for error in exc.errors():
            field = " → ".join(str(loc) for loc in error["loc"])
            errors.append({
                "field": field,
                "message": error["msg"],
            })
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "status": "error",
                "message": "Validation failed",
                "errors": errors,
            },
            headers=get_cors_headers(request)
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Catch-all handler — prevents stack traces from leaking to the client."""
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "message": "Internal server error",
                "errors": [],
            },
            headers=get_cors_headers(request)
        )
