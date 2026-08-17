"""Pydantic schemas for API request/response validation."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ============ Base Schemas ============

class BaseSchema(BaseModel):
    """Base schema with common configuration."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class PaginationParams(BaseSchema):
    """Pagination parameters."""
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(default=20, ge=1, le=100, description="Number of items per page")


class PaginatedResponse(BaseSchema):
    """Paginated response wrapper."""
    total: int = Field(description="Total number of items")
    page: int = Field(description="Current page number")
    page_size: int = Field(description="Items per page")
    pages: int = Field(description="Total number of pages")


# ============ Venue Schemas ============

class VenueBase(BaseSchema):
    """Base venue schema."""
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    address: Optional[str] = None
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    country: str = Field(default="India", max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    official_url: Optional[str] = Field(None, max_length=500)
    contact_phone: Optional[str] = Field(None, max_length=50)
    contact_email: Optional[str] = Field(None, max_length=255)


class VenueCreate(VenueBase):
    """Schema for creating a venue."""
    pass


class VenueUpdate(BaseSchema):
    """Schema for updating a venue."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    address: Optional[str] = None
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    state: Optional[str] = Field(None, min_length=1, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    official_url: Optional[str] = Field(None, max_length=500)
    contact_phone: Optional[str] = Field(None, max_length=50)
    contact_email: Optional[str] = Field(None, max_length=255)


class VenueResponse(VenueBase):
    """Schema for venue response."""
    venue_id: str
    created_at: datetime
    updated_at: datetime


class VenueListResponse(PaginatedResponse):
    """Paginated venue list response."""
    items: List[VenueResponse]


# Note: VenueDetailResponse is defined at end of file after all related schemas


# ============ Venue Location Schemas ============

class VenueLocationBase(BaseSchema):
    """Base venue location schema."""
    name: str = Field(..., min_length=1, max_length=255)
    location_type: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    floor: Optional[str] = Field(None, max_length=50)


class VenueLocationCreate(VenueLocationBase):
    """Schema for creating a venue location."""
    venue_id: UUID


class VenueLocationResponse(VenueLocationBase):
    """Schema for venue location response."""
    location_id: str
    venue_id: str
    created_at: datetime
    updated_at: datetime


# ============ Accessibility Attribute Schemas ============

class AttributeValue(str):
    """Standard attribute values."""
    YES = "yes"
    NO = "no"
    UNKNOWN = "unknown"
    PARTIAL = "partial"


class AccessibilityAttributeBase(BaseSchema):
    """Base accessibility attribute schema."""
    category: str = Field(..., min_length=1, max_length=100)
    attribute_name: str = Field(..., min_length=1, max_length=100)
    value: str = Field(default="unknown", pattern="^(yes|no|unknown|partial)$")
    value_type: Optional[str] = Field(None, max_length=50)
    value_text: Optional[str] = None
    notes: Optional[str] = None
    last_observed_at: Optional[datetime] = None


class AccessibilityAttributeCreate(AccessibilityAttributeBase):
    """Schema for creating an accessibility attribute."""
    venue_id: str
    location_id: Optional[str] = None


class AccessibilityAttributeResponse(AccessibilityAttributeBase):
    """Schema for accessibility attribute response."""
    attribute_id: str
    venue_id: str
    location_id: Optional[str]
    location: Optional[VenueLocationResponse] = None
    created_at: datetime
    updated_at: datetime


class AccessibilityAttributeListResponse(PaginatedResponse):
    """Paginated accessibility attribute list response."""
    items: List[AccessibilityAttributeResponse]


# ============ Source Schemas ============

class SourceType(str):
    """Source type values."""
    GOVERNMENT = "government"
    PROFESSIONAL_AUDIT = "professional_audit"
    OFFICIAL_VENUE = "official_venue"
    DIRECT_OBSERVATION = "direct_observation"
    INSTITUTIONAL_DATASET = "institutional_dataset"
    COMMUNITY_OBSERVATION = "community_observation"
    PUBLIC_REVIEW = "public_review"
    AI_INFERENCE = "ai_inference"


class SourceBase(BaseSchema):
    """Base source schema."""
    source_type: str = Field(..., pattern="^(government|professional_audit|official_venue|direct_observation|institutional_dataset|community_observation|public_review|ai_inference)$")
    source_name: str = Field(..., min_length=1, max_length=255)
    source_url: Optional[str] = Field(None, max_length=500)
    source_reference: Optional[str] = Field(None, max_length=500)
    contact_info: Optional[str] = None
    license_info: Optional[str] = None


class SourceCreate(SourceBase):
    """Schema for creating a source."""
    pass


class SourceResponse(SourceBase):
    """Schema for source response."""
    source_id: str
    created_at: datetime
    updated_at: datetime


# ============ Evidence Schemas ============

class VerificationStatus(str):
    """Verification status values."""
    UNVERIFIED = "unverified"
    REPORTED = "reported"
    CORROBORATED = "corroborated"
    VERIFIED = "verified"
    CONFLICTING = "conflicting"
    OUTDATED = "outdated"


class EvidenceBase(BaseSchema):
    """Base evidence schema."""
    evidence_text: Optional[str] = None
    evidence_media_url: Optional[str] = Field(None, max_length=500)
    evidence_media_hash: Optional[str] = Field(None, max_length=64)
    observed_at: Optional[datetime] = None
    collector: Optional[str] = Field(None, max_length=255)
    verification_status: str = Field(default="unverified", pattern="^(unverified|reported|corroborated|verified|conflicting|outdated)$")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    notes: Optional[str] = None


class EvidenceCreate(EvidenceBase):
    """Schema for creating evidence."""
    attribute_id: str
    source_id: Optional[str] = None
    source: Optional[SourceCreate] = None


class EvidenceResponse(EvidenceBase):
    """Schema for evidence response."""
    evidence_id: str
    attribute_id: str
    source_id: Optional[str]
    source: Optional[SourceResponse] = None
    collected_at: datetime
    created_at: datetime
    updated_at: datetime


class EvidenceListResponse(PaginatedResponse):
    """Paginated evidence list response."""
    items: List[EvidenceResponse]


class EvidenceUpdate(BaseSchema):
    """Schema for updating evidence (mainly verification status)."""
    verification_status: Optional[str] = Field(None, pattern="^(unverified|reported|corroborated|verified|conflicting|outdated)$")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    notes: Optional[str] = None


class AccessibilityAttributeUpdate(BaseSchema):
    """Schema for updating an accessibility attribute."""
    value: Optional[str] = Field(None, pattern="^(yes|no|unknown|partial)$")
    value_type: Optional[str] = Field(None, max_length=50)
    value_text: Optional[str] = None
    notes: Optional[str] = None
    last_observed_at: Optional[datetime] = None


class VerificationHistoryResponse(BaseSchema):
    """Schema for verification history response."""
    history_id: str
    evidence_id: str
    previous_status: Optional[str]
    new_status: str
    change_reason: Optional[str]
    changed_by: Optional[str]
    changed_at: datetime


# ============ Search Schemas ============

class VenueSearchParams(BaseSchema):
    """Parameters for venue search."""
    query: Optional[str] = Field(None, description="Search query for venue name")
    category: Optional[str] = Field(None, description="Filter by category")
    city: Optional[str] = Field(None, description="Filter by city")
    state: Optional[str] = Field(None, description="Filter by state")
    has_accessible_entrance: Optional[bool] = Field(None, description="Filter for venues with accessible entrance")
    latitude: Optional[float] = Field(None, ge=-90, le=90, description="Latitude for nearby search")
    longitude: Optional[float] = Field(None, ge=-180, le=180, description="Longitude for nearby search")
    radius_km: Optional[float] = Field(None, ge=0.1, le=100, description="Search radius in kilometers")
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class NearbySearchParams(BaseSchema):
    """Parameters for nearby venue search."""
    latitude: float = Field(..., ge=-90, le=90, description="Center latitude")
    longitude: float = Field(..., ge=-180, le=180, description="Center longitude")
    radius_km: float = Field(default=5.0, ge=0.1, le=100, description="Search radius in kilometers")
    category: Optional[str] = Field(None, description="Filter by category")
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


# ============ Error Schemas ============

class ErrorResponse(BaseSchema):
    """Standard error response."""
    error: str
    code: str
    message: str
    details: Optional[dict] = None


# ============ Extended Response Schemas ============
# Defined here to avoid forward reference issues

class VenueDetailResponse(VenueResponse):
    """Venue response with full nested details for frontend.
    
    This is used by the /venues/{id}/detail endpoint to return
    complete venue information including locations and accessibility attributes.
    """
    locations: List[VenueLocationResponse] = []
    attributes: List[AccessibilityAttributeResponse] = []
