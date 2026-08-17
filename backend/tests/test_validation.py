"""Tests for research record validation."""

import pytest
from fastapi.testclient import TestClient


def test_validate_valid_record(client: TestClient):
    """Test validation of a valid research record."""
    record = {
        "venue": {
            "name": "Test Hospital",
            "category": "hospital",
            "address": "123 Test Street",
            "city": "Mumbai",
            "state": "Maharashtra",
            "country": "India",
            "latitude": 19.0760,
            "longitude": 72.8777
        },
        "location": {
            "name": "Main Entrance",
            "location_type": "entrance"
        },
        "attribute": {
            "category": "mobility",
            "name": "ramp",
            "value": "yes",
            "value_type": "boolean"
        },
        "evidence": [{
            "evidence_text": "Concrete ramp observed",
            "source_type": "direct_observation",
            "source": {
                "source_type": "direct_observation",
                "source_name": "Site Visit Report"
            },
            "observed_at": "2024-01-15T00:00:00",
            "verification_status": "verified"
        }]
    }
    
    response = client.post("/api/v1/admin/import/validate/record", json=record)
    assert response.status_code == 200
    data = response.json()
    # Debug: print issues to see what error we have
    print(f"Issues: {data['issues']}")
    # Valid means no errors, but may have warnings
    assert data["issue_count"]["errors"] == 0


def test_validate_missing_venue_name(client: TestClient):
    """Test validation catches missing venue name."""
    record = {
        "venue": {
            "category": "hospital",
            "address": "123 Test Street",
            "city": "Mumbai",
            "state": "Maharashtra",
            "latitude": 19.0760,
            "longitude": 72.8777
        }
    }
    
    response = client.post("/api/v1/admin/import/validate/record", json=record)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert any("venue.name" in issue["field"] for issue in data["issues"])


def test_validate_invalid_coordinates(client: TestClient):
    """Test validation catches invalid coordinates."""
    record = {
        "venue": {
            "name": "Test Venue",
            "category": "hospital",
            "city": "Mumbai",
            "state": "Maharashtra",
            "latitude": 200,  # Invalid
            "longitude": 300  # Invalid
        }
    }
    
    response = client.post("/api/v1/admin/import/validate/record", json=record)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert any("latitude" in issue["field"] for issue in data["issues"])
    assert any("longitude" in issue["field"] for issue in data["issues"])


def test_validate_invalid_attribute_value(client: TestClient):
    """Test validation catches invalid attribute values."""
    record = {
        "venue": {
            "name": "Test Venue",
            "city": "Mumbai",
            "state": "Maharashtra",
            "latitude": 19.0760,
            "longitude": 72.8777
        },
        "attribute": {
            "attribute_name": "ramp",
            "value": "invalid_value"
        }
    }
    
    response = client.post("/api/v1/admin/import/validate/record", json=record)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert any("attribute.value" in issue["field"] for issue in data["issues"])


def test_validate_batch(client: TestClient):
    """Test batch validation."""
    records = [
        {
            "venue": {
                "name": "Valid Venue",
                "city": "Mumbai",
                "state": "Maharashtra",
                "latitude": 19.0760,
                "longitude": 72.8777
            }
        },
        {
            "venue": {
                "name": "Invalid Venue"
                # Missing required fields
            }
        }
    ]
    
    response = client.post("/api/v1/admin/import/validate", json=records)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert data["valid"] == 1
    assert data["invalid"] >= 1


def test_validate_empty_batch(client: TestClient):
    """Test validation of empty batch."""
    response = client.post("/api/v1/admin/import/validate", json=[])
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["valid"] == 0
    assert data["invalid"] == 0


def test_validate_duplicate_detection(client: TestClient):
    """Test duplicate venue detection."""
    records = [
        {
            "venue": {
                "name": "Same Hospital",
                "address": "123 Same St",
                "city": "Mumbai",
                "state": "Maharashtra",
                "latitude": 19.0760,
                "longitude": 72.8777
            }
        },
        {
            "venue": {
                "name": "Same Hospital",
                "address": "123 Same St",
                "city": "Mumbai",
                "state": "Maharashtra",
                "latitude": 19.0761,
                "longitude": 72.8778
            }
        }
    ]
    
    response = client.post("/api/v1/admin/import/validate", json=records)
    assert response.status_code == 200
    data = response.json()
    # Should detect at least one warning about possible duplicate
    assert data["duplicates"] >= 1 or any(
        "duplicate" in w.get("message", "").lower()
        for w in data.get("warnings_list", [])
    )


def test_validate_missing_evidence_warning(client: TestClient):
    """Test warning for missing evidence."""
    record = {
        "venue": {
            "name": "Test Venue",
            "city": "Mumbai",
            "state": "Maharashtra",
            "latitude": 19.0760,
            "longitude": 72.8777
        },
        "attribute": {
            "attribute_name": "ramp",
            "value": "unknown"
        }
        # No evidence
    }
    
    response = client.post("/api/v1/admin/import/validate/record", json=record)
    assert response.status_code == 200
    data = response.json()
    # Should have warnings about missing evidence
    assert data["issue_count"]["warnings"] > 0


def test_validate_ai_inference_not_verified(client: TestClient):
    """Test that AI inference cannot be marked as verified."""
    record = {
        "venue": {
            "name": "Test Venue",
            "city": "Mumbai",
            "state": "Maharashtra",
            "latitude": 19.0760,
            "longitude": 72.8777
        },
        "evidence": [{
            "evidence_text": "AI detected ramp",
            "source_type": "ai_inference",
            "verification_status": "verified"  # This should be flagged
        }]
    }
    
    response = client.post("/api/v1/admin/import/validate/record", json=record)
    assert response.status_code == 200
    data = response.json()
    # Should have error about AI inference being verified
    assert any(
        "ai inference" in issue.get("message", "").lower() or 
        "verified" in issue.get("message", "").lower()
        for issue in data["issues"]
    )


def test_validate_unknown_with_verification(client: TestClient):
    """Test that UNKNOWN value cannot be VERIFIED."""
    record = {
        "venue": {
            "name": "Test Venue",
            "city": "Mumbai",
            "state": "Maharashtra",
            "latitude": 19.0760,
            "longitude": 72.8777
        },
        "attribute": {
            "attribute_name": "ramp",
            "value": "unknown",
            "verification_status": "verified"  # Contradictory
        }
    }
    
    response = client.post("/api/v1/admin/import/validate/record", json=record)
    assert response.status_code == 200
    data = response.json()
    # Should have error about contradictory state
    assert any(
        "unknown" in issue.get("message", "").lower() or
        "contradictory" in issue.get("message", "").lower()
        for issue in data["issues"]
    )


def test_validate_positive_claim_without_evidence(client: TestClient):
    """Test that positive claims require evidence."""
    record = {
        "venue": {
            "name": "Test Venue",
            "city": "Mumbai",
            "state": "Maharashtra",
            "latitude": 19.0760,
            "longitude": 72.8777
        },
        "attribute": {
            "attribute_name": "ramp",
            "value": "yes"
            # No evidence provided
        },
        "evidence": []
    }
    
    response = client.post("/api/v1/admin/import/validate/record", json=record)
    assert response.status_code == 200
    data = response.json()
    # Should have error about positive claim without evidence
    assert data["valid"] is False


def test_validate_missing_coordinates_warning(client: TestClient):
    """Test warning for missing coordinates."""
    record = {
        "venue": {
            "name": "Test Venue",
            "address": "123 Test St",
            "city": "Mumbai",
            "state": "Maharashtra"
            # No coordinates
        }
    }
    
    response = client.post("/api/v1/admin/import/validate/record", json=record)
    assert response.status_code == 200
    data = response.json()
    # Should have warning about missing coordinates
    assert any(
        "coordinate" in issue.get("message", "").lower() or
        "geocoding" in issue.get("message", "").lower()
        for issue in data["issues"]
    )


def test_validate_source_reuse_warning(client: TestClient):
    """Test warning for missing source."""
    record = {
        "venue": {
            "name": "Test Venue",
            "city": "Mumbai",
            "state": "Maharashtra",
            "latitude": 19.0760,
            "longitude": 72.8777
        },
        "evidence": [{
            "evidence_text": "Observed ramp",
            "observed_at": "2024-01-15T00:00:00"
            # No source specified
        }]
    }
    
    response = client.post("/api/v1/admin/import/validate/record", json=record)
    assert response.status_code == 200
    data = response.json()
    # Should have warning about missing source
    assert any(
        "source" in issue.get("message", "").lower() or
        "provenance" in issue.get("message", "").lower()
        for issue in data["issues"]
    )
