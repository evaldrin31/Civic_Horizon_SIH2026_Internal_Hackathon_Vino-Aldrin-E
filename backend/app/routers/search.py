"""Search API routes."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.schemas import VenueListResponse
from app.services.venue_service import VenueService

router = APIRouter(prefix="/search", tags=["search"])


def get_venue_service(db: Session = Depends(get_db)) -> VenueService:
    return VenueService(db)


@router.get("", response_model=VenueListResponse)
def search(
    q: Optional[str] = Query(None, description="Search query for venue name"),
    category: Optional[str] = Query(None, description="Filter by category"),
    city: Optional[str] = Query(None, description="Filter by city"),
    state: Optional[str] = Query(None, description="Filter by state"),
    lat: Optional[float] = Query(None, ge=-90, le=90, description="Latitude for nearby"),
    lon: Optional[float] = Query(None, ge=-180, le=180, description="Longitude for nearby"),
    radius: float = Query(5.0, ge=0.1, le=100, description="Search radius in km"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    service: VenueService = Depends(get_venue_service)
):
    """Unified search endpoint supporting text search and location filtering."""
    skip = (page - 1) * page_size
    
    # If coordinates provided, do nearby search
    if lat is not None and lon is not None:
        venues, total = service.get_nearby_venues(
            latitude=lat,
            longitude=lon,
            radius_km=radius,
            category=category,
            skip=skip,
            limit=page_size
        )
    else:
        # Text-based search
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
