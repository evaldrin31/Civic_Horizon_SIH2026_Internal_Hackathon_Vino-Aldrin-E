"""Venue API routes."""

from typing import Optional

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
    has_accessible_entrance: Optional[bool] = Query(None, description="Filter for venues with accessible entrance"),
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
        has_accessible_entrance=has_accessible_entrance,
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
    has_accessible_entrance: Optional[bool] = Query(None, description="Filter for venues with accessible entrance"),
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
        has_accessible_entrance=has_accessible_entrance,
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
    venue_id: str,
    service: VenueService = Depends(get_venue_service)
):
    """Get a venue by ID."""
    try:
        return service.get_venue(venue_id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "NOT_FOUND", "message": e.message})


@router.get("/{venue_id}/detail")
def get_venue_with_details(
    venue_id: str,
    service: VenueService = Depends(get_venue_service)
):
    """Get a venue with all nested details (locations, attributes, evidence).
    
    This endpoint returns the complete venue information including:
    - venue details
    - all locations/entrances
    - all accessibility attributes with their locations
    - evidence for each attribute
    
    Use this for venue detail pages where complete information is needed.
    """
    try:
        venue = service.get_venue_with_details(venue_id)
        
        # Convert to dict and include nested relationships
        result = {
            "venue_id": str(venue.venue_id),
            "name": venue.name,
            "category": venue.category,
            "address": venue.address,
            "city": venue.city,
            "state": venue.state,
            "country": venue.country,
            "postal_code": venue.postal_code,
            "latitude": venue.latitude,
            "longitude": venue.longitude,
            "official_url": venue.official_url,
            "contact_phone": venue.contact_phone,
            "contact_email": venue.contact_email,
            "created_at": venue.created_at.isoformat() if venue.created_at else None,
            "updated_at": venue.updated_at.isoformat() if venue.updated_at else None,
            "locations": [
                {
                    "location_id": str(loc.location_id),
                    "venue_id": str(loc.venue_id),
                    "name": loc.name,
                    "location_type": loc.location_type,
                    "type": loc.location_type,  # Frontend compatibility alias
                    "description": loc.description,
                    "latitude": loc.latitude,
                    "longitude": loc.longitude,
                    "floor": loc.floor,
                    "created_at": loc.created_at.isoformat() if loc.created_at else None,
                    "updated_at": loc.updated_at.isoformat() if loc.updated_at else None,
                }
                for loc in venue.locations
            ],
            "attributes": [
                {
                    "attribute_id": str(attr.attribute_id),
                    "venue_id": str(attr.venue_id),
                    "location_id": str(attr.location_id) if attr.location_id else None,
                    "category": attr.category,
                    "attribute_name": attr.attribute_name,
                    "value": attr.value.value if hasattr(attr.value, 'value') else attr.value,
                    "value_type": attr.value_type,
                    "value_text": attr.value_text,
                    "notes": attr.notes,
                    "last_observed_at": attr.last_observed_at.isoformat() if attr.last_observed_at else None,
                    "location": {
                        "location_id": str(attr.location.location_id),
                        "venue_id": str(attr.location.venue_id),
                        "name": attr.location.name,
                        "location_type": attr.location.location_type,
                        "type": attr.location.location_type,  # Frontend compatibility alias
                        "description": attr.location.description,
                        "latitude": attr.location.latitude,
                        "longitude": attr.location.longitude,
                        "floor": attr.location.floor,
                        "created_at": attr.location.created_at.isoformat() if attr.location.created_at else None,
                        "updated_at": attr.location.updated_at.isoformat() if attr.location.updated_at else None,
                    } if attr.location else None,
                    "evidence": [
                        {
                            "evidence_id": str(ev.evidence_id),
                            "attribute_id": str(ev.attribute_id),
                            "source_id": str(ev.source_id) if ev.source_id else None,
                            "evidence_text": ev.evidence_text,
                            "evidence_media_url": ev.evidence_media_url,
                            "observed_at": ev.observed_at.isoformat() if ev.observed_at else None,
                            "collected_at": ev.collected_at.isoformat() if ev.collected_at else None,
                            "collector": ev.collector,
                            "verification_status": ev.verification_status.value if hasattr(ev.verification_status, 'value') else ev.verification_status,
                            "confidence": ev.confidence,
                            "notes": ev.notes,
                            "source": {
                                "source_id": str(ev.source.source_id),
                                "source_type": ev.source.source_type.value if hasattr(ev.source.source_type, 'value') else ev.source.source_type,
                                "source_name": ev.source.source_name,
                                "source_url": ev.source.source_url,
                                "source_reference": ev.source.source_reference,
                            } if ev.source else None,
                        }
                        for ev in attr.evidence
                    ],
                    "created_at": attr.created_at.isoformat() if attr.created_at else None,
                    "updated_at": attr.updated_at.isoformat() if attr.updated_at else None,
                }
                for attr in venue.attributes
            ]
        }
        
        return result
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "NOT_FOUND", "message": e.message})


@router.post("", response_model=VenueResponse, status_code=status.HTTP_201_CREATED)
def create_venue(
    venue_data: VenueCreate,
    service: VenueService = Depends(get_venue_service)
):
    """Create a new venue."""
    return service.create_venue(venue_data)


@router.patch("/{venue_id}", response_model=VenueResponse)
def update_venue(
    venue_id: str,
    venue_data: VenueUpdate,
    service: VenueService = Depends(get_venue_service)
):
    """Update a venue."""
    try:
        return service.update_venue(venue_id, venue_data)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "NOT_FOUND", "message": e.message})


@router.delete("/{venue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_venue(
    venue_id: str,
    service: VenueService = Depends(get_venue_service)
):
    """Delete a venue."""
    try:
        service.delete_venue(venue_id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": "NOT_FOUND", "message": e.message})
