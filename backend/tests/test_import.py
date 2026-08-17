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
