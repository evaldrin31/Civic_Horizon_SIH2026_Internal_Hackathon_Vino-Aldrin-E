"""Database models for the Accessibility Intelligence Platform."""

import uuid
from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import (
    Column, String, Text, DateTime, ForeignKey, Enum, Float, Index, Integer
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class VerificationStatus(str, PyEnum):
    """Evidence verification states.
    
    UNVERIFIED: Initial state, not yet assessed
    REPORTED: Claim made but not independently verified
    CORROBORATED: Multiple sources agree
    VERIFIED: Confirmed by authoritative source or audit
    CONFLICTING: Different sources disagree
    OUTDATED: Previously verified but may no longer be accurate
    """
    UNVERIFIED = "unverified"
    REPORTED = "reported"
    CORROBORATED = "corroborated"
    VERIFIED = "verified"
    CONFLICTING = "conflicting"
    OUTDATED = "outdated"


class SourceType(str, PyEnum):
    """Hierarchy of evidence sources.
    
    Lower numbers indicate higher trustworthiness.
    """
    GOVERNMENT = "government"  # 1. Government/regulatory source
    PROFESSIONAL_AUDIT = "professional_audit"  # 2. Professional accessibility audit
    OFFICIAL_VENUE = "official_venue"  # 3. Official venue/institution source
    DIRECT_OBSERVATION = "direct_observation"  # 4. Direct on-site measurement/photo
    INSTITUTIONAL_DATASET = "institutional_dataset"  # 5. Trusted institutional dataset
    COMMUNITY_OBSERVATION = "community_observation"  # 6. Community observation
    PUBLIC_REVIEW = "public_review"  # 7. Public review
    AI_INFERENCE = "ai_inference"  # 8. AI inference (lowest)


class AttributeValue(str, PyEnum):
    """Standard values for accessibility attributes."""
    YES = "yes"
    NO = "no"
    UNKNOWN = "unknown"
    PARTIAL = "partial"


class Venue(Base):
    """A venue (building, facility, or place)."""
    
    __tablename__ = "venues"
    
    venue_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    
    # Address
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    country = Column(String(100), nullable=False, default="India")
    postal_code = Column(String(20), nullable=True)
    
    # Coordinates (WGS84)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Contact
    official_url = Column(String(500), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    contact_email = Column(String(255), nullable=True)
    
    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    locations = relationship("VenueLocation", back_populates="venue", cascade="all, delete-orphan")
    attributes = relationship("AccessibilityAttribute", back_populates="venue", cascade="all, delete-orphan")
    
    # Composite index for geospatial queries
    __table_args__ = (
        Index('idx_venue_location', 'latitude', 'longitude'),
        Index('idx_venue_category_city', 'category', 'city'),
    )


class VenueLocation(Base):
    """A specific location within a venue (entrance, area, etc.)."""
    
    __tablename__ = "venue_locations"
    
    location_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    venue_id = Column(UUID(as_uuid=True), ForeignKey("venues.venue_id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = Column(String(255), nullable=False)  # e.g., "Main entrance", "Accessible toilet"
    location_type = Column(String(100), nullable=False)  # e.g., "entrance", "toilet", "parking"
    description = Column(Text, nullable=True)
    
    # Optional coordinates for this specific location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Floor information
    floor = Column(String(50), nullable=True)
    
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    venue = relationship("Venue", back_populates="locations")
    attributes = relationship("AccessibilityAttribute", back_populates="location")


class AccessibilityAttribute(Base):
    """A specific accessibility attribute about a venue or location."""
    
    __tablename__ = "accessibility_attributes"
    
    attribute_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    venue_id = Column(UUID(as_uuid=True), ForeignKey("venues.venue_id", ondelete="CASCADE"), nullable=False, index=True)
    location_id = Column(UUID(as_uuid=True), ForeignKey("venue_locations.location_id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Attribute classification
    category = Column(String(100), nullable=False, index=True)  # mobility, visual, hearing, general
    attribute_name = Column(String(100), nullable=False, index=True)  # e.g., "ramp", "elevator"
    
    # Value
    value = Column(Enum(AttributeValue), nullable=False, default=AttributeValue.UNKNOWN)
    value_type = Column(String(50), nullable=True)  # e.g., "boolean", "measurement", "text"
    value_text = Column(Text, nullable=True)  # Additional text value if needed
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Timestamps
    last_observed_at = Column(DateTime, nullable=True)  # When was this last observed
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    venue = relationship("Venue", back_populates="attributes")
    location = relationship("VenueLocation", back_populates="attributes")
    evidence = relationship("Evidence", back_populates="attribute", cascade="all, delete-orphan")
    
    # Composite index for common queries
    __table_args__ = (
        Index('idx_attr_venue_category', 'venue_id', 'category'),
        Index('idx_attr_name_value', 'attribute_name', 'value'),
    )


class Source(Base):
    """A source of accessibility information."""
    
    __tablename__ = "sources"
    
    source_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Source classification
    source_type = Column(Enum(SourceType), nullable=False, index=True)
    source_name = Column(String(255), nullable=False)
    
    # Reference information
    source_url = Column(String(500), nullable=True)
    source_reference = Column(String(500), nullable=True)  # ID or reference within source
    
    # Contact/attribution
    contact_info = Column(Text, nullable=True)
    license_info = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    evidence = relationship("Evidence", back_populates="source")


class Evidence(Base):
    """Evidence supporting an accessibility attribute claim."""
    
    __tablename__ = "evidence"
    
    evidence_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attribute_id = Column(UUID(as_uuid=True), ForeignKey("accessibility_attributes.attribute_id", ondelete="CASCADE"), nullable=False, index=True)
    source_id = Column(UUID(as_uuid=True), ForeignKey("sources.source_id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Evidence content
    evidence_text = Column(Text, nullable=True)  # Textual description of evidence
    evidence_media_url = Column(String(500), nullable=True)  # Photo/video reference
    evidence_media_hash = Column(String(64), nullable=True)  # For deduplication
    
    # Temporal information
    observed_at = Column(DateTime, nullable=True)  # When the observation was made
    collected_at = Column(DateTime, nullable=False, default=datetime.utcnow)  # When we received it
    
    # Attribution
    collector = Column(String(255), nullable=True)  # Who collected this
    
    # Verification
    verification_status = Column(Enum(VerificationStatus), nullable=False, default=VerificationStatus.UNVERIFIED, index=True)
    confidence = Column(Float, nullable=True)  # 0.0 to 1.0, computed or manually set
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    attribute = relationship("AccessibilityAttribute", back_populates="evidence")
    source = relationship("Source", back_populates="evidence")
    
    # Composite indexes
    __table_args__ = (
        Index('idx_evidence_status_observed', 'verification_status', 'observed_at'),
        Index('idx_evidence_source_collected', 'source_id', 'collected_at'),
    )


class VerificationHistory(Base):
    """History of verification state changes."""
    
    __tablename__ = "verification_history"
    
    history_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evidence_id = Column(UUID(as_uuid=True), ForeignKey("evidence.evidence_id", ondelete="CASCADE"), nullable=False, index=True)
    
    # State change
    previous_status = Column(Enum(VerificationStatus), nullable=True)
    new_status = Column(Enum(VerificationStatus), nullable=False)
    
    # Reason for change
    change_reason = Column(Text, nullable=True)
    changed_by = Column(String(255), nullable=True)  # User or system identifier
    
    # Timestamp
    changed_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    evidence = relationship("Evidence")
