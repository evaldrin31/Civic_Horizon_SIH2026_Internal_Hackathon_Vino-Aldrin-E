"""Import API routes for structured data ingestion."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.importers.importer import DataImporter
from app.schemas.schemas import ErrorResponse

router = APIRouter(prefix="/import", tags=["import"])


def get_importer(db: Session = Depends(get_db)) -> DataImporter:
    return DataImporter(db)


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
