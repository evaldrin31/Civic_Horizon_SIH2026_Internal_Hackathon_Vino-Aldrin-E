"""Tests for evidence APIs."""

import pytest
from fastapi.testclient import TestClient


def test_create_evidence(client: TestClient, sample_venue_data, sample_attribute_data, sample_evidence_data):
    venue_response = client.post("/api/v1/venues", json=sample_venue_data)
    venue_id = venue_response.json()["venue_id"]
    
    attr_data = {**sample_attribute_data, "venue_id": venue_id}
    attr_response = client.post(f"/api/v1/venues/{venue_id}/accessibility", json=attr_data)
    attribute_id = attr_response.json()["attribute_id"]
    
    evidence_data = {**sample_evidence_data, "attribute_id": attribute_id}
    response = client.post("/api/v1/evidence", json=evidence_data)
    assert response.status_code == 201
    data = response.json()
    assert data["attribute_id"] == attribute_id
    assert data["verification_status"] == "verified"
    assert data["confidence"] == 0.95


def test_get_evidence(client: TestClient, sample_venue_data, sample_attribute_data, sample_evidence_data):
    venue_response = client.post("/api/v1/venues", json=sample_venue_data)
    venue_id = venue_response.json()["venue_id"]
    
    attr_data = {**sample_attribute_data, "venue_id": venue_id}
    attr_response = client.post(f"/api/v1/venues/{venue_id}/accessibility", json=attr_data)
    attribute_id = attr_response.json()["attribute_id"]
    
    evidence_data = {**sample_evidence_data, "attribute_id": attribute_id}
    create_response = client.post("/api/v1/evidence", json=evidence_data)
    evidence_id = create_response.json()["evidence_id"]
    
    response = client.get(f"/api/v1/evidence/{evidence_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["evidence_id"] == evidence_id
    assert data["attribute_id"] == attribute_id


def test_get_venue_evidence(client: TestClient, sample_venue_data, sample_attribute_data, sample_evidence_data):
    venue_response = client.post("/api/v1/venues", json=sample_venue_data)
    venue_id = venue_response.json()["venue_id"]
    
    attr_data = {**sample_attribute_data, "venue_id": venue_id}
    attr_response = client.post(f"/api/v1/venues/{venue_id}/accessibility", json=attr_data)
    attribute_id = attr_response.json()["attribute_id"]
    
    evidence_data = {**sample_evidence_data, "attribute_id": attribute_id}
    client.post("/api/v1/evidence", json=evidence_data)
    
    response = client.get(f"/api/v1/venues/{venue_id}/evidence")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1


def test_evidence_verification_statuses(client: TestClient, sample_venue_data, sample_attribute_data):
    venue_response = client.post("/api/v1/venues", json=sample_venue_data)
    venue_id = venue_response.json()["venue_id"]
    
    attr_data = {**sample_attribute_data, "venue_id": venue_id}
    attr_response = client.post(f"/api/v1/venues/{venue_id}/accessibility", json=attr_data)
    attribute_id = attr_response.json()["attribute_id"]
    
    statuses = ["unverified", "reported", "corroborated", "verified", "conflicting", "outdated"]
    
    for status in statuses:
        evidence_data = {
            "attribute_id": attribute_id,
            "evidence_text": f"Test evidence for {status}",
            "verification_status": status
        }
        response = client.post("/api/v1/evidence", json=evidence_data)
        assert response.status_code == 201
        assert response.json()["verification_status"] == status


def test_update_evidence_verification(client: TestClient, sample_venue_data, sample_attribute_data, sample_evidence_data):
    venue_response = client.post("/api/v1/venues", json=sample_venue_data)
    venue_id = venue_response.json()["venue_id"]
    
    attr_data = {**sample_attribute_data, "venue_id": venue_id}
    attr_response = client.post(f"/api/v1/venues/{venue_id}/accessibility", json=attr_data)
    attribute_id = attr_response.json()["attribute_id"]
    
    evidence_data = {**sample_evidence_data, "attribute_id": attribute_id}
    create_response = client.post("/api/v1/evidence", json=evidence_data)
    evidence_id = create_response.json()["evidence_id"]
    
    update_data = {"verification_status": "corroborated"}
    response = client.patch(f"/api/v1/evidence/{evidence_id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["verification_status"] == "corroborated"


def test_evidence_with_source(client: TestClient, sample_venue_data, sample_attribute_data, sample_source_data):
    venue_response = client.post("/api/v1/venues", json=sample_venue_data)
    venue_id = venue_response.json()["venue_id"]
    
    attr_data = {**sample_attribute_data, "venue_id": venue_id}
    attr_response = client.post(f"/api/v1/venues/{venue_id}/accessibility", json=attr_data)
    attribute_id = attr_response.json()["attribute_id"]
    
    evidence_data = {
        "attribute_id": attribute_id,
        "evidence_text": "Evidence from official source",
        "source": sample_source_data
    }
    response = client.post("/api/v1/evidence", json=evidence_data)
    assert response.status_code == 201
    data = response.json()
    assert data["source"]["source_name"] == sample_source_data["source_name"]


def test_verification_history(client: TestClient, sample_venue_data, sample_attribute_data, sample_evidence_data):
    venue_response = client.post("/api/v1/venues", json=sample_venue_data)
    venue_id = venue_response.json()["venue_id"]
    
    attr_data = {**sample_attribute_data, "venue_id": venue_id}
    attr_response = client.post(f"/api/v1/venues/{venue_id}/accessibility", json=attr_data)
    attribute_id = attr_response.json()["attribute_id"]
    
    evidence_data = {**sample_evidence_data, "attribute_id": attribute_id}
    create_response = client.post("/api/v1/evidence", json=evidence_data)
    evidence_id = create_response.json()["evidence_id"]
    
    # Update verification status
    client.patch(f"/api/v1/evidence/{evidence_id}", json={"verification_status": "corroborated"})
    client.patch(f"/api/v1/evidence/{evidence_id}", json={"verification_status": "verified"})
    
    response = client.get(f"/api/v1/evidence/{evidence_id}/history")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    assert data[0]["new_status"] == "verified"


def test_evidence_not_found(client: TestClient):
    response = client.get("/api/v1/evidence/12345678-1234-1234-1234-123456789abc")
    assert response.status_code == 404
