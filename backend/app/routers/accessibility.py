"""Accessibility API routes."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.schemas.schemas import (
    AccessibilityAttributeCreate, AccessibilityAttributeResponse,
    AccessibilityAttributeListResponse, AccessibilityAttributeUpdate,
    EvidenceListResponse, EvidenceCreate, EvidenceResponse, EvidenceUpdate
)
from app.services.accessibility_service import AccessibilityService
from app.services.evidence_service import EvidenceService

router = APIRouter(prefix="/venues/{venue_id}", tags=["accessibility"])


def get_accessibility_service(db: Session = Depends(get_db)) -> AccessibilityService:
    return AccessibilityService(db)


def get_evidence_service(db: Session = Depends(get_db)) -> EvidenceService:
    return EvidenceService(db)


@router.get("/accessibility", response_model=AccessibilityAttributeListResponse)
def get_venue_accessibility(
    venue_id: UUID,
    category: Optional[str] = Query(None, description="Filter by category"),
    attribute_name: Optional[str] = Query(None, description="Filter by attribute name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=1000),
    service: AccessibilityService = Depends(get_accessibility_service)
):
    """Get accessibility attributes for a venue."""
    try:
        skip = (page - 1) * page_size
        attributes, total = service.get_venue_attributes(
            venue_id=venue_id,
            category=category,
            attribute_name=attribute_name,
            skip=skip,
            limit=page_size
        )
        
        return {
            "items": attributes,
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": (total + page_size - 1) // page_size
        }
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.post("/accessibility", response_model=AccessibilityAttributeResponse, status_code=status.HTTP_201_CREATED)
def create_accessibility_attribute(
    venue_id: UUID,
    attr_data: AccessibilityAttributeCreate,
    service: AccessibilityService = Depends(get_accessibility_service)
):
    """Create a new accessibility attribute for a venue."""
    try:
        return service.create_attribute(attr_data)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.get("/accessibility/{attribute_id}", response_model=AccessibilityAttributeResponse)
def get_accessibility_attribute(
    venue_id: UUID,
    attribute_id: UUID,
    service: AccessibilityService = Depends(get_accessibility_service)
):
    """Get a specific accessibility attribute."""
    try:
        return service.get_attribute(attribute_id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.patch("/accessibility/{attribute_id}", response_model=AccessibilityAttributeResponse)
def update_accessibility_attribute(
    venue_id: UUID,
    attribute_id: UUID,
    attr_data: AccessibilityAttributeUpdate,
    service: AccessibilityService = Depends(get_accessibility_service)
):
    """Update an accessibility attribute."""
    try:
        return service.update_attribute(attribute_id, attr_data)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.delete("/accessibility/{attribute_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_accessibility_attribute(
    venue_id: UUID,
    attribute_id: UUID,
    service: AccessibilityService = Depends(get_accessibility_service)
):
    """Delete an accessibility attribute."""
    try:
        service.delete_attribute(attribute_id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.get("/evidence", response_model=EvidenceListResponse)
def get_venue_evidence(
    venue_id: UUID,
    verification_status: Optional[str] = Query(None, description="Filter by verification status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    service: EvidenceService = Depends(get_evidence_service)
):
    """Get all evidence for a venue."""
    try:
        skip = (page - 1) * page_size
        evidence, total = service.get_venue_evidence(
            venue_id=venue_id,
            verification_status=verification_status,
            skip=skip,
            limit=page_size
        )
        
        return {
            "items": evidence,
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": (total + page_size - 1) // page_size
        }
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.get("/accessibility/summary")
def get_venue_accessibility_summary(
    venue_id: UUID,
    service: AccessibilityService = Depends(get_accessibility_service)
):
    """Get a summary of accessibility data for a venue."""
    try:
        return service.get_attribute_summary(venue_id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
