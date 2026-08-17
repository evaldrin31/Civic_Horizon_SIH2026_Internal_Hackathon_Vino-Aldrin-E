"""Source service layer."""

from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models.models import Source, SourceType
from app.schemas.schemas import SourceCreate


class SourceService:
    """Service for source operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_source(self, source_id: UUID) -> Source:
        """Get a source by ID."""
        source = self.db.query(Source).filter(Source.source_id == source_id).first()
        if not source:
            raise NotFoundException("Source", str(source_id))
        return source
    
    def get_source_by_name(self, name: str) -> Optional[Source]:
        """Get a source by name."""
        return self.db.query(Source).filter(Source.source_name == name).first()
    
    def list_sources(
        self,
        source_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Source], int]:
        """List sources with optional type filter."""
        query = self.db.query(Source)
        
        if source_type:
            try:
                st = SourceType(source_type)
                query = query.filter(Source.source_type == st)
            except ValueError:
                pass
        
        total = query.count()
        sources = query.order_by(Source.source_name).offset(skip).limit(limit).all()
        
        return sources, total
    
    def create_source(self, source_data: SourceCreate) -> Source:
        """Create a new source."""
        source = Source(**source_data.model_dump())
        self.db.add(source)
        self.db.commit()
        self.db.refresh(source)
        return source
    
    def get_or_create_source(self, source_data: SourceCreate) -> Source:
        """Get existing source by name or create new one."""
        existing = self.get_source_by_name(source_data.source_name)
        if existing:
            return existing
        return self.create_source(source_data)
    
    def delete_source(self, source_id: UUID) -> None:
        """Delete a source."""
        source = self.get_source(source_id)
        self.db.delete(source)
        self.db.commit()
