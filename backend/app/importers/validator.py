"""Research record validation for accessibility data ingestion.

This module provides comprehensive validation for research records
before they are imported into the database. It supports both
dry-run validation and actual import with detailed reporting.
"""

from datetime import datetime
from enum import Enum
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID
import re

from app.core.logging import get_logger

logger = get_logger(__name__)


class ValidationSeverity(str, Enum):
    """Severity levels for validation issues."""
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class DuplicateClassification(str, Enum):
    """Classification for potential duplicates."""
    DUPLICATE = "duplicate"
    POSSIBLE_DUPLICATE = "possible_duplicate"
    DISTINCT = "distinct"


class ValidationIssue:
    """Represents a single validation issue."""
    
    def __init__(
        self,
        record_index: int,
        field: str,
        message: str,
        severity: ValidationSeverity,
        venue_name: Optional[str] = None
    ):
        self.record_index = record_index
        self.field = field
        self.message = message
        self.severity = severity
        self.venue_name = venue_name
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "record": self.record_index,
            "field": self.field,
            "message": self.message,
            "severity": self.severity.value,
            "venue": self.venue_name
        }


class ImportReport:
    """Comprehensive import validation report."""
    
    def __init__(self):
        self.total = 0
        self.valid = 0
        self.invalid = 0
        self.warnings = 0
        self.duplicates = 0
        self.conflicts = 0
        self.issues: List[ValidationIssue] = []
        self.valid_records: List[Dict[str, Any]] = []
        self.processed_venues: Dict[str, Any] = {}  # Track venues by normalized name+address
    
    def add_issue(self, issue: ValidationIssue):
        self.issues.append(issue)
        if issue.severity == ValidationSeverity.ERROR:
            self.invalid += 1
        elif issue.severity == ValidationSeverity.WARNING:
            self.warnings += 1
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "total": self.total,
            "valid": self.valid,
            "invalid": self.invalid,
            "warnings": self.warnings,
            "duplicates": self.duplicates,
            "conflicts": self.conflicts,
            "errors": [i.to_dict() for i in self.issues if i.severity == ValidationSeverity.ERROR],
            "warnings_list": [i.to_dict() for i in self.issues if i.severity == ValidationSeverity.WARNING],
            "info": [i.to_dict() for i in self.issues if i.severity == ValidationSeverity.INFO]
        }


class ResearchRecordValidator:
    """Validator for research records with comprehensive quality checks."""
    
    # Valid enum values
    VALID_ATTRIBUTE_VALUES = {"yes", "no", "unknown", "partial"}
    VALID_VERIFICATION_STATUSES = {
        "unverified", "reported", "corroborated", 
        "verified", "conflicting", "outdated"
    }
    VALID_SOURCE_TYPES = {
        "government", "professional_audit", "official_venue",
        "direct_observation", "institutional_dataset", 
        "community_observation", "public_review", "ai_inference"
    }
    
    def __init__(self):
        self.report = ImportReport()
    
    def reset(self):
        """Reset validator state for new batch."""
        self.report = ImportReport()
    
    def validate_record(self, record: Dict[str, Any], index: int) -> Tuple[bool, List[ValidationIssue]]:
        """
        Validate a single research record.
        
        Returns:
            Tuple of (is_valid, list_of_issues)
        """
        issues = []
        venue_name = self._extract_venue_name(record)
        
        # Validate venue section
        venue_issues = self._validate_venue(record.get("venue", {}), index, venue_name)
        issues.extend(venue_issues)
        
        # Validate location section (optional but recommended)
        if "location" in record:
            location_issues = self._validate_location(record.get("location", {}), index, venue_name)
            issues.extend(location_issues)
        
        # Validate attribute section (optional but must be valid if present)
        if "attribute" in record:
            attr_issues = self._validate_attribute(record.get("attribute", {}), index, venue_name)
            issues.extend(attr_issues)
        
        # Validate evidence section
        if "evidence" in record:
            evidence_issues = self._validate_evidence_list(
                record.get("evidence", []), 
                index, 
                venue_name,
                bool(record.get("attribute"))
            )
            issues.extend(evidence_issues)
        
        # Check for duplicate candidates
        duplicate_issues = self._check_for_duplicates(record, index, venue_name)
        issues.extend(duplicate_issues)
        
        # Evidence safety checks
        safety_issues = self._check_evidence_safety(record, index, venue_name)
        issues.extend(safety_issues)
        
        # Determine if valid (no errors)
        has_errors = any(i.severity == ValidationSeverity.ERROR for i in issues)
        
        return not has_errors, issues
    
    def _extract_venue_name(self, record: Dict[str, Any]) -> Optional[str]:
        """Extract venue name from record for reporting."""
        venue = record.get("venue", {})
        return venue.get("name", "Unknown Venue")
    
    def _validate_venue(
        self, 
        venue: Dict[str, Any], 
        index: int, 
        venue_name: Optional[str]
    ) -> List[ValidationIssue]:
        """Validate venue section."""
        issues = []
        
        if not venue:
            issues.append(ValidationIssue(
                record_index=index,
                field="venue",
                message="Venue section is missing",
                severity=ValidationSeverity.ERROR,
                venue_name=venue_name
            ))
            return issues
        
        # Required fields
        required_fields = ["name", "city", "state", "latitude", "longitude"]
        for field in required_fields:
            if field not in venue or venue[field] is None or venue[field] == "":
                issues.append(ValidationIssue(
                    record_index=index,
                    field=f"venue.{field}",
                    message=f"Required field '{field}' is missing or empty",
                    severity=ValidationSeverity.ERROR,
                    venue_name=venue_name
                ))
        
        # Validate coordinates
        if "latitude" in venue and venue["latitude"] is not None:
            lat = venue["latitude"]
            if not isinstance(lat, (int, float)) or lat < -90 or lat > 90:
                issues.append(ValidationIssue(
                    record_index=index,
                    field="venue.latitude",
                    message=f"Invalid latitude: {lat}. Must be between -90 and 90",
                    severity=ValidationSeverity.ERROR,
                    venue_name=venue_name
                ))
        
        if "longitude" in venue and venue["longitude"] is not None:
            lon = venue["longitude"]
            if not isinstance(lon, (int, float)) or lon < -180 or lon > 180:
                issues.append(ValidationIssue(
                    record_index=index,
                    field="venue.longitude",
                    message=f"Invalid longitude: {lon}. Must be between -180 and 180",
                    severity=ValidationSeverity.ERROR,
                    venue_name=venue_name
                ))
        
        # Warnings for recommended fields
        if not venue.get("address"):
            issues.append(ValidationIssue(
                record_index=index,
                field="venue.address",
                message="Address is recommended for deduplication",
                severity=ValidationSeverity.WARNING,
                venue_name=venue_name
            ))
        
        if not venue.get("category"):
            issues.append(ValidationIssue(
                record_index=index,
                field="venue.category",
                message="Category is recommended",
                severity=ValidationSeverity.WARNING,
                venue_name=venue_name
            ))
        
        # Warning for missing coordinates
        if venue.get("latitude") is None or venue.get("longitude") is None:
            issues.append(ValidationIssue(
                record_index=index,
                field="venue.coordinates",
                message="Coordinates are missing - geocoding will be needed",
                severity=ValidationSeverity.WARNING,
                venue_name=venue_name
            ))
        
        return issues
    
    def _validate_location(
        self,
        location: Dict[str, Any],
        index: int,
        venue_name: Optional[str]
    ) -> List[ValidationIssue]:
        """Validate location section."""
        issues = []
        
        if not location:
            return issues
        
        # Check for location name
        if not location.get("name"):
            issues.append(ValidationIssue(
                record_index=index,
                field="location.name",
                message="Location name is recommended when location section is present",
                severity=ValidationSeverity.WARNING,
                venue_name=venue_name
            ))
        
        # Validate location coordinates if present
        if "latitude" in location and location["latitude"] is not None:
            lat = location["latitude"]
            if not isinstance(lat, (int, float)) or lat < -90 or lat > 90:
                issues.append(ValidationIssue(
                    record_index=index,
                    field="location.latitude",
                    message=f"Invalid location latitude: {lat}",
                    severity=ValidationSeverity.ERROR,
                    venue_name=venue_name
                ))
        
        return issues
    
    def _validate_attribute(
        self,
        attribute: Dict[str, Any],
        index: int,
        venue_name: Optional[str]
    ) -> List[ValidationIssue]:
        """Validate attribute section."""
        issues = []
        
        if not attribute:
            return issues
        
        # Check value validity
        if "value" in attribute:
            value = attribute["value"]
            if value is not None and value not in self.VALID_ATTRIBUTE_VALUES:
                issues.append(ValidationIssue(
                    record_index=index,
                    field="attribute.value",
                    message=f"Invalid attribute value: '{value}'. Must be one of: {self.VALID_ATTRIBUTE_VALUES}",
                    severity=ValidationSeverity.ERROR,
                    venue_name=venue_name
                ))
        
        # Check attribute name
        if not attribute.get("name"):
            issues.append(ValidationIssue(
                record_index=index,
                field="attribute.name",
                message="Attribute name is required when attribute section is present",
                severity=ValidationSeverity.ERROR,
                venue_name=venue_name
            ))
        
        # Warning for missing category
        if not attribute.get("category"):
            issues.append(ValidationIssue(
                record_index=index,
                field="attribute.category",
                message="Attribute category is recommended",
                severity=ValidationSeverity.WARNING,
                venue_name=venue_name
            ))
        
        return issues
    
    def _validate_evidence_list(
        self,
        evidence_list: List[Dict[str, Any]],
        index: int,
        venue_name: Optional[str],
        has_attribute: bool
    ) -> List[ValidationIssue]:
        """Validate evidence list."""
        issues = []
        
        if not evidence_list:
            # No evidence is allowed but warned
            issues.append(ValidationIssue(
                record_index=index,
                field="evidence",
                message="No evidence provided - accessibility claim will be marked as UNKNOWN/UNVERIFIED",
                severity=ValidationSeverity.WARNING,
                venue_name=venue_name
            ))
            return issues
        
        if not isinstance(evidence_list, list):
            issues.append(ValidationIssue(
                record_index=index,
                field="evidence",
                message="Evidence must be a list",
                severity=ValidationSeverity.ERROR,
                venue_name=venue_name
            ))
            return issues
        
        for i, evidence in enumerate(evidence_list):
            evidence_issues = self._validate_single_evidence(
                evidence, index, i, venue_name, has_attribute
            )
            issues.extend(evidence_issues)
        
        return issues
    
    def _validate_single_evidence(
        self,
        evidence: Dict[str, Any],
        record_index: int,
        evidence_index: int,
        venue_name: Optional[str],
        has_attribute: bool
    ) -> List[ValidationIssue]:
        """Validate a single evidence item."""
        issues = []
        field_prefix = f"evidence[{evidence_index}]"
        
        if not isinstance(evidence, dict):
            issues.append(ValidationIssue(
                record_index=record_index,
                field=field_prefix,
                message="Evidence item must be an object",
                severity=ValidationSeverity.ERROR,
                venue_name=venue_name
            ))
            return issues
        
        # Check verification status
        if "verification_status" in evidence:
            status = evidence["verification_status"]
            if status and status.lower() not in self.VALID_VERIFICATION_STATUSES:
                issues.append(ValidationIssue(
                    record_index=record_index,
                    field=f"{field_prefix}.verification_status",
                    message=f"Invalid verification status: '{status}'",
                    severity=ValidationSeverity.ERROR,
                    venue_name=venue_name
                ))
        
        # Check source type
        if "source_type" in evidence:
            source_type = evidence["source_type"]
            if source_type and source_type.lower() not in self.VALID_SOURCE_TYPES:
                issues.append(ValidationIssue(
                    record_index=record_index,
                    field=f"{field_prefix}.source_type",
                    message=f"Invalid source type: '{source_type}'",
                    severity=ValidationSeverity.ERROR,
                    venue_name=venue_name
                ))
        
        # Check source
        if not evidence.get("source_type") and not evidence.get("source"):
            issues.append(ValidationIssue(
                record_index=record_index,
                field=f"{field_prefix}.source",
                message="Evidence should have a source for provenance",
                severity=ValidationSeverity.WARNING,
                venue_name=venue_name
            ))
        
        # Check observation date
        if not evidence.get("observed_at"):
            issues.append(ValidationIssue(
                record_index=record_index,
                field=f"{field_prefix}.observed_at",
                message="Observation date is recommended for freshness tracking",
                severity=ValidationSeverity.WARNING,
                venue_name=venue_name
            ))
        
        # Check for AI inference without confirmation
        if evidence.get("source_type") == "ai_inference":
            issues.append(ValidationIssue(
                record_index=record_index,
                field=f"{field_prefix}.source_type",
                message="AI inference evidence should be corroborated by human observation",
                severity=ValidationSeverity.WARNING,
                venue_name=venue_name
            ))
        
        return issues
    
    def _check_for_duplicates(
        self,
        record: Dict[str, Any],
        index: int,
        venue_name: Optional[str]
    ) -> List[ValidationIssue]:
        """Check for potential duplicate venues."""
        issues = []
        
        venue = record.get("venue", {})
        if not venue:
            return issues
        
        # Create normalized key
        name = venue.get("name", "").strip().lower()
        address = venue.get("address", "").strip().lower()
        city = venue.get("city", "").strip().lower()
        
        key = f"{name}|{address}|{city}"
        
        if key in self.report.processed_venues:
            existing = self.report.processed_venues[key]
            issues.append(ValidationIssue(
                record_index=index,
                field="venue",
                message=f"Possible duplicate of record {existing['index']}: {existing['name']}",
                severity=ValidationSeverity.WARNING,
                venue_name=venue_name
            ))
            self.report.duplicates += 1
        else:
            self.report.processed_venues[key] = {
                "index": index,
                "name": venue.get("name")
            }
        
        return issues
    
    def _check_evidence_safety(
        self,
        record: Dict[str, Any],
        index: int,
        venue_name: Optional[str]
    ) -> List[ValidationIssue]:
        """Check evidence safety principles."""
        issues = []
        
        attribute = record.get("attribute", {})
        evidence_list = record.get("evidence", [])
        
        # Check: No evidence with value=yes/verified
        if attribute.get("value") in ["yes", "partial"]:
            if not evidence_list:
                issues.append(ValidationIssue(
                    record_index=index,
                    field="attribute.value",
                    message="Positive accessibility claim (yes/partial) without evidence - should be marked as 'unknown' or 'reported' only",
                    severity=ValidationSeverity.ERROR,
                    venue_name=venue_name
                ))
        
        # Check: AI inference as verified
        for i, evidence in enumerate(evidence_list):
            if evidence.get("source_type") == "ai_inference":
                if evidence.get("verification_status") == "verified":
                    issues.append(ValidationIssue(
                        record_index=index,
                        field=f"evidence[{i}].verification_status",
                        message="AI inference cannot be automatically marked as VERIFIED - maximum is REPORTED or CORROBORATED",
                        severity=ValidationSeverity.ERROR,
                        venue_name=venue_name
                    ))
        
        # Check: Unknown value with verification_status=verified
        if attribute.get("value") == "unknown":
            if attribute.get("verification_status") == "verified":
                issues.append(ValidationIssue(
                    record_index=index,
                    field="attribute.verification_status",
                    message="UNKNOWN value cannot be VERIFIED - contradictory state",
                    severity=ValidationSeverity.ERROR,
                    venue_name=venue_name
                ))
        
        return issues
    
    def validate_batch(
        self,
        records: List[Dict[str, Any]]
    ) -> ImportReport:
        """
        Validate a batch of research records.
        
        Returns comprehensive import report.
        """
        self.reset()
        self.report.total = len(records)
        
        for index, record in enumerate(records):
            is_valid, issues = self.validate_record(record, index)
            
            for issue in issues:
                self.report.add_issue(issue)
            
            if is_valid:
                self.report.valid += 1
                self.report.valid_records.append(record)
        
        return self.report
    
    def validate_single(
        self,
        record: Dict[str, Any],
        index: int = 0
    ) -> Tuple[bool, List[ValidationIssue]]:
        """Validate a single record."""
        return self.validate_record(record, index)
