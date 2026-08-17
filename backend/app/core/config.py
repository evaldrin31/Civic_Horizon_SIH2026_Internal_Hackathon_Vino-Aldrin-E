"""Application configuration."""

import os
from functools import lru_cache
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )
    
    # Application
    app_name: str = "Accessibility Intelligence Platform"
    app_version: str = "0.1.0"
    debug: bool = Field(default=False)
    
        # Database - supports PostgreSQL (production) and SQLite (testing)
    database_url: str = Field(default="sqlite:///./aip_test.db")
    database_echo: bool = Field(default=False)
    
    # API
    api_v1_prefix: str = "/api/v1"
    cors_origins: str = Field(default="http://localhost:3000,http://localhost:5173")
    
    # Pagination defaults
    default_page_size: int = 20
    max_page_size: int = 100
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins as list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
