"""Database models for the Accessibility Intelligence Platform."""

import uuid
from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import (
    Column, String, Text, DateTime, ForeignKey, Enum, Float, Index, Integer
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def uuid_default():
    """Generate a string UUID for cross-database compatibility."""
    return str(uuid.uuid4())


class VerificationStatus(str, PyEnum):
    """Evidence verification states."""
    UNVERIFIED = "unverified"
    REPORTED = "reported"
    CORROBORATED = "corroborated"
    VERIFIED = "verified"
    CONFLICTING = "conflicting"
    OUTDATED = "outdated"


class SourceType(str, PyEnum):
    """Hierarchy of evidence sources."""
    GOVERNMENT = "government"
    PROFESSIONAL_AUDIT = "professional_audit"
    OFFICIAL_VENUE = "official_venue"
    DIRECT_OBSERVATION = "direct_observation"
    INSTITUTIONAL_DATASET = "institutional_dataset"
    COMMUNITY_OBSERVATION = "community_observation"
    PUBLIC_REVIEW = "public_review"
    AI_INFERENCE = "ai_inference"


class AttributeValue(str, PyEnum):
    """Standard values for accessibility attributes."""
    YES = "yes"
    NO = "no"
    UNKNOWN = "unknown"
    PARTIAL = "partial"


class Venue(Base):
    """A venue (building, facility, or place)."""
    
    __tablename__ = "venues"
    
    venue_id = Column(String(36), primary_key=True, default=uuid_default)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    country = Column(String(100), nullable=False, default="India")
    postal_code = Column(String(20), nullable=True)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    official_url = Column(String(500), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    contact_email = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    locations = relationship("VenueLocation", back_populates="venue", cascade="all, delete-orphan")
    attributes = relationship("AccessibilityAttribute", back_populates="venue", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_venue_location', 'latitude', 'longitude'),
        Index('idx_venue_category_city', 'category', 'city'),
    )


class VenueLocation(Base):
    """A specific location within a venue."""
    
    __tablename__ = "venue_locations"
    
    location_id = Column(String(36), primary_key=True, default=uuid_default)
    venue_id = Column(String(36), ForeignKey("venues.venue_id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = Column(String(255), nullable=False)
    location_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    floor = Column(String(50), nullable=True)
    
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    venue = relationship("Venue", back_populates="locations")
    attributes = relationship("AccessibilityAttribute", back_populates="location")


class AccessibilityAttribute(Base):
    """A specific accessibility attribute about a venue or location."""
    
    __tablename__ = "accessibility_attributes"
    
    attribute_id = Column(String(36), primary_key=True, default=uuid_default)
    venue_id = Column(String(36), ForeignKey("venues.venue_id", ondelete="CASCADE"), nullable=False, index=True)
    location_id = Column(String(36), ForeignKey("venue_locations.location_id", ondelete="CASCADE"), nullable=True, index=True)
    
    category = Column(String(100), nullable=False, index=True)
    attribute_name = Column(String(100), nullable=False, index=True)
    
    value = Column(Enum(AttributeValue), nullable=False, default=AttributeValue.UNKNOWN)
    value_type = Column(String(50), nullable=True)
    value_text = Column(Text, nullable=True)
    
    notes = Column(Text, nullable=True)
    last_observed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    venue = relationship("Venue", back_populates="attributes")
    location = relationship("VenueLocation", back_populates="attributes")
    evidence = relationship("Evidence", back_populates="attribute", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_attr_venue_category', 'venue_id', 'category'),
        Index('idx_attr_name_value', 'attribute_name', 'value'),
    )


class Source(Base):
    """A source of accessibility information."""
    
    __tablename__ = "sources"
    
    source_id = Column(String(36), primary_key=True, default=uuid_default)
    
    source_type = Column(Enum(SourceType), nullable=False, index=True)
    source_name = Column(String(255), nullable=False)
    
    source_url = Column(String(500), nullable=True)
    source_reference = Column(String(500), nullable=True)
    
    contact_info = Column(Text, nullable=True)
    license_info = Column(Text, nullable=True)
    
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    evidence = relationship("Evidence", back_populates="source")


class Evidence(Base):
    """Evidence supporting an accessibility attribute claim."""
    
    __tablename__ = "evidence"
    
    evidence_id = Column(String(36), primary_key=True, default=uuid_default)
    attribute_id = Column(String(36), ForeignKey("accessibility_attributes.attribute_id", ondelete="CASCADE"), nullable=False, index=True)
    source_id = Column(String(36), ForeignKey("sources.source_id", ondelete="SET NULL"), nullable=True, index=True)
    
    evidence_text = Column(Text, nullable=True)
    evidence_media_url = Column(String(500), nullable=True)
    evidence_media_hash = Column(String(64), nullable=True)
    
    observed_at = Column(DateTime, nullable=True)
    collected_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    collector = Column(String(255), nullable=True)
    
    verification_status = Column(Enum(VerificationStatus), nullable=False, default=VerificationStatus.UNVERIFIED, index=True)
    confidence = Column(Float, nullable=True)
    
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    attribute = relationship("AccessibilityAttribute", back_populates="evidence")
    source = relationship("Source", back_populates="evidence")
    
    __table_args__ = (
        Index('idx_evidence_status_observed', 'verification_status', 'observed_at'),
        Index('idx_evidence_source_collected', 'source_id', 'collected_at'),
    )


class VerificationHistory(Base):
    """History of verification state changes."""
    
    __tablename__ = "verification_history"
    
    history_id = Column(String(36), primary_key=True, default=uuid_default)
    evidence_id = Column(String(36), ForeignKey("evidence.evidence_id", ondelete="CASCADE"), nullable=False, index=True)
    
    previous_status = Column(Enum(VerificationStatus), nullable=True)
    new_status = Column(Enum(VerificationStatus), nullable=False)
    
    change_reason = Column(Text, nullable=True)
    changed_by = Column(String(255), nullable=True)
    
    changed_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    evidence = relationship("Evidence")
