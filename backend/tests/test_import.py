"""Tests for data import functionality."""

import pytest
from fastapi.testclient import TestClient


def test_import_single_record(client: TestClient, sample_venue_data, sample_attribute_data):
    record = {
        "venue": sample_venue_data,
        "attribute": sample_attribute_data,
        "evidence": [{
            "evidence_text": "Test evidence",
            "verification_status": "verified"
        }]
    }
    
    response = client.post("/api/v1/admin/import/record", json=record)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert "venue_id" in data
    assert data["venue_created"] is True


def test_import_multiple_records(client: TestClient):
    records = [
        {
            "venue": {
                "name": "Hospital A",
                "category": "hospital",
                "city": "Mumbai",
                "state": "Maharashtra",
                "latitude": 19.0,
                "longitude": 72.0
            },
            "attribute": {
                "category": "mobility",
                "attribute_name": "ramp",
                "value": "yes"
            }
        },
        {
            "venue": {
                "name": "Hospital B",
                "category": "hospital",
                "city": "Delhi",
                "state": "Delhi",
                "latitude": 28.0,
                "longitude": 77.0
            },
            "attribute": {
                "category": "visual",
                "attribute_name": "braille_signage",
                "value": "unknown"
            }
        }
    ]
    
    response = client.post("/api/v1/admin/import/records", json=records)
    assert response.status_code == 201
    data = response.json()
    assert data["total"] == 2
    assert data["successful"] == 2
    assert data["failed"] == 0


def test_import_venue_deduplication(client: TestClient):
    # Import same venue twice
    records = [
        {
            "venue": {
                "name": "Test Hospital",
                "category": "hospital",
                "address": "123 Test St",
                "city": "Mumbai",
                "state": "Maharashtra",
                "latitude": 19.0,
                "longitude": 72.0
            }
        },
        {
            "venue": {
                "name": "Test Hospital",
                "category": "hospital",
                "address": "123 Test St",
                "city": "Mumbai",
                "state": "Maharashtra",
                "latitude": 19.0,
                "longitude": 72.0
            }
        }
    ]
    
    response = client.post("/api/v1/admin/import/records", json=records)
    assert response.status_code == 201
    data = response.json()
    assert data["stats"]["venues_created"] == 1
    assert data["stats"]["venues_matched"] == 1


def test_import_missing_required_fields(client: TestClient):
    record = {
        "venue": {
            "name": "Incomplete Venue"
            # Missing required fields
        }
    }
    
    response = client.post("/api/v1/admin/import/record", json=record)
    assert response.status_code == 400
    data = response.json()
    assert "errors" in data["detail"]


def test_import_invalid_attribute_value(client: TestClient, sample_venue_data):
    record = {
        "venue": sample_venue_data,
        "attribute": {
            "attribute_name": "ramp",
            "value": "invalid_value"
        }
    }
    
    response = client.post("/api/v1/admin/import/record", json=record)
    assert response.status_code == 400


def test_import_with_location(client: TestClient, sample_venue_data, sample_location_data):
    record = {
        "venue": sample_venue_data,
        "location": sample_location_data,
        "attribute": {
            "category": "mobility",
            "attribute_name": "ramp",
            "value": "yes"
        }
    }
    
    response = client.post("/api/v1/admin/import/record", json=record)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True


def test_import_with_source(client: TestClient, sample_venue_data, sample_source_data):
    record = {
        "venue": sample_venue_data,
        "attribute": {
            "category": "mobility",
            "attribute_name": "elevator",
            "value": "yes"
        },
        "evidence": [{
            "evidence_text": "Evidence with source",
            "source": sample_source_data,
            "verification_status": "verified"
        }]
    }
    
    response = client.post("/api/v1/admin/import/record", json=record)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["stats"]["sources_created"] == 1


def test_import_preserves_unknown_value(client: TestClient):
    record = {
        "venue": {
            "name": "Test Venue",
            "category": "restaurant",
            "city": "Mumbai",
            "state": "Maharashtra",
            "latitude": 19.0,
            "longitude": 72.0
        },
        "attribute": {
            "category": "mobility",
            "attribute_name": "accessible_toilet",
            "value": "unknown"
        }
    }
    
    response = client.post("/api/v1/admin/import/record", json=record)
    assert response.status_code == 201
    data = response.json()
    
    # Verify the value was preserved as unknown
    venue_id = data["venue_id"]
    get_response = client.get(f"/api/v1/venues/{venue_id}/accessibility")
    attrs = get_response.json()["items"]
    assert any(attr["value"] == "unknown" for attr in attrs)


def test_import_empty_records(client: TestClient):
    response = client.post("/api/v1/admin/import/records", json=[])
    assert response.status_code == 201
    data = response.json()
    assert data["total"] == 0
    assert data["successful"] == 0


def test_import_official_research_template(client: TestClient):
    """End-to-end test using EXACT official DATA_RECORD_TEMPLATE.json format.
    
    This test validates:
    - location.type maps to location.location_type
    - attribute.name maps to attribute.attribute_name
    - Evidence is attached to the correct attribute
    - Source/provenance is preserved
    - Verification state is preserved
    - Coordinates are preserved
    - UNKNOWN/NO/YES/PARTIAL semantics are preserved
    """
    # Record matching docs/DATA_RECORD_TEMPLATE.json exactly
    official_record = {
        "venue": {
            "name": "City Hospital",
            "category": "hospital",
            "address": "123 Main Road",
            "city": "Mumbai",
            "state": "Maharashtra",
            "country": "India",
            "latitude": 19.0760,
            "longitude": 72.8777
        },
        "location": {
            "name": "Main Entrance",
            "type": "entrance",  # Official template uses 'type', not 'location_type'
            "description": "Primary hospital entrance with wheelchair access"
        },
        "attribute": {
            "category": "mobility",
            "name": "step_free_entrance",  # Official template uses 'name', not 'attribute_name'
            "value": "yes",
            "value_type": "boolean"
        },
        "evidence": [
            {
                "source_type": "professional_audit",
                "source_reference": "Accessibility Audit Report 2024",
                "evidence_text": "Main entrance has a level access ramp with handrails on both sides",
                "observed_at": "2024-01-15T10:30:00Z",
                "collected_at": "2024-01-15T14:00:00Z",
                "verification_status": "verified",
                "confidence": 0.95,
                "notes": "Verified by certified accessibility auditor"
            }
        ]
    }
    
    # Step 1: Validate the record (dry-run)
    validate_response = client.post("/api/v1/admin/import/validate/record", json=official_record)
    assert validate_response.status_code == 200
    validation = validate_response.json()
    assert validation["valid"] is True, f"Validation failed: {validation.get('issues', [])}"
    assert validation["issue_count"]["errors"] == 0
    
    # Step 2: Import the record
    import_response = client.post("/api/v1/admin/import/record", json=official_record)
    assert import_response.status_code == 201, f"Import failed: {import_response.text}"
    import_result = import_response.json()
    assert import_result["success"] is True
    assert import_result["venue_created"] is True
    venue_id = import_result["venue_id"]
    
    # Step 3: Verify venue was created correctly
    venue_response = client.get(f"/api/v1/venues/{venue_id}")
    assert venue_response.status_code == 200
    venue = venue_response.json()
    assert venue["name"] == "City Hospital"
    assert venue["category"] == "hospital"
    assert venue["address"] == "123 Main Road"
    assert venue["city"] == "Mumbai"
    assert venue["state"] == "Maharashtra"
    assert venue["country"] == "India"
    assert venue["latitude"] == 19.0760
    assert venue["longitude"] == 72.8777
    
    # Step 4: Verify location was created with correct type mapping
    detail_response = client.get(f"/api/v1/venues/{venue_id}/detail")
    assert detail_response.status_code == 200
    detail = detail_response.json()
    assert len(detail["locations"]) == 1
    location = detail["locations"][0]
    assert location["name"] == "Main Entrance"
    assert location["location_type"] == "entrance"  # Mapped from 'type'
    assert location["type"] == "entrance"  # Frontend compatibility field
    assert location["description"] == "Primary hospital entrance with wheelchair access"
    
    # Step 5: Verify attribute was created with correct name mapping
    assert len(detail["attributes"]) == 1
    attribute = detail["attributes"][0]
    assert attribute["category"] == "mobility"
    assert attribute["attribute_name"] == "step_free_entrance"  # Mapped from 'name'
    assert attribute["value"] == "yes"
    assert attribute["value_type"] == "boolean"
    
    # Step 6: Verify evidence is attached with correct provenance
    assert len(attribute["evidence"]) == 1
    evidence = attribute["evidence"][0]
    assert evidence["evidence_text"] == "Main entrance has a level access ramp with handrails on both sides"
    assert evidence["verification_status"] == "verified"
    assert evidence["confidence"] == 0.95
    assert evidence["observed_at"] is not None
    
    # Step 7: Verify source/provenance is preserved
    assert evidence["source"] is not None
    assert evidence["source"]["source_type"] == "professional_audit"
    assert evidence["source"]["source_name"] == "Accessibility Audit Report 2024"


def test_import_evidence_without_attribute_rejected(client: TestClient):
    """Test that evidence without an attribute block is rejected."""
    record = {
        "venue": {
            "name": "Test Venue",
            "category": "restaurant",
            "city": "Mumbai",
            "state": "Maharashtra",
            "latitude": 19.0,
            "longitude": 72.0
        },
        "evidence": [
            {
                "evidence_text": "This evidence has no attribute",
                "verification_status": "unverified"
            }
        ]
    }
    
    # Step 1: Validate should reject
    validate_response = client.post("/api/v1/admin/import/validate/record", json=record)
    assert validate_response.status_code == 200
    validation = validate_response.json()
    assert validation["valid"] is False
    assert any("evidence" in issue["field"] and "attribute" in issue["message"].lower() 
               for issue in validation["issues"])
    
    # Step 2: Import should fail
    import_response = client.post("/api/v1/admin/import/record", json=record)
    assert import_response.status_code == 400
    result = import_response.json()
    assert "errors" in result["detail"]


def test_import_unknown_value_preserved(client: TestClient):
    """Test that UNKNOWN value semantics are preserved and not converted to NO."""
    record = {
        "venue": {
            "name": "Mystery Venue",
            "category": "restaurant",
            "city": "Pune",
            "state": "Maharashtra",
            "latitude": 18.5,
            "longitude": 73.8
        },
        "attribute": {
            "category": "mobility",
            "name": "ramp",  # Using official 'name' key
            "value": "unknown"  # Must remain UNKNOWN, not become NO
        }
    }
    
    import_response = client.post("/api/v1/admin/import/record", json=record)
    assert import_response.status_code == 201
    result = import_response.json()
    venue_id = result["venue_id"]
    
    # Verify UNKNOWN is preserved
    accessibility_response = client.get(f"/api/v1/venues/{venue_id}/accessibility")
    assert accessibility_response.status_code == 200
    attrs = accessibility_response.json()["items"]
    assert len(attrs) == 1
    assert attrs[0]["value"] == "unknown"
    assert attrs[0]["attribute_name"] == "ramp"


def test_import_partial_value_preserved(client: TestClient):
    """Test that PARTIAL value semantics are preserved."""
    record = {
        "venue": {
            "name": "Partial Access Venue",
            "category": "museum",
            "city": "Delhi",
            "state": "Delhi",
            "latitude": 28.6,
            "longitude": 77.2
        },
        "attribute": {
            "category": "mobility",
            "name": "elevator",
            "value": "partial"
        },
        "evidence": [{
            "evidence_text": "Elevator available but requires staff assistance",
            "verification_status": "reported"
        }]
    }
    
    import_response = client.post("/api/v1/admin/import/record", json=record)
    assert import_response.status_code == 201
    result = import_response.json()
    venue_id = result["venue_id"]
    
    accessibility_response = client.get(f"/api/v1/venues/{venue_id}/accessibility")
    attrs = accessibility_response.json()["items"]
    assert attrs[0]["value"] == "partial"
