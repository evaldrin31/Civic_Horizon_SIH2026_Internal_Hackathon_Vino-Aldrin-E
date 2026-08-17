"""Venue API routes."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import NotFoundException, ValidationException
from app.schemas.schemas import (
    VenueCreate, VenueResponse, VenueListResponse, VenueUpdate,
    VenueSearchParams, NearbySearchParams, VenueLocationCreate, VenueLocationResponse
)
from app.services.venue_service import VenueService

router = APIRouter(prefix="/venues", tags=["venues"])


def get_venue_service(db: Session = Depends(get_db)) -> VenueService:
    return VenueService(db)


@router.get("", response_model=VenueListResponse)
def list_venues(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    category: Optional[str] = Query(None, description="Filter by category"),
    city: Optional[str] = Query(None, description="Filter by city"),
    state: Optional[str] = Query(None, description="Filter by state"),
    service: VenueService = Depends(get_venue_service)
):
    """List venues with optional filters."""
    skip = (page - 1) * page_size
    venues, total = service.list_venues(
        skip=skip, limit=page_size,
        category=category, city=city, state=state
    )
    
    return {
        "items": venues,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size
    }


@router.get("/search", response_model=VenueListResponse)
def search_venues(
    q: Optional[str] = Query(None, description="Search query for venue name"),
    category: Optional[str] = Query(None, description="Filter by category"),
    city: Optional[str] = Query(None, description="Filter by city"),
    state: Optional[str] = Query(None, description="Filter by state"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    service: VenueService = Depends(get_venue_service)
):
    """Search venues by name and filters."""
    skip = (page - 1) * page_size
    venues, total = service.search_venues(
        query_str=q,
        category=category,
        city=city,
        state=state,
        skip=skip,
        limit=page_size
    )
    
    return {
        "items": venues,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size
    }


@router.get("/nearby", response_model=VenueListResponse)
def get_nearby_venues(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
    radius: float = Query(5.0, ge=0.1, le=100, description="Search radius in km"),
    category: Optional[str] = Query(None, description="Filter by category"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    service: VenueService = Depends(get_venue_service)
):
    """Get venues near a location."""
    skip = (page - 1) * page_size
    venues, total = service.get_nearby_venues(
        latitude=lat,
        longitude=lon,
        radius_km=radius,
        category=category,
        skip=skip,
        limit=page_size
    )
    
    return {
        "items": venues,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size
    }


@router.get("/{venue_id}", response_model=VenueResponse)
def get_venue(
    venue_id: UUID,
    service: VenueService = Depends(get_venue_service)
):
    """Get a venue by ID."""
    try:
        return service.get_venue(venue_id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.post("", response_model=VenueResponse, status_code=status.HTTP_201_CREATED)
def create_venue(
    venue_data: VenueCreate,
    service: VenueService = Depends(get_venue_service)
):
    """Create a new venue."""
    return service.create_venue(venue_data)


@router.patch("/{venue_id}", response_model=VenueResponse)
def update_venue(
    venue_id: UUID,
    venue_data: VenueUpdate,
    service: VenueService = Depends(get_venue_service)
):
    """Update a venue."""
    try:
        return service.update_venue(venue_id, venue_data)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.delete("/{venue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_venue(
    venue_id: UUID,
    service: VenueService = Depends(get_venue_service)
):
    """Delete a venue."""
    try:
        service.delete_venue(venue_id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
