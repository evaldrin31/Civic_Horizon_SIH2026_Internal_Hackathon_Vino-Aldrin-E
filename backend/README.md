# Accessibility Intelligence Platform - Backend

SIH 2026 - Evidence-backed venue-level accessibility intelligence platform.

## Quick Start

### Prerequisites

- Python 3.13+
- PostgreSQL 14+ (or Docker)

### Local Development Setup

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Set up database:**
   ```bash
   # Create database
   createdb aip
   
   # Run migrations
   cd ..
   alembic -c backend/alembic.ini upgrade head
   ```

5. **Run the server:**
   ```bash
   python run.py
   ```

The API will be available at `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Docker Setup

1. **Start with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Run migrations:**
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── core/                # Core configuration
│   │   ├── config.py        # Settings management
│   │   ├── database.py      # Database connection
│   │   ├── exceptions.py    # Custom exceptions
│   │   └── logging.py       # Logging configuration
│   ├── models/              # SQLAlchemy models
│   │   └── models.py        # Database entities
│   ├── schemas/             # Pydantic schemas
│   │   └── schemas.py       # Request/response validation
│   ├── routers/             # API route handlers
│   │   ├── venues.py        # Venue endpoints
│   │   ├── accessibility.py # Accessibility endpoints
│   │   ├── search.py        # Search endpoints
│   │   ├── evidence.py      # Evidence endpoints
│   │   └── import_routes.py # Import endpoints
│   ├── services/            # Business logic
│   │   ├── venue_service.py
│   │   ├── accessibility_service.py
│   │   ├── evidence_service.py
│   │   └── source_service.py
│   ├── middleware/          # Middleware
│   │   └── error_handlers.py
│   ├── import/              # Data import
│   │   └── importer.py
│   └── utils/               # Utilities
├── alembic/                 # Database migrations
│   ├── env.py
│   └── versions/
├── tests/                   # Test suite
│   ├── conftest.py
│   ├── test_venues.py
│   ├── test_accessibility.py
│   ├── test_evidence.py
│   ├── test_search.py
│   └── test_import.py
├── alembic.ini              # Alembic configuration
├── pytest.ini              # Pytest configuration
├── requirements.txt         # Python dependencies
├── Dockerfile               # Production image
├── Dockerfile.dev           # Development image
├── .env.example             # Environment template
└── run.py                   # Application runner
```

## Database Schema

The database supports:

- **Venues**: Core venue information with geospatial coordinates
- **Venue Locations**: Specific areas/entrances within venues
- **Accessibility Attributes**: Specific claims about accessibility
- **Evidence**: Proof backing accessibility claims
- **Sources**: Provenance and trust hierarchy
- **Verification History**: Audit trail of verification changes

See `../docs/DATA_SCHEMA.md` for detailed schema documentation.

## API Endpoints

See `../docs/API_CONTRACT.md` for complete API documentation.

Key endpoints:

- `GET /api/v1/venues` - List venues
- `GET /api/v1/venues/{id}` - Get venue details
- `GET /api/v1/venues/{id}/accessibility` - Get accessibility data
- `GET /api/v1/venues/{id}/evidence` - Get evidence
- `GET /api/v1/search` - Search venues
- `GET /api/v1/venues/nearby` - Nearby search
- `POST /api/v1/admin/import/records` - Import data

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_venues.py -v

# Run with verbose output
pytest -v
```

## Data Import

The backend supports importing structured records:

```json
{
  "venue": {...},
  "location": {...},
  "attribute": {...},
  "evidence": [...]
}
```

See `../docs/API_CONTRACT.md` for import format details.

## Technology Stack

- **Framework**: FastAPI 0.112
- **ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL 14+
- **Migrations**: Alembic
- **Testing**: pytest
- **Validation**: Pydantic 2.0

## Development Notes

### Schema Changes

When modifying models:

1. Update `app/models/models.py`
2. Generate migration: `alembic revision --autogenerate -m "description"`
3. Review generated migration
4. Apply: `alembic upgrade head`
5. Update tests
6. Update API_CONTRACT.md

### Adding New Endpoints

1. Create service in `app/services/`
2. Create router in `app/routers/`
3. Add schemas in `app/schemas/schemas.py`
4. Register router in `app/main.py`
5. Write tests
6. Update API_CONTRACT.md

## License

SIH 2026 Project
