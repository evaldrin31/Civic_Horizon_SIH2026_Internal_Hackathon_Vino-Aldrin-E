"""Venue service layer."""

from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import NotFoundException, ValidationException
from app.models.models import Venue, VenueLocation, AccessibilityAttribute
from app.schemas.schemas import VenueCreate, VenueUpdate


class VenueService:
    """Service for venue operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_venue(self, venue_id: str) -> Venue:
        """Get a venue by ID."""
        venue = self.db.query(Venue).filter(Venue.venue_id == venue_id).first()
        if not venue:
            raise NotFoundException("Venue", str(venue_id))
        return venue
    
    def get_venue_with_details(self, venue_id: str) -> Venue:
        """Get a venue with all related data."""
        from app.models.models import Evidence, Source
        venue = (
            self.db.query(Venue)
            .options(
                joinedload(Venue.locations),
                joinedload(Venue.attributes).joinedload(AccessibilityAttribute.location),
                joinedload(Venue.attributes).joinedload(AccessibilityAttribute.evidence).joinedload(Evidence.source)
            )
            .filter(Venue.venue_id == venue_id)
            .first()
        )
        if not venue:
            raise NotFoundException("Venue", str(venue_id))
        return venue
    
    def list_venues(
        self,
        skip: int = 0,
        limit: int = 20,
        category: Optional[str] = None,
        city: Optional[str] = None,
        state: Optional[str] = None
    ) -> tuple[List[Venue], int]:
        """List venues with optional filters."""
        query = self.db.query(Venue)
        
        if category:
            query = query.filter(Venue.category.ilike(f"%{category}%"))
        if city:
            query = query.filter(Venue.city.ilike(f"%{city}%"))
        if state:
            query = query.filter(Venue.state.ilike(f"%{state}%"))
        
        total = query.count()
        venues = query.order_by(Venue.name).offset(skip).limit(limit).all()
        
        return venues, total
    
    def search_venues(
        self,
        query_str: Optional[str] = None,
        category: Optional[str] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        has_accessible_entrance: Optional[bool] = None,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[Venue], int]:
        """Search venues by name and filters."""
        from app.models.models import AttributeValue
        
        query = self.db.query(Venue)
        
        if query_str:
            query = query.filter(Venue.name.ilike(f"%{query_str}%"))
        if category:
            query = query.filter(Venue.category.ilike(f"%{category}%"))
        if city:
            query = query.filter(Venue.city.ilike(f"%{city}%"))
        if state:
            query = query.filter(Venue.state.ilike(f"%{state}%"))
        
        # Filter for accessible entrance based on actual location/entrance data
        if has_accessible_entrance is not None:
            if has_accessible_entrance:
                # Venue must have at least one entrance location with step_free_entrance = yes/partial
                query = query.join(VenueLocation).join(
                    AccessibilityAttribute,
                    (AccessibilityAttribute.venue_id == Venue.venue_id) & 
                    (AccessibilityAttribute.location_id == VenueLocation.location_id)
                ).filter(
                    VenueLocation.location_type == "entrance",
                    AccessibilityAttribute.attribute_name == "step_free_entrance",
                    AccessibilityAttribute.value.in_([AttributeValue.YES, AttributeValue.PARTIAL])
                ).distinct()
            else:
                # Venue does NOT have accessible entrance (explicit NO or only UNKNOWN)
                # This is more complex - we'd need to find venues where step_free_entrance is NO
                # or where there's no evidence of accessible entrance
                # For MVP, we'll filter for explicit NO
                query = query.join(VenueLocation).join(
                    AccessibilityAttribute,
                    (AccessibilityAttribute.venue_id == Venue.venue_id) & 
                    (AccessibilityAttribute.location_id == VenueLocation.location_id)
                ).filter(
                    VenueLocation.location_type == "entrance",
                    AccessibilityAttribute.attribute_name == "step_free_entrance",
                    AccessibilityAttribute.value == AttributeValue.NO
                ).distinct()
        
        total = query.count()
        venues = query.order_by(Venue.name).offset(skip).limit(limit).all()
        
        return venues, total
    
    def get_nearby_venues(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 5.0,
        category: Optional[str] = None,
        has_accessible_entrance: Optional[bool] = None,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[Venue], int]:
        """Get venues near a location using approximate distance calculation.
        
        Uses simple Haversine approximation. For production, consider PostGIS.
        """
        from app.models.models import AttributeValue
        
        # Approximate degrees per km at equator
        # 1 degree latitude = ~111 km
        # 1 degree longitude varies by latitude (~111 km at equator, 0 at poles)
        lat_delta = radius_km / 111.0
        lon_delta = radius_km / (111.0 * max(abs(__import__('math').cos(__import__('math').radians(latitude))), 1e-9))
        
        query = self.db.query(Venue).filter(
            Venue.latitude.between(latitude - lat_delta, latitude + lat_delta),
            Venue.longitude.between(longitude - lon_delta, longitude + lon_delta)
        )
        
        if category:
            query = query.filter(Venue.category.ilike(f"%{category}%"))
        
        # Filter for accessible entrance based on actual location/entrance data
        if has_accessible_entrance is not None:
            if has_accessible_entrance:
                # Venue must have at least one entrance location with step_free_entrance = yes/partial
                query = query.join(VenueLocation).join(
                    AccessibilityAttribute,
                    (AccessibilityAttribute.venue_id == Venue.venue_id) & 
                    (AccessibilityAttribute.location_id == VenueLocation.location_id)
                ).filter(
                    VenueLocation.location_type == "entrance",
                    AccessibilityAttribute.attribute_name == "step_free_entrance",
                    AccessibilityAttribute.value.in_([AttributeValue.YES, AttributeValue.PARTIAL])
                ).distinct()
            else:
                # Venue does NOT have accessible entrance (explicit NO)
                query = query.join(VenueLocation).join(
                    AccessibilityAttribute,
                    (AccessibilityAttribute.venue_id == Venue.venue_id) & 
                    (AccessibilityAttribute.location_id == VenueLocation.location_id)
                ).filter(
                    VenueLocation.location_type == "entrance",
                    AccessibilityAttribute.attribute_name == "step_free_entrance",
                    AccessibilityAttribute.value == AttributeValue.NO
                ).distinct()
        
        total = query.count()
        venues = query.order_by(Venue.name).offset(skip).limit(limit).all()
        
        return venues, total
    
    def create_venue(self, venue_data: VenueCreate) -> Venue:
        """Create a new venue."""
        venue = Venue(**venue_data.model_dump())
        self.db.add(venue)
        self.db.commit()
        self.db.refresh(venue)
        return venue
    
    def update_venue(self, venue_id: str, venue_data: VenueUpdate) -> Venue:
        """Update an existing venue."""
        venue = self.get_venue(venue_id)
        
        update_data = venue_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(venue, field, value)
        
        self.db.commit()
        self.db.refresh(venue)
        return venue
    
    def delete_venue(self, venue_id: str) -> None:
        """Delete a venue."""
        venue = self.get_venue(venue_id)
        self.db.delete(venue)
        self.db.commit()
