"""Accessibility attribute service layer."""

from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import NotFoundException
from app.models.models import (
    AccessibilityAttribute, AttributeValue, Venue, VenueLocation
)
from app.schemas.schemas import AccessibilityAttributeCreate, AccessibilityAttributeUpdate


class AccessibilityService:
    """Service for accessibility attribute operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_attribute(self, attribute_id: UUID) -> AccessibilityAttribute:
        """Get an attribute by ID with related data."""
        attr = (
            self.db.query(AccessibilityAttribute)
            .options(
                joinedload(AccessibilityAttribute.venue),
                joinedload(AccessibilityAttribute.location),
                joinedload(AccessibilityAttribute.evidence)
            )
            .filter(AccessibilityAttribute.attribute_id == attribute_id)
            .first()
        )
        if not attr:
            raise NotFoundException("AccessibilityAttribute", str(attribute_id))
        return attr
    
    def get_venue_attributes(
        self,
        venue_id: UUID,
        category: Optional[str] = None,
        attribute_name: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[AccessibilityAttribute], int]:
        """Get attributes for a venue."""
        # Verify venue exists
        venue = self.db.query(Venue).filter(Venue.venue_id == venue_id).first()
        if not venue:
            raise NotFoundException("Venue", str(venue_id))
        
        query = (
            self.db.query(AccessibilityAttribute)
            .options(
                joinedload(AccessibilityAttribute.location),
                joinedload(AccessibilityAttribute.evidence)
            )
            .filter(AccessibilityAttribute.venue_id == venue_id)
        )
        
        if category:
            query = query.filter(AccessibilityAttribute.category == category)
        if attribute_name:
            query = query.filter(AccessibilityAttribute.attribute_name == attribute_name)
        
        total = query.count()
        attributes = query.order_by(
            AccessibilityAttribute.category,
            AccessibilityAttribute.attribute_name
        ).offset(skip).limit(limit).all()
        
        return attributes, total
    
    def get_location_attributes(
        self,
        location_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[AccessibilityAttribute], int]:
        """Get attributes for a specific location."""
        # Verify location exists
        location = self.db.query(VenueLocation).filter(VenueLocation.location_id == location_id).first()
        if not location:
            raise NotFoundException("VenueLocation", str(location_id))
        
        query = (
            self.db.query(AccessibilityAttribute)
            .options(joinedload(AccessibilityAttribute.evidence))
            .filter(AccessibilityAttribute.location_id == location_id)
        )
        
        total = query.count()
        attributes = query.order_by(
            AccessibilityAttribute.category,
            AccessibilityAttribute.attribute_name
        ).offset(skip).limit(limit).all()
        
        return attributes, total
    
    def create_attribute(
        self,
        attr_data: AccessibilityAttributeCreate
    ) -> AccessibilityAttribute:
        """Create a new accessibility attribute."""
        # Validate venue exists
        venue = self.db.query(Venue).filter(Venue.venue_id == attr_data.venue_id).first()
        if not venue:
            raise NotFoundException("Venue", str(attr_data.venue_id))
        
        # Validate location if provided
        if attr_data.location_id:
            location = self.db.query(VenueLocation).filter(
                VenueLocation.location_id == attr_data.location_id,
                VenueLocation.venue_id == attr_data.venue_id
            ).first()
            if not location:
                raise NotFoundException(
                    "VenueLocation",
                    f"{attr_data.location_id} (must belong to the venue)"
                )
        
        attr = AccessibilityAttribute(**attr_data.model_dump())
        self.db.add(attr)
        self.db.commit()
        self.db.refresh(attr)
        return attr
    
    def update_attribute(
        self,
        attribute_id: UUID,
        attr_data: AccessibilityAttributeUpdate
    ) -> AccessibilityAttribute:
        """Update an accessibility attribute."""
        attr = self.get_attribute(attribute_id)
        
        update_data = attr_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(attr, field, value)
        
        self.db.commit()
        self.db.refresh(attr)
        return attr
    
    def delete_attribute(self, attribute_id: UUID) -> None:
        """Delete an accessibility attribute."""
        attr = self.get_attribute(attribute_id)
        self.db.delete(attr)
        self.db.commit()
    
    def get_attribute_summary(self, venue_id: UUID) -> dict:
        """Get a summary of accessibility attributes for a venue."""
        attributes, _ = self.get_venue_attributes(venue_id, limit=1000)
        
        summary = {
            "total_attributes": len(attributes),
            "by_category": {},
            "by_value": {},
            "with_evidence": 0,
            "without_evidence": 0
        }
        
        for attr in attributes:
            # Category counts
            cat = attr.category
            if cat not in summary["by_category"]:
                summary["by_category"][cat] = {"total": 0, "yes": 0, "no": 0, "unknown": 0, "partial": 0}
            summary["by_category"][cat]["total"] += 1
            summary["by_category"][cat][attr.value.value] += 1
            
            # Value counts
            val = attr.value.value
            summary["by_value"][val] = summary["by_value"].get(val, 0) + 1
            
            # Evidence counts
            if attr.evidence and len(attr.evidence) > 0:
                summary["with_evidence"] += 1
            else:
                summary["without_evidence"] += 1
        
        return summary
