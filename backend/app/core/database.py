"""Database configuration and session management."""

from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker, declarative_base

from app.core.config import get_settings

settings = get_settings()

# Determine engine configuration based on database URL
def get_engine():
    """Create engine based on configuration."""
    url = settings.database_url
    
    # SQLite configuration for testing
    if url.startswith("sqlite"):
        return create_engine(
            url,
            echo=settings.database_echo,
            connect_args={"check_same_thread": False}
        )
    
    # PostgreSQL configuration for production
    return create_engine(
        url,
        echo=settings.database_echo,
        pool_pre_ping=True,
        pool_recycle=300
    )

# Create engine
engine = get_engine()

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency for getting database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def db_session() -> Generator[Session, None, None]:
    """Context manager for database sessions."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
