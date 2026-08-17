"""Tests for search functionality."""

import pytest
from fastapi.testclient import TestClient


def test_search_by_name(client: TestClient, sample_venue_data):
    client.post("/api/v1/venues", json=sample_venue_data)
    
    response = client.get("/api/v1/search?q=Hospital")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any("Hospital" in item["name"] for item in data["items"])


def test_search_with_filters(client: TestClient, sample_venue_data):
    client.post("/api/v1/venues", json=sample_venue_data)
    
    response = client.get("/api/v1/search?category=hospital&city=Mumbai")
    assert response.status_code == 200
    data = response.json()
    assert all(item["category"] == "hospital" for item in data["items"])
    assert all(item["city"] == "Mumbai" for item in data["items"])


def test_search_nearby(client: TestClient, sample_venue_data):
    client.post("/api/v1/venues", json=sample_venue_data)
    
    response = client.get("/api/v1/search?lat=19.0760&lon=72.8777&radius=1")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1


def test_search_pagination(client: TestClient):
    # Create multiple venues
    for i in range(5):
        venue_data = {
            "name": f"Test Venue {i}",
            "category": "test",
            "city": "Mumbai",
            "state": "Maharashtra",
            "latitude": 19.0,
            "longitude": 72.0
        }
        client.post("/api/v1/venues", json=venue_data)
    
    response = client.get("/api/v1/search?page=1&page_size=2")
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["page_size"] == 2
    assert len(data["items"]) == 2
    assert data["pages"] >= 3


def test_search_empty_results(client: TestClient):
    response = client.get("/api/v1/search?q=NonExistentVenueName12345")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []


def test_search_case_insensitive(client: TestClient, sample_venue_data):
    client.post("/api/v1/venues", json=sample_venue_data)
    
    response = client.get("/api/v1/search?q=hospital")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1


def test_search_by_state(client: TestClient, sample_venue_data):
    client.post("/api/v1/venues", json=sample_venue_data)
    
    response = client.get("/api/v1/search?state=Maharashtra")
    assert response.status_code == 200
    data = response.json()
    assert all(item["state"] == "Maharashtra" for item in data["items"])


def test_search_combined_filters(client: TestClient, sample_venue_data):
    client.post("/api/v1/venues", json=sample_venue_data)
    
    response = client.get("/api/v1/search?q=Hospital&category=hospital&city=Mumbai&state=Maharashtra")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert all(
        item["category"] == "hospital" and 
        item["city"] == "Mumbai" and
        item["state"] == "Maharashtra"
        for item in data["items"]
    )


def test_nearby_with_category_filter(client: TestClient):
    # Create hospital and restaurant at similar location
    hospital = {
        "name": "City Hospital",
        "category": "hospital",
        "city": "Mumbai",
        "state": "Maharashtra",
        "latitude": 19.0760,
        "longitude": 72.8777
    }
    restaurant = {
        "name": "City Restaurant",
        "category": "restaurant",
        "city": "Mumbai",
        "state": "Maharashtra",
        "latitude": 19.0761,
        "longitude": 72.8778
    }
    
    client.post("/api/v1/venues", json=hospital)
    client.post("/api/v1/venues", json=restaurant)
    
    response = client.get("/api/v1/search?lat=19.0760&lon=72.8777&radius=1&category=hospital")
    assert response.status_code == 200
    data = response.json()
    assert all(item["category"] == "hospital" for item in data["items"])
