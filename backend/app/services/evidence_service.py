"""Evidence service layer."""

from typing import List, Optional
from uuid import UUID
from datetime import datetime

from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import NotFoundException, ValidationException
from app.models.models import (
    Evidence, Source, VerificationHistory, VerificationStatus,
    AccessibilityAttribute, AccessibilityAttribute as Attr
)
from app.schemas.schemas import EvidenceCreate, EvidenceUpdate, SourceCreate


class EvidenceService:
    """Service for evidence operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_evidence(self, evidence_id: UUID) -> Evidence:
        """Get evidence by ID with related data."""
        evidence = (
            self.db.query(Evidence)
            .options(
                joinedload(Evidence.source),
                joinedload(Evidence.attribute).joinedload(Attr.venue),
                joinedload(Evidence.attribute).joinedload(Attr.location)
            )
            .filter(Evidence.evidence_id == evidence_id)
            .first()
        )
        if not evidence:
            raise NotFoundException("Evidence", str(evidence_id))
        return evidence
    
    def get_venue_evidence(
        self,
        venue_id: UUID,
        verification_status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Evidence], int]:
        """Get all evidence for a venue."""
        query = (
            self.db.query(Evidence)
            .join(AccessibilityAttribute)
            .options(
                joinedload(Evidence.source),
                joinedload(Evidence.attribute).joinedload(Attr.location)
            )
            .filter(AccessibilityAttribute.venue_id == venue_id)
        )
        
        if verification_status:
            try:
                status = VerificationStatus(verification_status)
                query = query.filter(Evidence.verification_status == status)
            except ValueError:
                raise ValidationException(f"Invalid verification_status: {verification_status}")
        
        total = query.count()
        evidence_list = (
            query.order_by(Evidence.observed_at.desc().nulls_last(), Evidence.collected_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        
        return evidence_list, total
    
    def get_attribute_evidence(
        self,
        attribute_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Evidence], int]:
        """Get evidence for a specific attribute."""
        query = (
            self.db.query(Evidence)
            .options(joinedload(Evidence.source))
            .filter(Evidence.attribute_id == attribute_id)
        )
        
        total = query.count()
        evidence_list = (
            query.order_by(Evidence.observed_at.desc().nulls_last(), Evidence.collected_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        
        return evidence_list, total
    
    def create_evidence(self, evidence_data: EvidenceCreate) -> Evidence:
        """Create new evidence."""
        # Validate attribute exists
        attr = self.db.query(AccessibilityAttribute).filter(
            AccessibilityAttribute.attribute_id == evidence_data.attribute_id
        ).first()
        if not attr:
            raise NotFoundException("AccessibilityAttribute", str(evidence_data.attribute_id))
        
        # Handle inline source creation if provided
        source_id = evidence_data.source_id
        if evidence_data.source and not source_id:
            # Check if source already exists by name
            existing_source = self.db.query(Source).filter(
                Source.source_name == evidence_data.source.source_name
            ).first()
            if existing_source:
                source_id = existing_source.source_id
            else:
                # Create new source
                new_source = Source(**evidence_data.source.model_dump())
                self.db.add(new_source)
                self.db.flush()
                source_id = new_source.source_id
        
        # Validate source_id if provided
        if source_id:
            source = self.db.query(Source).filter(
                Source.source_id == source_id
            ).first()
            if not source:
                raise NotFoundException("Source", str(source_id))
        
        # Create evidence with validated source_id
        evidence_dict = evidence_data.model_dump(exclude={'source'})
        evidence_dict['source_id'] = source_id
        evidence = Evidence(**evidence_dict)
        self.db.add(evidence)
        self.db.commit()
        self.db.refresh(evidence)
        
        # Update attribute's last_observed_at if evidence has observed_at
        if evidence.observed_at:
            attr.last_observed_at = evidence.observed_at
            self.db.commit()
        
        return evidence
    
    def update_evidence_verification(
        self,
        evidence_id: UUID,
        new_status: str,
        change_reason: Optional[str] = None,
        changed_by: Optional[str] = None
    ) -> Evidence:
        """Update evidence verification status with history tracking."""
        evidence = self.get_evidence(evidence_id)
        
        try:
            new_status_enum = VerificationStatus(new_status)
        except ValueError:
            raise ValidationException(f"Invalid verification status: {new_status}")
        
        previous_status = evidence.verification_status
        
        # Only record history if status actually changed
        if previous_status != new_status_enum:
            # Create history record
            history = VerificationHistory(
                evidence_id=evidence_id,
                previous_status=previous_status,
                new_status=new_status_enum,
                change_reason=change_reason,
                changed_by=changed_by or "system"
            )
            self.db.add(history)
            
            # Update evidence
            evidence.verification_status = new_status_enum
            
            self.db.commit()
            self.db.refresh(evidence)
        
        return evidence
    
    def get_evidence_conflicts(self, attribute_id: UUID) -> List[dict]:
        """Find conflicting evidence for an attribute.
        
        Returns evidence items that have CONFLICTING status or
        evidence that contradicts the current attribute value.
        """
        evidence_list = (
            self.db.query(Evidence)
            .options(joinedload(Evidence.source))
            .filter(Evidence.attribute_id == attribute_id)
            .all()
        )
        
        conflicts = []
        verified_positive = []
        verified_negative = []
        
        for ev in evidence_list:
            if ev.verification_status == VerificationStatus.CONFLICTING:
                conflicts.append({
                    "evidence_id": str(ev.evidence_id),
                    "reason": "marked_conflicting",
                    "verification_status": ev.verification_status.value,
                    "source": ev.source.source_name if ev.source else None
                })
            elif ev.verification_status in [VerificationStatus.VERIFIED, VerificationStatus.CORROBORATED]:
                # Track verified claims for conflict detection
                if ev.evidence_text:
                    text_lower = ev.evidence_text.lower()
                    if any(word in text_lower for word in ["has", "yes", "present", "available"]):
                        verified_positive.append(ev)
                    elif any(word in text_lower for word in ["no", "not", "missing", "absent", "unavailable"]):
                        verified_negative.append(ev)
        
        # Detect implicit conflicts
        if verified_positive and verified_negative:
            for pos in verified_positive:
                for neg in verified_negative:
                    conflicts.append({
                        "evidence_id": str(pos.evidence_id),
                        "conflicts_with": str(neg.evidence_id),
                        "reason": "contradictory_claims",
                        "positive_evidence": pos.evidence_text[:200] if pos.evidence_text else None,
                        "negative_evidence": neg.evidence_text[:200] if neg.evidence_text else None
                    })
        
        return conflicts
    
    def get_stale_evidence(
        self,
        days_threshold: int = 365,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Evidence], int]:
        """Get evidence that hasn't been observed recently."""
        from datetime import timedelta
        
        threshold_date = datetime.utcnow() - timedelta(days=days_threshold)
        
        query = (
            self.db.query(Evidence)
            .options(
                joinedload(Evidence.attribute),
                joinedload(Evidence.source)
            )
            .filter(
                Evidence.observed_at < threshold_date,
                Evidence.verification_status != VerificationStatus.OUTDATED
            )
        )
        
        total = query.count()
        evidence_list = (
            query.order_by(Evidence.observed_at.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        
        return evidence_list, total
    
    def get_verification_history(
        self,
        evidence_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[VerificationHistory], int]:
        """Get verification history for evidence."""
        query = (
            self.db.query(VerificationHistory)
            .filter(VerificationHistory.evidence_id == evidence_id)
            .order_by(VerificationHistory.changed_at.desc())
        )
        
        total = query.count()
        history = query.offset(skip).limit(limit).all()
        
        return history, total
