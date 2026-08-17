"""Test configuration and fixtures."""

import os
import sys
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.core.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session) -> Generator[TestClient, None, None]:
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def sample_venue_data():
    return {
        "name": "Test Hospital",
        "category": "hospital",
        "address": "123 Test Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "official_url": "https://testhospital.com",
        "contact_phone": "+91-1234567890"
    }


@pytest.fixture
def sample_location_data():
    return {
        "name": "Main Entrance",
        "location_type": "entrance",
        "description": "Primary hospital entrance",
        "latitude": 19.0761,
        "longitude": 72.8778,
        "floor": "Ground"
    }


@pytest.fixture
def sample_attribute_data():
    return {
        "category": "mobility",
        "attribute_name": "ramp",
        "value": "yes",
        "value_type": "boolean",
        "notes": "Accessible ramp available"
    }


@pytest.fixture
def sample_evidence_data():
    return {
        "evidence_text": "Photograph shows concrete ramp with handrails",
        "verification_status": "verified",
        "confidence": 0.95,
        "collector": "test_collector",
        "notes": "Verified during site visit"
    }


@pytest.fixture
def sample_source_data():
    return {
        "source_type": "official_venue",
        "source_name": "Hospital Accessibility Report",
        "source_url": "https://testhospital.com/accessibility",
        "source_reference": "ACCESS-2024-001"
    }
