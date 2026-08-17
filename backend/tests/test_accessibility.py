"""Tests for accessibility attribute APIs."""

import pytest
from fastapi.testclient import TestClient


def test_create_accessibility_attribute(client: TestClient, sample_venue_data, sample_attribute_data):
    venue_response = client.post("/api/v1/venues", json=sample_venue_data)
    venue_id = venue_response.json()["venue_id"]
    
    attr_data = {**sample_attribute_data, "venue_id": venue_id}
    response = client.post(f"/api/v1/venues/{venue_id}/accessibility", json=attr_data)
    assert response.status_code == 201
    data = response.json()
    assert data["attribute_name"] == sample_attribute_data["attribute_name"]
    assert data["venue_id"] == venue_id


def test_get_venue_accessibility(client: TestClient, sample_venue_data, sample_attribute_data):
    venue_response = client.post("/api/v1/venues", json=sample_venue_data)
    venue_id = venue_response.json()["venue_id"]
    
    attr_data = {**sample_attribute_data, "venue_id": venue_id}
    client.post(f"/api/v1/venues/{venue_id}/accessibility", json=attr_data)
    
    response = client.get(f"/api/v1/venues/{venue_id}/accessibility")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any(item["attribute_name"] == "ramp" for item in data["items"])


def test_get_accessibility_by_category(client: TestClient, sample_venue_data, sample_attribute_data):
    venue_response = client.post("/api/v1/venues", json=sample_venue_data)
    venue_id = venue_response.json()["venue_id"]
    
    attr_data = {**sample_attribute_data, "venue_id": venue_id}
    client.post(f"/api/v1/venues/{venue_id}/accessibility", json=attr_data)
    
    response = client.get(f"/api/v1/venues/{venue_id}/accessibility?category=mobility")
    assert response.status_code == 200
    data = response.json()
    assert all(item["category"] == "mobility" for item in data["items"])


def test_accessibility_attribute_values(client: TestClient, sample_venue_data):
    venue_response = client.post("/api/v1/venues", json=sample_venue_data)
    venue_id = venue_response.json()["venue_id"]
    
    for value in ["yes", "no", "unknown", "partial"]:
        attr_data = {
            "venue_id": venue_id,
            "category": "mobility",
            "attribute_name": f"test_attr_{value}",
            "value": value
        }
        response = client.post(f"/api/v1/venues/{venue_id}/accessibility", json=attr_data)
        assert response.status_code == 201
        assert response.json()["value"] == value


def test_invalid_attribute_value(client: TestClient, sample_venue_data):
    venue_response = client.post("/api/v1/venues", json=sample_venue_data)
    venue_id = venue_response.json()["venue_id"]
    
    attr_data = {
        "venue_id": venue_id,
        "category": "mobility",
        "attribute_name": "ramp",
        "value": "invalid_value"
    }
    response = client.post(f"/api/v1/venues/{venue_id}/accessibility", json=attr_data)
    assert response.status_code == 422


def test_update_accessibility_attribute(client: TestClient, sample_venue_data, sample_attribute_data):
    venue_response = client.post("/api/v1/venues", json=sample_venue_data)
    venue_id = venue_response.json()["venue_id"]
    
    attr_data = {**sample_attribute_data, "venue_id": venue_id}
    create_response = client.post(f"/api/v1/venues/{venue_id}/accessibility", json=attr_data)
    attribute_id = create_response.json()["attribute_id"]
    
    update_data = {"value": "no", "notes": "Updated notes"}
    response = client.patch(f"/api/v1/venues/{venue_id}/accessibility/{attribute_id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["value"] == "no"
    assert data["notes"] == "Updated notes"


def test_delete_accessibility_attribute(client: TestClient, sample_venue_data, sample_attribute_data):
    venue_response = client.post("/api/v1/venues", json=sample_venue_data)
    venue_id = venue_response.json()["venue_id"]
    
    attr_data = {**sample_attribute_data, "venue_id": venue_id}
    create_response = client.post(f"/api/v1/venues/{venue_id}/accessibility", json=attr_data)
    attribute_id = create_response.json()["attribute_id"]
    
    response = client.delete(f"/api/v1/venues/{venue_id}/accessibility/{attribute_id}")
    assert response.status_code == 204
    
    get_response = client.get(f"/api/v1/venues/{venue_id}/accessibility/{attribute_id}")
    assert get_response.status_code == 404


def test_accessibility_summary(client: TestClient, sample_venue_data, sample_attribute_data):
    venue_response = client.post("/api/v1/venues", json=sample_venue_data)
    venue_id = venue_response.json()["venue_id"]
    
    attr_data = {**sample_attribute_data, "venue_id": venue_id}
    client.post(f"/api/v1/venues/{venue_id}/accessibility", json=attr_data)
    
    response = client.get(f"/api/v1/venues/{venue_id}/accessibility/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_attributes" in data
    assert "by_category" in data
    assert "by_value" in data
