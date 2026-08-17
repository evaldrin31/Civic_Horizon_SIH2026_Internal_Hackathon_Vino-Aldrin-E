"""Error handling middleware."""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.core.exceptions import AIPException, NotFoundException, ValidationException
from app.core.logging import get_logger

logger = get_logger(__name__)


async def aip_exception_handler(request: Request, exc: AIPException):
    """Handle custom AIP exceptions."""
    logger.warning(f"AIP exception: {exc.code} - {exc.message}")
    
    status_code = status.HTTP_400_BAD_REQUEST
    if isinstance(exc, NotFoundException):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(exc, ValidationException):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    
    return JSONResponse(
        status_code=status_code,
        content={
            "error": exc.code,
            "message": exc.message
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors."""
    logger.warning(f"Validation error: {exc.errors()}")
    
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(x) for x in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "VALIDATION_ERROR",
            "message": "Request validation failed",
            "details": errors
        }
    )


async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handle database errors."""
    logger.error(f"Database error: {exc}")
    
    message = "Database error occurred"
    if isinstance(exc, IntegrityError):
        message = "Data integrity violation"
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "DATABASE_ERROR",
            "message": message
        }
    )


async def generic_exception_handler(request: Request, exc: Exception):
    """Handle unhandled exceptions."""
    logger.exception(f"Unhandled exception: {exc}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "INTERNAL_ERROR",
            "message": "An internal server error occurred"
        }
    )
