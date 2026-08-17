"""Evidence API routes."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import NotFoundException, ValidationException
from app.schemas.schemas import (
    EvidenceCreate, EvidenceResponse, EvidenceListResponse,
    EvidenceUpdate, VerificationHistoryResponse
)
from app.services.evidence_service import EvidenceService

router = APIRouter(prefix="/evidence", tags=["evidence"])


def get_evidence_service(db: Session = Depends(get_db)) -> EvidenceService:
    return EvidenceService(db)


@router.get("/{evidence_id}", response_model=EvidenceResponse)
def get_evidence(
    evidence_id: UUID,
    service: EvidenceService = Depends(get_evidence_service)
):
    """Get evidence by ID with full details."""
    try:
        return service.get_evidence(evidence_id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.post("", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED)
def create_evidence(
    evidence_data: EvidenceCreate,
    service: EvidenceService = Depends(get_evidence_service)
):
    """Create new evidence."""
    try:
        return service.create_evidence(evidence_data)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.patch("/{evidence_id}", response_model=EvidenceResponse)
def update_evidence(
    evidence_id: UUID,
    evidence_data: EvidenceUpdate,
    service: EvidenceService = Depends(get_evidence_service)
):
    """Update evidence verification status and confidence."""
    try:
        # Handle verification status update separately to track history
        if evidence_data.verification_status:
            return service.update_evidence_verification(
                evidence_id=evidence_id,
                new_status=evidence_data.verification_status,
                change_reason=evidence_data.notes
            )
        
        # For other updates, get and modify directly
        evidence = service.get_evidence(evidence_id)
        if evidence_data.confidence is not None:
            evidence.confidence = evidence_data.confidence
            service.db.commit()
            service.db.refresh(evidence)
        return evidence
        
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)


@router.get("/{evidence_id}/conflicts")
def get_evidence_conflicts(
    evidence_id: UUID,
    service: EvidenceService = Depends(get_evidence_service)
):
    """Get conflicting evidence for the attribute this evidence supports."""
    try:
        evidence = service.get_evidence(evidence_id)
        return service.get_evidence_conflicts(evidence.attribute_id)
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.get("/{evidence_id}/history", response_model=list[VerificationHistoryResponse])
def get_verification_history(
    evidence_id: UUID,
    service: EvidenceService = Depends(get_evidence_service)
):
    """Get verification history for evidence."""
    try:
        history, _ = service.get_verification_history(evidence_id)
        return history
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
