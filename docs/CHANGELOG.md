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

## 2026-08-17 --- Research Data Ingestion Ready (OpenCode #1)

### Added

- **Research Record Validation:**
  - `ResearchRecordValidator` class with comprehensive validation rules
  - `POST /api/v1/admin/import/validate` - Dry-run batch validation
  - `POST /api/v1/admin/import/validate/record` - Single record validation
  - `ImportReport` with detailed statistics and issue tracking
  - `ValidationIssue` with severity levels (error/warning/info)
  - Quality rules for data validation
  - Evidence safety enforcement
  - Duplicate detection by venue name+address+city
  - Conflict detection framework

- **Validation Rules:**
  - ERROR: Missing required fields, invalid coordinates, invalid enums
  - ERROR: Evidence safety violations (positive claim without evidence, AI verified, unknown verified)
  - WARNING: Missing recommended fields, missing source, missing dates
  - WARNING: AI inference without corroboration, single-source evidence
  - INFO: General recommendations

- **Evidence Safety Principles:**
  - UNKNOWN never automatically becomes NO
  - AI INFERENCE ≠ OBSERVED FACT
  - NO EVIDENCE ≠ VERIFIED
  - Preserve uncertainty through API
  - Preserve conflicting observations

- **Data Directory Support:**
  - `data/research/` - Raw research output
  - `data/processed/` - Validated records
  - `data/verified/` - Verified records
  - `data/raw/` - Original source data

- **Documentation:**
  - `docs/IMPORT_WORKFLOW.md` - Complete import workflow guide
  - Research record templates
  - Validation examples
  - Troubleshooting guide

- **Tests:**
  - 13 new validation tests (100% passing)
  - Valid record validation
  - Missing required fields
  - Invalid coordinates
  - Invalid attribute values
  - Batch validation
  - Empty batch handling
  - Duplicate detection
  - Evidence safety rules
  - AI inference restrictions
  - Conflict detection
  - All 58 tests now passing (45 original + 13 new)

### Files Added

- `app/importers/validator.py` - Validation engine
- `tests/test_validation.py` - Validation test suite
- `docs/IMPORT_WORKFLOW.md` - Import workflow documentation

### Files Modified

- `app/routers/import_routes.py` - Added validation endpoints

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

## 2026-08-17 --- Interactive Map Integration Complete (OpenCode #2)

### Added

- **Map Provider Abstraction:**
  - Generic `MapProviderInstance` interface in `lib/map/types.ts`
  - Provider-agnostic types: `MapPosition`, `MapViewport`, `MapBounds`, `MapMarker`
  - Support for multiple providers (Google, Mapbox, Leaflet)
  - Easy to swap providers without changing application code

- **Google Maps Implementation:**
  - Full `GoogleMapsProvider` class implementing the abstraction
  - Dynamic script loading with error handling
  - Pan and zoom controls
  - Gesture handling (cooperative mode for mobile)
  - Automatic bounds fitting for search results

- **Interactive Map Features:**
  - Real interactive map with Google Maps JavaScript API
  - Pan: Click and drag to move around
  - Zoom: +/- buttons and scroll wheel
  - Markers: One per venue with selection state
  - Info Windows: Show venue summary on marker click
  - Map/List Toggle: Switch between map and list views
  - Responsive: Works on mobile, tablet, desktop

- **Marker/List Synchronization:**
  - Click marker → highlights venue in list
  - Click list item → centers map on marker
  - Selected venue visually distinguished on both map and list
  - Info window shows venue name and accessibility summary

- **Map States:**
  - Loading: Shows spinner while Google Maps initializes
  - Error: Shows error message with retry button if map fails
  - Empty: Shows "No venues" message when search returns nothing
  - Fallback: Automatically switches to list view if map unavailable
  - API Key Missing: Shows configuration error

- **Accessibility Features:**
  - Map has `aria-label` for screen readers
  - List view is always available as accessible alternative
  - All map functions available via list (no info trapped in map)
  - Keyboard navigation for venue list
  - Focus management for selected venues

- **Mobile Layout:**
  - Map/List toggle optimized for small screens
  - Touch-friendly buttons (min 44px)
  - Responsive height (works at 375px, 768px, 1024px+)
  - Zoom controls always visible

- **Map Configuration:**
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` environment variable
  - Configurable default center (defaults to center of India)
  - Configurable default zoom level
  - `NEXT_PUBLIC_DISABLE_MAP` option for accessibility

- **Testing:**
  - Comprehensive tests for `InteractiveMapView`
  - Mock Google Maps for Jest
  - Tests for loading, error, empty states
  - Tests for marker/list synchronization
  - Tests for keyboard accessibility
  - Tests for responsive behavior

### Technical Decisions

- **Google Maps JavaScript API:** Chosen for:
  - Excellent coverage in India
  - Free tier for development
  - Familiar UX for users
  - Good mobile support

- **Provider Abstraction:** Keeps map-specific code isolated:
  - Easy to switch to Mapbox if needed
  - Testable without real API
  - Consistent interface across providers

- **Cooperative Gesture Handling:** Prevents page scroll hijacking on mobile

- **List-First Fallback:** Ensures accessibility even when map fails

### Updated Files

```
frontend/
├── src/
│   ├── lib/
│   │   └── map/
│   │       ├── types.ts              # Map provider interface
│   │       └── providers/
│   │           └── google-maps.ts    # Google Maps implementation
│   ├── components/
│   │   ├── map/
│   │   │   ├── index.ts              # Map component exports
│   │   │   └── interactive-map.tsx   # Interactive map component
│   │   └── map-view.tsx              # Updated with backward compat
│   └── __tests__/
│       └── components/
│           └── map/
│               └── interactive-map.test.tsx
├── .env.example                       # Updated with map config
└── README.md                          # Updated map instructions
```

### Usage

1. **Get Google Maps API Key:**
   - Visit https://developers.google.com/maps/documentation/javascript/get-api-key
   - Create a project and enable JavaScript API
   - Copy the API key

2. **Configure Environment:**
   ```bash
   cp frontend/.env.example frontend/.env.local
   # Edit and add your API key:
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_key_here
   ```

3. **Run Development Server:**
   ```bash
   cd frontend
   npm run dev
   ```

### Map Features

| Feature | Status | Notes |
|---------|--------|-------|
| Pan | ✅ | Click and drag |
| Zoom | ✅ | Buttons and scroll |
| Markers | ✅ | One per venue |
| Marker Selection | ✅ | Bounces when selected |
| Info Window | ✅ | Shows venue summary |
| Map/List Toggle | ✅ | Responsive buttons |
| Marker → List Sync | ✅ | Click marker selects list item |
| List → Marker Sync | ✅ | Click list centers map |
| Bounds Fitting | ✅ | Auto-fit to search results |
| Mobile | ✅ | Touch-friendly |
| Accessibility | ✅ | List always available |
| Error Handling | ✅ | Retry button on failure |
| Loading State | ✅ | Spinner while loading |
| Empty State | ✅ | "No venues" message |

### Known Limitations

1. **API Key Required:** Map won't load without valid Google Maps API key
2. **No Clustering:** Many markers in same area overlap
3. **No Custom Markers:** Using default Google Maps markers
4. **No Geolocation:** "My location" button not yet implemented
5. **No Directions:** Can't get directions to venue yet

### Files Changed

- **New:**
  - `lib/map/types.ts`
  - `lib/map/providers/google-maps.ts`
  - `components/map/interactive-map.tsx`
  - `components/map/index.ts`
  - `__tests__/components/map/interactive-map.test.tsx`

- **Modified:**
  - `components/map-view.tsx` (backward compatibility)
  - `.env.example`
  - `docs/CHANGELOG.md`

### Git Commit

```
frontend: integrate real interactive map with Google Maps

- Add MapProvider abstraction for provider independence
- Implement GoogleMapsProvider with full feature set
- Create InteractiveMapView with pan, zoom, markers
- Add marker/list bidirectional synchronization
- Add info windows with venue summaries
- Add loading, error, empty states
- Add list fallback for accessibility
- Add mobile responsive layout
- Add comprehensive tests
- Update .env.example with map configuration
```

## 2026-08-17 --- Backend Test Failures Resolved (OpenCode #1)

### Fixed

**6 Test Failures Resolved:**

1. **test_accessibility_summary** - Route path ordering issue
   - Root cause: `/accessibility/summary` route was declared after `/accessibility/{attribute_id}`, causing FastAPI to match "summary" as an attribute_id
   - Fix: Moved `/accessibility/summary` route BEFORE parameterized routes
   - Files changed: `app/routers/accessibility.py`

2. **test_get_evidence** - Incorrect test expectation
   - Root cause: Test expected nested `attribute` object in evidence response, but API only provides `attribute_id`
   - Fix: Updated test to check for `attribute_id` instead of nested `attribute`
   - Decision: API_CONTRACT.md specifies `attribute_id` only, which is correct for avoiding N+1 queries
   - Files changed: `tests/test_evidence.py`

3. **test_evidence_with_source** - Missing inline source creation
   - Root cause: Evidence endpoint didn't support creating sources inline (only `source_id`)
   - Fix: 
     - Added `source: Optional[SourceCreate]` to `EvidenceCreate` schema
     - Updated `EvidenceService.create_evidence()` to handle inline source creation
     - Source is created or reused based on `source_name`
   - Files changed: `app/schemas/schemas.py`, `app/services/evidence_service.py`

4. **test_import_with_source** - Missing stats in single record response
   - Root cause: `/import/record` endpoint didn't include stats in response
   - Fix: Added `result["stats"] = importer.stats` to the single record import response
   - Files changed: `app/routers/import_routes.py`

5. **test_import_empty_records** - 500 error on empty list
   - Root cause: Import batch endpoint crashed when given empty list
   - Fix: Added early return with empty stats for empty input
   - Files changed: `app/routers/import_routes.py`

6. **test_get_venue_not_found** - Error response structure
   - Root cause: Test expected `data["error"]` but FastAPI wraps detail in `detail` key
   - Fix: Updated test to check `data["detail"]["error"]` to match actual response structure
   - Files changed: `tests/test_venues.py`

### Test Results

**Before:** 39 passed, 6 failed (86.7% pass rate)
**After:** 45 passed, 0 failed (100% pass rate)

### API Contract Changes

**No breaking changes to API contract.**

All fixes were either:
- Internal routing fixes (no API change)
- Test expectation updates (tests were incorrect)
- Addition of optional fields (backward compatible)
- Error response structure (matches standard FastAPI format)

### Verification

```bash
cd backend
python -m pytest tests/ -v
# Result: 45 passed, 192 warnings in 0.93s
```

## 2026-08-17 --- Frontend API Integration & Map Enhancements (OpenCode #2)

### Added

- **Real API Integration:**
  - Created `lib/hooks/use-data.ts` with data fetching hooks
  - `useVenueSearch()` - Searches venues with backend API fallback to demo data
  - `useNearbySearch()` - Nearby venue search with geolocation
  - `useVenueDetail()` - Fetches venue + attributes + evidence
  - `useGeolocation()` - Browser geolocation with error handling
  - Proper distinction between: `api` | `demo` | `error` | `loading` | `empty`

- **Data Source Transparency:**
  - Created `DataSourceIndicator` component
  - Shows "Live Data" / "Demo Data" / "Error" / "Loading" / "No Results" badges
  - Clear visual distinction between real and synthetic data
  - Users always know what data source they're viewing

- **Data Source Alert Component:**
  - Shows error messages with retry buttons
  - Shows demo data warnings
  - Shows empty state messages
  - Proper error recovery

- **Enhanced Google Maps:**
  - Added `setUserLocation()` method to provider
  - Added `panToUserLocation()` method
  - Added `getBounds()` method
  - Blue dot marker for user's current position
  - "My Location" button in map controls
  - Automatic pan to user location on request

- **Synthetic Demo Data:**
  - 3 demo venues with location-specific attributes
  - Main Entrance with coordinates
  - Ground Floor without coordinates
  - Multiple accessibility attributes (yes, no, unknown, partial)
  - Realistic evidence with verification states
  - Clearly labeled "DEMO DATA"

- **API Error Handling:**
  - Graceful fallback from API to demo data
  - Network error detection
  - HTTP error handling
  - Timeout handling
  - User-friendly error messages

### Technical Decisions

- **Hook-based Data Fetching:** Reusable hooks for consistent data loading
- **Source Tracking:** Every data fetch tracks its source for transparency
- **Demo as Fallback:** Never show fake data as real; always indicate source
- **Geolocation as Hook:** Encapsulates browser geolocation complexity

### Files Changed

**New:**
- `lib/hooks/use-data.ts` - Data fetching hooks
- `components/data-source-indicator.tsx` - Data source UI

**Modified:**
- `lib/map/providers/google-maps.ts` - User location methods
- `lib/map/types.ts` - Added user location interface
- `components/map/interactive-map.tsx` - My Location button

### Tests

```bash
npm test
# Result: 5 passed, 43 tests total
```

### Build

```bash
npm run build
# Result: ✓ Compiled successfully, 7 pages generated
```

### Usage

**My Location:**
```typescript
const { position, requestLocation } = useGeolocation();
// Click "My Location" button to center map on user
```

**Data Source Indicator:**
```typescript
<DataSourceIndicator source={dataSource} />
// Shows: Live Data / Demo Data / Error / Loading / No Results
```

**Search with API:**
```typescript
const { data, source, isLoading, error, search } = useVenueSearch();
// Automatically falls back to demo data on API error
```

### Next Steps

1. Integrate hooks into page components (Home, Nearby, Venue Detail)
2. Replace inline demo data with hook-based data fetching
3. Add loading skeletons for better UX
4. Enhance venue detail with location-specific display

## 2026-08-17 --- Project Bootstrap Complete
