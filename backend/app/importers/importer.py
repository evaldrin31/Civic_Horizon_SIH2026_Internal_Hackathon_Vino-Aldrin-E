"""Data import utilities for structured accessibility records.

Supports importing records from Claude's research in the format:
{
    "venue": {...},
    "location": {...},  # optional
    "attribute": {...},
    "evidence": [...]
}

Design decisions:
- Validates all data before any database writes
- Uses transactions to ensure atomic imports
- Preserves provenance and sources
- Never converts UNKNOWN to NO
- Deduplicates based on venue name + address + city
- Produces detailed import error reports
"""

from typing import List, Optional, Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import ImportException, ValidationException
from app.core.logging import get_logger
from app.models.models import (
    Venue, VenueLocation, AccessibilityAttribute, Evidence, Source,
    AttributeValue, VerificationStatus, SourceType
)
from app.schemas.schemas import VenueCreate, VenueLocationCreate, SourceCreate
from app.services.venue_service import VenueService
from app.services.accessibility_service import AccessibilityService
from app.services.evidence_service import EvidenceService
from app.services.source_service import SourceService

logger = get_logger(__name__)


class DataImporter:
    """Import structured accessibility records into the database."""
    
    def __init__(self, db: Session):
        self.db = db
        self.venue_service = VenueService(db)
        self.accessibility_service = AccessibilityService(db)
        self.evidence_service = EvidenceService(db)
        self.source_service = SourceService(db)
        
        # Track import statistics
        self.stats = {
            "venues_created": 0,
            "venues_matched": 0,
            "locations_created": 0,
            "attributes_created": 0,
            "evidence_created": 0,
            "sources_created": 0,
            "errors": []
        }
    
    def _validate_record(self, record: dict, index: int) -> None:
        """Validate a record before import."""
        if not isinstance(record, dict):
            raise ImportException("Record must be an object", index)
        
        # Validate venue data
        venue_data = record.get("venue")
        if not venue_data:
            raise ImportException("Record must contain 'venue' object", index)
        
        required_venue_fields = ["name", "category", "city", "state", "latitude", "longitude"]
        for field in required_venue_fields:
            if field not in venue_data or venue_data[field] is None:
                raise ImportException(f"Venue missing required field: {field}", index)
        
        # Validate attribute data if present
        attr_data = record.get("attribute")
        if attr_data:
            if "attribute_name" not in attr_data:
                raise ImportException("Attribute missing 'attribute_name'", index)
            if "value" in attr_data:
                value = attr_data["value"]
                valid_values = ["yes", "no", "unknown", "partial"]
                if value not in valid_values:
                    raise ImportException(f"Invalid attribute value '{value}'. Must be one of: {valid_values}", index)
        
        # Validate evidence data if present
        evidence_list = record.get("evidence", [])
        if not isinstance(evidence_list, list):
            raise ImportException("'evidence' must be a list", index)
    
    def _find_existing_venue(self, venue_data: dict) -> Optional[Venue]:
        """Try to find an existing venue by name + city + state."""
        name = venue_data.get("name", "").strip().lower()
        city = venue_data.get("city", "").strip().lower()
        state = venue_data.get("state", "").strip().lower()
        
        # Query for potential matches
        candidates = self.db.query(Venue).filter(
            Venue.name.ilike(f"%{name}%"),
            Venue.city.ilike(city),
            Venue.state.ilike(state)
        ).all()
        
        # Check address similarity if available
        address = venue_data.get("address", "").strip().lower()
        if address and candidates:
            for candidate in candidates:
                if candidate.address and address in candidate.address.lower():
                    return candidate
        
        # Return first match if no address match
        return candidates[0] if candidates else None
    
    def _get_or_create_source(self, source_data: Optional[dict]) -> Optional[Source]:
        """Get or create a source."""
        if not source_data:
            return None
        
        # Check if source exists by name
        source_name = source_data.get("source_name")
        if source_name:
            existing = self.source_service.get_source_by_name(source_name)
            if existing:
                return existing
        
        # Create new source
        try:
            create_data = SourceCreate(**source_data)
            source = self.source_service.create_source(create_data)
            self.stats["sources_created"] += 1
            return source
        except Exception as e:
            logger.warning(f"Failed to create source: {e}")
            return None
    
    def import_record(self, record: dict, index: int = 0) -> dict:
        """Import a single structured record.
        
        Returns:
            dict with import result including venue_id and any errors
        """
        result = {
            "index": index,
            "success": False,
            "venue_id": None,
            "venue_created": False,
            "errors": []
        }
        
        try:
            # Validate
            self._validate_record(record, index)
            
            # Extract data
            venue_data = record["venue"]
            location_data = record.get("location")
            attr_data = record.get("attribute")
            evidence_list = record.get("evidence", [])
            
            # Check for existing venue
            existing_venue = self._find_existing_venue(venue_data)
            
            if existing_venue:
                venue = existing_venue
                self.stats["venues_matched"] += 1
                result["venue_created"] = False
            else:
                # Create new venue
                venue_create = VenueCreate(**venue_data)
                venue = self.venue_service.create_venue(venue_create)
                self.stats["venues_created"] += 1
                result["venue_created"] = True
            
            result["venue_id"] = str(venue.venue_id)
            
            # Create location if specified
            location_id = None
            if location_data:
                location = VenueLocation(
                    venue_id=venue.venue_id,
                    **location_data
                )
                self.db.add(location)
                self.db.flush()
                location_id = location.location_id
                self.stats["locations_created"] += 1
            
            # Create attribute if specified
            attribute_id = None
            if attr_data:
                # Validate value doesn't convert UNKNOWN to NO
                value = attr_data.get("value", "unknown")
                if value == "unknown" and attr_data.get("evidence"):
                    # If there's evidence but value is unknown, this is a data quality issue
                    pass  # Allow it, but note in logs
                
                attr = AccessibilityAttribute(
                    venue_id=venue.venue_id,
                    location_id=location_id,
                    category=attr_data.get("category", "general"),
                    attribute_name=attr_data["attribute_name"],
                    value=AttributeValue(value),
                    value_type=attr_data.get("value_type"),
                    value_text=attr_data.get("value_text"),
                    notes=attr_data.get("notes"),
                    last_observed_at=None  # Will be set from evidence
                )
                self.db.add(attr)
                self.db.flush()
                attribute_id = attr.attribute_id
                self.stats["attributes_created"] += 1
            
            # Create evidence
            for ev_data in evidence_list:
                # Handle source
                source_id = None
                if "source" in ev_data:
                    source = self._get_or_create_source(ev_data["source"])
                    if source:
                        source_id = source.source_id
                    del ev_data["source"]  # Remove nested source data
                elif "source_id" in ev_data:
                    source_id = ev_data["source_id"]
                
                # Create evidence
                ev = Evidence(
                    attribute_id=attribute_id,
                    source_id=source_id,
                    evidence_text=ev_data.get("evidence_text"),
                    evidence_media_url=ev_data.get("evidence_media_url"),
                    evidence_media_hash=ev_data.get("evidence_media_hash"),
                    observed_at=ev_data.get("observed_at"),
                    collector=ev_data.get("collector"),
                    verification_status=VerificationStatus(
                        ev_data.get("verification_status", "unverified")
                    ),
                    confidence=ev_data.get("confidence"),
                    notes=ev_data.get("notes")
                )
                self.db.add(ev)
                self.stats["evidence_created"] += 1
                
                # Update attribute's last_observed_at
                if ev.observed_at and attribute_id:
                    attr = self.db.query(AccessibilityAttribute).filter(
                        AccessibilityAttribute.attribute_id == attribute_id
                    ).first()
                    if attr:
                        if not attr.last_observed_at or ev.observed_at > attr.last_observed_at:
                            attr.last_observed_at = ev.observed_at
            
            self.db.commit()
            result["success"] = True
            
        except ImportException as e:
            self.db.rollback()
            result["errors"].append(e.message)
            self.stats["errors"].append({"index": index, "error": e.message})
            logger.error(f"Import error at index {index}: {e.message}")
        except Exception as e:
            self.db.rollback()
            error_msg = str(e)
            result["errors"].append(error_msg)
            self.stats["errors"].append({"index": index, "error": error_msg})
            logger.error(f"Unexpected import error at index {index}: {e}")
        
        return result
    
    def import_records(self, records: List[dict]) -> dict:
        """Import multiple records and return aggregate results."""
        results = []
        
        for i, record in enumerate(records):
            result = self.import_record(record, i)
            results.append(result)
        
        return {
            "total": len(records),
            "successful": sum(1 for r in results if r["success"]),
            "failed": sum(1 for r in results if not r["success"]),
            "stats": self.stats,
            "results": results
        }
    
    def reset_stats(self) -> None:
        """Reset import statistics."""
        self.stats = {
            "venues_created": 0,
            "venues_matched": 0,
            "locations_created": 0,
            "attributes_created": 0,
            "evidence_created": 0,
            "sources_created": 0,
            "errors": []
        }
