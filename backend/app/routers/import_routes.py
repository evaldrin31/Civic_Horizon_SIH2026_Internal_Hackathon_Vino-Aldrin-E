"""Import API routes for structured data ingestion."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.logging import get_logger
from app.importers.importer import DataImporter
from app.importers.validator import ResearchRecordValidator, ImportReport
from app.schemas.schemas import ErrorResponse

router = APIRouter(prefix="/import", tags=["import"])


def get_importer(db: Session = Depends(get_db)) -> DataImporter:
    return DataImporter(db)


def get_validator() -> ResearchRecordValidator:
    return ResearchRecordValidator()


@router.post("/records", status_code=status.HTTP_201_CREATED)
def import_records(
    records: List[dict],
    importer: DataImporter = Depends(get_importer)
):
    """Import structured accessibility records.
    
    Returns immediately with empty stats if no records provided.
    
    Expected format:
    [
        {
            "venue": {
                "name": "Example Hospital",
                "category": "hospital",
                "address": "123 Main St",
                "city": "Mumbai",
                "state": "Maharashtra",
                "latitude": 19.0760,
                "longitude": 72.8777
            },
            "location": {
                "name": "Main Entrance",
                "location_type": "entrance"
            },  // optional
            "attribute": {
                "category": "mobility",
                "attribute_name": "ramp",
                "value": "yes",
                "notes": "Accessible ramp at main entrance"
            },  // optional
            "evidence": [
                {
                    "source": {
                        "source_type": "official_venue",
                        "source_name": "Hospital Website"
                    },  // or use source_id
                    "evidence_text": "...",
                    "verification_status": "verified",
                    "observed_at": "2024-01-15T00:00:00"
                }
            ]
        }
    ]
    """
    # Handle empty list
    if not records:
        return {
            "total": 0,
            "successful": 0,
            "failed": 0,
            "stats": {
                "venues_created": 0,
                "venues_matched": 0,
                "locations_created": 0,
                "attributes_created": 0,
                "evidence_created": 0,
                "sources_created": 0,
                "errors": []
            },
            "results": []
        }
    
    try:
        result = importer.import_records(records)
        
        # Return appropriate status based on results
        if result["failed"] == len(records):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "All records failed to import",
                    "result": result
                }
            )
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": str(e)}
        )


@router.post("/record", status_code=status.HTTP_201_CREATED)
def import_single_record(
    record: dict,
    importer: DataImporter = Depends(get_importer)
):
    """Import a single structured record."""
    result = importer.import_record(record, 0)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Import failed",
                "errors": result["errors"]
            }
        )
    
    # Include stats in the response
    result["stats"] = importer.stats
    return result


@router.post("/validate", status_code=status.HTTP_200_OK)
def validate_import(
    records: List[dict],
    validator: ResearchRecordValidator = Depends(get_validator)
):
    """
    Dry-run validation for research records.
    
    Validates records without writing to database.
    Returns comprehensive validation report with errors, warnings, and duplicates.
    
    Expected format: Same as /import/records endpoint
    
    Response includes:
    - total: Total records processed
    - valid: Number of valid records
    - invalid: Number of invalid records
    - warnings: Number of warnings
    - duplicates: Number of duplicate candidates
    - conflicts: Number of conflicts detected
    - errors: List of validation errors
    - warnings_list: List of validation warnings
    - info: List of informational messages
    """
    if not records:
        return {
            "total": 0,
            "valid": 0,
            "invalid": 0,
            "warnings": 0,
            "duplicates": 0,
            "conflicts": 0,
            "errors": [],
            "warnings_list": [],
            "info": []
        }
    
    try:
        report = validator.validate_batch(records)
        return report.to_dict()
        
    except Exception as e:
        logger = get_logger(__name__)
        logger.exception("Validation error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": f"Validation failed: {str(e)}"}
        )


@router.post("/validate/record", status_code=status.HTTP_200_OK)
def validate_single_record(
    record: dict,
    validator: ResearchRecordValidator = Depends(get_validator)
):
    """
    Validate a single research record without importing.
    
    Returns detailed validation results for the record.
    """
    try:
        is_valid, issues = validator.validate_single(record, 0)
        
        return {
            "valid": is_valid,
            "issues": [issue.to_dict() for issue in issues],
            "issue_count": {
                "errors": sum(1 for i in issues if i.severity.value == "error"),
                "warnings": sum(1 for i in issues if i.severity.value == "warning"),
                "info": sum(1 for i in issues if i.severity.value == "info")
            }
        }
        
    except Exception as e:
        logger = get_logger(__name__)
        logger.exception("Validation error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": f"Validation failed: {str(e)}"}
        )
