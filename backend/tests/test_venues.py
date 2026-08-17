"""Tests for venue APIs."""

import pytest
from fastapi.testclient import TestClient


def test_create_venue(client: TestClient, sample_venue_data):
    response = client.post("/api/v1/venues", json=sample_venue_data)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == sample_venue_data["name"]
    assert data["category"] == sample_venue_data["category"]
    assert "venue_id" in data
    assert "created_at" in data


def test_get_venue(client: TestClient, sample_venue_data):
    create_response = client.post("/api/v1/venues", json=sample_venue_data)
    venue_id = create_response.json()["venue_id"]
    
    response = client.get(f"/api/v1/venues/{venue_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == sample_venue_data["name"]
    assert data["venue_id"] == venue_id


def test_get_venue_not_found(client: TestClient):
    response = client.get("/api/v1/venues/12345678-1234-1234-1234-123456789abc")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert data["detail"]["error"] == "NOT_FOUND"


def test_list_venues(client: TestClient, sample_venue_data):
    client.post("/api/v1/venues", json=sample_venue_data)
    
    response = client.get("/api/v1/venues")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1


def test_search_venues(client: TestClient, sample_venue_data):
    client.post("/api/v1/venues", json=sample_venue_data)
    
    response = client.get("/api/v1/venues/search?q=Hospital")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any("Hospital" in item["name"] for item in data["items"])


def test_search_by_city(client: TestClient, sample_venue_data):
    client.post("/api/v1/venues", json=sample_venue_data)
    
    response = client.get("/api/v1/venues/search?city=Mumbai")
    assert response.status_code == 200
    data = response.json()
    assert all(item["city"] == "Mumbai" for item in data["items"])


def test_nearby_venues(client: TestClient, sample_venue_data):
    client.post("/api/v1/venues", json=sample_venue_data)
    
    response = client.get("/api/v1/venues/nearby?lat=19.0760&lon=72.8777&radius=1")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1


def test_update_venue(client: TestClient, sample_venue_data):
    create_response = client.post("/api/v1/venues", json=sample_venue_data)
    venue_id = create_response.json()["venue_id"]
    
    update_data = {"name": "Updated Hospital Name"}
    response = client.patch(f"/api/v1/venues/{venue_id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Hospital Name"


def test_delete_venue(client: TestClient, sample_venue_data):
    create_response = client.post("/api/v1/venues", json=sample_venue_data)
    venue_id = create_response.json()["venue_id"]
    
    response = client.delete(f"/api/v1/venues/{venue_id}")
    assert response.status_code == 204
    
    get_response = client.get(f"/api/v1/venues/{venue_id}")
    assert get_response.status_code == 404


def test_venue_validation_error(client: TestClient):
    invalid_data = {"name": "Test"}  # Missing required fields
    response = client.post("/api/v1/venues", json=invalid_data)
    assert response.status_code == 422


def test_venue_invalid_coordinates(client: TestClient, sample_venue_data):
    invalid_data = {**sample_venue_data, "latitude": 100}
    response = client.post("/api/v1/venues", json=invalid_data)
    assert response.status_code == 422


def test_get_venue_with_details(client: TestClient, sample_venue_data):
    """Test the venue detail endpoint returns nested data for frontend."""
    # Create venue
    create_response = client.post("/api/v1/venues", json=sample_venue_data)
    venue_id = create_response.json()["venue_id"]
    
    # Get venue with details
    response = client.get(f"/api/v1/venues/{venue_id}/detail")
    assert response.status_code == 200
    data = response.json()
    
    # Check venue data
    assert data["name"] == sample_venue_data["name"]
    assert data["venue_id"] == venue_id
    
    # Check nested arrays exist (even if empty)
    assert "locations" in data
    assert "attributes" in data
    assert isinstance(data["locations"], list)
    assert isinstance(data["attributes"], list)


def test_get_venue_detail_not_found(client: TestClient):
    """Test venue detail returns 404 for non-existent venue."""
    response = client.get("/api/v1/venues/12345678-1234-1234-1234-123456789abc/detail")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert data["detail"]["error"] == "NOT_FOUND"
