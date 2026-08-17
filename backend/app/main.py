"""Main FastAPI application."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import get_settings
from app.core.database import engine
from app.core.logging import configure_logging, get_logger
from app.middleware.error_handlers import (
    aip_exception_handler,
    validation_exception_handler,
    sqlalchemy_exception_handler,
    generic_exception_handler
)
from app.core.exceptions import AIPException
from app.routers import venues, accessibility, search, evidence, import_routes

configure_logging()
logger = get_logger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    yield
    logger.info("Shutting down application")
    engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Evidence-backed venue-level accessibility intelligence platform",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(AIPException, aip_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Include routers
app.include_router(
    venues.router,
    prefix=settings.api_v1_prefix,
    tags=["venues"]
)
app.include_router(
    accessibility.router,
    prefix=settings.api_v1_prefix,
    tags=["accessibility"]
)
app.include_router(
    search.router,
    prefix=settings.api_v1_prefix,
    tags=["search"]
)
app.include_router(
    evidence.router,
    prefix=settings.api_v1_prefix,
    tags=["evidence"]
)
app.include_router(
    import_routes.router,
    prefix=settings.api_v1_prefix + "/admin",
    tags=["import"]
)


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "api_prefix": settings.api_v1_prefix
    }


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "healthy"}
