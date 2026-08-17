# Changelog

## 2026-08-17

### Added

-   Initial project control-center documentation.
-   Project plan and phased roadmap.
-   V1 architecture outline.
-   Draft accessibility data schema.
-   Evidence and verification policy.
-   Claude data research protocol.
-   Backend/frontend API boundary draft.
-   Multi-agent ownership rules.
-   Initial architecture/product decisions.

### Current status

Foundation documentation created.

## 2026-08-17 --- Backend Foundation Complete (OpenCode #1)

### Added

- **Backend Architecture:**
  - FastAPI-based REST API (Python 3.13)
  - Clean layered architecture: routers, services, models, schemas
  - Comprehensive error handling middleware
  - Structured logging configuration
  
- **Database Foundation:**
  - PostgreSQL with SQLAlchemy 2.0 ORM
  - Initial schema with 6 core tables:
    - `venues`: Core venue information with geospatial coordinates
    - `venue_locations`: Specific entrances/areas within venues
    - `accessibility_attributes`: Specific accessibility claims
    - `evidence`: Proof backing accessibility claims
    - `sources`: Provenance and trust hierarchy
    - `verification_history`: Audit trail of changes
  - PostgreSQL enums for controlled vocabularies
  - Proper indexes for common query patterns
  - Alembic migrations (reversible)

- **API Endpoints (V1 Implemented):**
  - `GET /api/v1/venues` - List venues with filters
  - `GET /api/v1/venues/{id}` - Get venue details
  - `POST /api/v1/venues` - Create venue
  - `PATCH /api/v1/venues/{id}` - Update venue
  - `DELETE /api/v1/venues/{id}` - Delete venue
  - `GET /api/v1/venues/search` - Text search
  - `GET /api/v1/venues/nearby` - Geospatial search
  - `GET /api/v1/search` - Unified search (text + location)
  - `GET /api/v1/venues/{id}/accessibility` - Get attributes
  - `POST /api/v1/venues/{id}/accessibility` - Create attribute
  - `GET /api/v1/venues/{id}/evidence` - Get venue evidence
  - `GET/POST/PATCH /api/v1/evidence` - Evidence CRUD
  - `GET /api/v1/evidence/{id}/history` - Verification history
  - `POST /api/v1/admin/import/record(s)` - Data import

- **Verification System:**
  - Six verification states: UNVERIFIED, REPORTED, CORROBORATED, VERIFIED, CONFLICTING, OUTDATED
  - Source hierarchy (8 levels from government to AI inference)
  - Verification history tracking
  - Conflict detection
  - Support for stale evidence identification

- **Data Import:**
  - Structured record import format
  - Venue deduplication (name + address + city)
  - Source auto-creation
  - Validation before write
  - Import statistics and error reporting
  - Never converts UNKNOWN to NO

- **Testing:**
  - pytest test suite with SQLite (in-memory)
  - Venue CRUD tests
  - Accessibility attribute tests
  - Evidence and verification tests
  - Search tests (text + nearby)
  - Import tests (validation, deduplication)

- **Documentation:**
  - Complete API_CONTRACT.md with request/response schemas
  - Backend README.md with setup instructions
  - Database schema documentation in migration

- **Development Setup:**
  - Docker and docker-compose configuration
  - .env.example for local development
  - .gitignore configured

### Technical Decisions

- **Python + FastAPI:** Chosen for rapid development, automatic OpenAPI docs, excellent data ecosystem
- **SQLAlchemy 2.0:** Modern async-capable ORM with migration support
- **PostgreSQL:** Production-grade with geospatial support potential
- **Pydantic 2.0:** Type-safe validation and serialization
- **Alembic:** Industry-standard migrations

### Current Limitations

1. **Confidence formula:** Not yet implemented (awaiting research)
2. **Geospatial queries:** Uses bounding box, not PostGIS
3. **Authentication:** Not implemented
4. **Rate limiting:** Not implemented
5. **Advanced search:** No fuzzy matching or relevance ranking
6. **Media handling:** URLs stored, not processed
7. **Background jobs:** No Celery/RQ for async processing

### Schema Decisions That May Need Revision

Per DATA_SCHEMA.md being a draft, the following may evolve:

1. **Attribute taxonomy:** Final attribute names may change after Claude's research
2. **Source hierarchy:** Additional source types may be needed
3. **Evidence structure:** May support structured extraction (AI/CV results)
4. **Venue locations:** May need additional location types
5. **Verification workflow:** May add automated verification states

### Next Recommended Step

1. **Set up PostgreSQL locally or with Docker:**
   ```bash
   docker-compose up -d db
   ```

2. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit with your database URL
   ```

4. **Run migrations:**
   ```bash
   alembic upgrade head
   ```

5. **Start the server:**
   ```bash
   python run.py
   ```

6. **Run tests:**
   ```bash
   pytest
   ```

7. **Wait for Claude's research** to begin importing real accessibility data

8. **Coordinate with frontend agent** for API integration

### Files Created

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── exceptions.py
│   │   └── logging.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── models.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── schemas.py
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── venues.py
│   │   ├── accessibility.py
│   │   ├── search.py
│   │   ├── evidence.py
│   │   └── import_routes.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── venue_service.py
│   │   ├── accessibility_service.py
│   │   ├── evidence_service.py
│   │   └── source_service.py
│   ├── middleware/
│   │   ├── __init__.py
│   │   └── error_handlers.py
│   ├── import/
│   │   ├── __init__.py
│   │   └── importer.py
│   └── utils/
│       └── __init__.py
├── alembic/
│   ├── __init__.py
│   ├── env.py
│   ├── versions/
│   │   ├── __init__.py
│   │   └── 001_initial_schema.py
│   └── alembic.ini
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_venues.py
│   ├── test_accessibility.py
│   ├── test_evidence.py
│   ├── test_search.py
│   └── test_import.py
├── Dockerfile
├── Dockerfile.dev
├── requirements.txt
├── pytest.ini
├── .env.example
├── .gitignore
└── README.md
```

### Git Commits

Suggested commits for this work:
1. `backend: initialize FastAPI project structure`
2. `database: add initial schema and migrations`
3. `api: implement venue, accessibility, and evidence endpoints`
4. `data: add import foundation with validation`
5. `test: add comprehensive backend test suite`
6. `docs: update API_CONTRACT with actual schemas`
7. `dev: add Docker and local development setup`

### Current Status

Backend foundation is complete and ready for:
- Integration with Claude's research data
- Frontend API integration
- Further enhancement based on SIH requirements

## 2026-08-17 --- Frontend Foundation Complete (OpenCode #2)

### Added

- **Frontend Technology Stack:**
  - Next.js 14 with App Router (React 18)
  - TypeScript for type safety
  - Tailwind CSS for styling
  - Radix UI primitives for accessibility
  - Lucide React for icons

- **API Integration:**
  - Complete TypeScript types matching API_CONTRACT.md
  - Centralized API client layer (`lib/api/client.ts`)
  - Type-safe API methods for all endpoints
  - Error handling with custom ApiClientError class

- **UI Components:**
  - Button, Input, Textarea, Badge, Card primitives
  - Select and Dialog components (Radix-based)
  - All components follow accessibility best practices

- **Core Components:**
  - `VenueCard` - Reusable venue display with accessibility summary
  - `SearchBar` - Venue search with filters and "nearby" functionality
  - `MapView` - Map + list experience (placeholder for real map)
  - `AccessibilityAttributeList` - Display accessibility info by category
  - `Evidence` - Evidence display with verification status
  - `VerificationBadge` - Visual verification state indicators
  - `ReportForm` - User report/correction flow

- **Pages:**
  - Home (`/`) - Search, map, venue discovery
  - Venue Detail (`/venues/[id]`) - Detailed accessibility information
  - Nearby (`/nearby`) - Geolocation-based venue discovery
  - About (`/about`) - Platform explanation and verification guide

- **Layout:**
  - Responsive header with navigation
  - Skip-to-content link for keyboard navigation
  - Footer with project status
  - Mobile-responsive navigation

- **Accessibility Implementation:**
  - Semantic HTML throughout
  - Proper heading hierarchy
  - ARIA labels and roles where needed
  - Keyboard navigation support
  - Focus management
  - Reduced motion preferences support
  - High contrast mode support
  - Screen reader friendly structure

- **Responsive Design:**
  - Mobile-first approach
  - Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
  - Responsive grid layouts
  - Touch-friendly interactions

- **Demo Data:**
  - Clearly marked demo venues and data
  - No fake real-world accessibility claims
  - "DEMO DATA" labels throughout UI
  - Falls back to demo data when API unavailable

- **Testing:**
  - Jest test runner configured
  - React Testing Library for component tests
  - Tests for verification badge rendering
  - Tests for accessibility attribute formatting
  - Tests for API client methods
  - Tests for utility functions

- **Configuration:**
  - `next.config.mjs` with image domains
  - `tailwind.config.ts` with custom theme
  - `.env.example` for environment variables
  - `jest.config.js` for test configuration

### Technical Decisions

- **Next.js 14 + App Router:** Modern React framework with server components, automatic optimization
- **TypeScript:** Type safety for API contracts and component props
- **Tailwind CSS:** Utility-first CSS for rapid development, built-in responsive design
- **Radix UI:** Unstyled, accessible primitives as foundation for custom components
- **Client-side data fetching:** Using SWR pattern via useEffect + fetch for flexibility

### Current Limitations

1. **Map integration:** Placeholder implementation - real map provider pending
2. **Authentication:** User authentication not implemented
3. **Real-time updates:** No WebSocket or server-sent events
4. **Image handling:** No venue image upload/display
5. **Advanced search:** No autocomplete or fuzzy matching
6. **Offline support:** No service worker or offline capabilities

### Known Issues

1. API client falls back to demo data when backend unavailable (by design)
2. Map placeholder is simplified visual representation
3. Report form connects to mock API (real endpoint pending)

### Files Created

```
frontend/
├── src/
│   ├── app/
│   │   ├── globals.css           # Global styles with CSS variables
│   │   ├── layout.tsx            # Root layout with metadata
│   │   ├── page.tsx              # Home page with search
│   │   ├── venues/
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Venue detail page
│   │   ├── nearby/
│   │   │   └── page.tsx          # Nearby venues page
│   │   └── about/
│   │       └── page.tsx          # About page
│   ├── components/
│   │   ├── ui/                   # Base UI primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── select.tsx
│   │   │   └── dialog.tsx
│   │   ├── layout.tsx            # Header, Footer
│   │   ├── venue-card.tsx        # Venue card components
│   │   ├── search-bar.tsx        # Search with filters
│   │   ├── map-view.tsx          # Map + list view
│   │   ├── accessibility-attributes.tsx
│   │   ├── evidence.tsx
│   │   ├── verification-badge.tsx
│   │   └── report-form.tsx
│   ├── lib/
│   │   ├── utils.ts              # Utility functions
│   │   └── api/
│   │       ├── types.ts          # TypeScript API types
│   │       └── client.ts         # API client
│   └── __tests__/
│       ├── components/
│       │   ├── verification-badge.test.tsx
│       │   └── accessibility-attributes.test.tsx
│       └── lib/
│           ├── api/
│           │   └── client.test.ts
│           └── utils.test.ts
├── jest.config.js
├── jest.setup.ts
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

### Git Commits

Suggested commits for this work:
1. `frontend: initialize Next.js with TypeScript and Tailwind`
2. `frontend: add API types and client matching API contract`
3. `frontend: add base UI components and layout`
4. `frontend: add venue card and search components`
5. `frontend: add accessibility and evidence components`
6. `frontend: add map view and report form`
7. `frontend: add all pages and routing`
8. `test: add component and utility tests`
9. `docs: update CHANGELOG with frontend implementation`

### Current Status

Frontend foundation is complete and ready for:
- Backend API integration (when backend is running)
- Real accessibility data import from Claude's research
- Map provider integration
- Authentication implementation
- User testing and feedback

### Next Recommended Steps

1. **Start the development server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Run tests:**
   ```bash
   npm test
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Wait for backend to be running**, then update `NEXT_PUBLIC_API_URL`

5. **Wait for Claude's research data** to replace demo data

6. **Add map provider** (Mapbox/Google Maps) credentials when available

## 2026-08-17 --- Project Bootstrap Complete
