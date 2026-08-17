# Integration Audit

## 1. Overall Assessment
- **Current Maturity**: **Alpha**. The backend service foundation is mostly functional with passing unit tests, and the frontend matches the visual requirements of the project. However, the system is not yet integrated: several core pages still render deprecated static mock components instead of the interactive Google Maps, and critical key-name mismatches between the validation and import layers prevent the ingestion of real research data.
- **Major Strengths**:
  - The API contract is well-documented in [`docs/API_CONTRACT.md`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/docs/API_CONTRACT.md).
  - Robust evidence safety constraints are conceptually established (e.g. AI inference cannot be marked as verified, unknown cannot be verified).
  - A clean provider-agnostic map abstraction structure (`MapProviderInstance` and `GoogleMapsProvider`) is prepared.
  - The backend validation unit tests run and pass.
- **Major Risks**:
  - **Divergence of documentation templates from code logic**: Ingesting files matching the official templates crashes the server because the importer expects database-specific keys (`attribute_name`, `location_type`) instead of the documented keys (`name`, `type`).
  - **Bypassed features**: Crucial endpoints like the venue details fetcher (`/venues/{id}/detail`) and filters like `has_accessible_entrance` are bypassed or unimplemented by the frontend and services.
  - **No Security**: Absolute lack of authentication/authorization on any CRUD or admin data-modification endpoints.

---

## 2. Critical Issues
*These are issues that will materially break the MVP.*

### CRITICAL ISSUE 1: Importer Key Mismatch crashes Location Imports (`type` vs `location_type`)
- **Issue**: The data template defines location types using the key `type`, but the database model and importer logic expect the key `location_type`.
- **Evidence**: 
  - [`DATA_RECORD_TEMPLATE.json:L14`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/docs/DATA_RECORD_TEMPLATE.json#L14): Defines `"type": ""` in location.
  - [`models.py:L94`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/backend/app/models/models.py#L94): Defines `location_type = Column(String(100), nullable=False)`.
  - [`importer.py:L180-L183`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/backend/app/importers/importer.py#L180-L183):
    ```python
    location = VenueLocation(
        venue_id=venue.venue_id,
        **location_data
    )
    ```
- **Impact**: Any research data containing a `location` object conforming to the official template will fail on import with a SQLAlchemy `TypeError: 'type' is an invalid keyword argument for VenueLocation`, rolling back the transaction.
- **Recommended Fix**: Update [`importer.py`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/backend/app/importers/importer.py) to check for and rename the `type` key to `location_type` inside the `location_data` dict before building the model, or standardize the JSON schema to use `location_type`.
- **Assignee**: **OpenCode #1** (Backend)

### CRITICAL ISSUE 2: Dry-run validation vs Importer Key Mismatch (`name` vs `attribute_name`)
- **Issue**: The dry-run validation engine checks for the key `name` inside the attribute object, whereas the importer requires `attribute_name`.
- **Evidence**:
  - [`validator.py:L315-L322`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/backend/app/importers/validator.py#L315-L322):
    ```python
    if not attribute.get("name"):
        issues.append(ValidationIssue(..., field="attribute.name", ...))
    ```
  - [`importer.py:L79-L80`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/backend/app/importers/importer.py#L79-L80):
    ```python
    if "attribute_name" not in attr_data:
        raise ImportException("Attribute missing 'attribute_name'", index)
    ```
- **Impact**: Researched records complying with the official template (which uses `name`) will return `valid: true` with 0 errors via the dry-run `/validate` endpoint, but will instantly fail when sent to the `/import/records` endpoint with a `ValidationException` / `ImportException`.
- **Recommended Fix**: Align `validator.py` and `importer.py` to check for the same key. The importer should map `name` to `attribute_name` if transforming research JSON inputs.
- **Assignee**: **OpenCode #1** (Backend)

### CRITICAL ISSUE 3: Pages render deprecated CSS mock Map instead of Interactive Google Maps
- **Issue**: All user-facing pages import `MapView` from [`components/map-view.tsx`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/frontend/src/components/map-view.tsx), which renders the static, deprecated pure-CSS `MapPlaceholder` component instead of `InteractiveMapView`.
- **Evidence**:
  - [`page.tsx:L6`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/frontend/src/app/page.tsx#L6) (Home page), [`nearby/page.tsx:L5`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/frontend/src/app/nearby/page.tsx#L5), and [`venues/[id]/page.tsx:L15`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/frontend/src/app/venues/%5Bid%5D/page.tsx#L15): All import `MapView` from `@/components/map-view`.
  - [`components/map-view.tsx:L166-L208`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/frontend/src/components/map-view.tsx#L166-L208): Explicitly initializes and returns `MapPlaceholder` (marked as `@deprecated`) instead of `InteractiveMapView`.
- **Impact**: Google Maps is never loaded or rendered for users. The entire map experience is a non-functional CSS grid mock.
- **Recommended Fix**: Update all page imports to reference the interactive map component `@/components/map` (or update `map-view.tsx` to directly re-export `InteractiveMapView` as `MapView` and delete the deprecated placeholder).
- **Assignee**: **OpenCode #2** (Frontend)

---

## 3. High-Priority Issues

### HIGH-PRIORITY ISSUE 1: Evidence import passes validation but crashes database if attribute is absent
- **Issue**: `validator.py` does not verify if an `attribute` block exists when an `evidence` list is provided, but `importer.py` creates evidence records linked to a null `attribute_id`.
- **Evidence**:
  - [`models.py:L167`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/backend/app/models/models.py#L167): `attribute_id` on the `Evidence` model is `nullable=False`.
  - [`validator.py:L142-L149`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/backend/app/importers/validator.py#L142-L149): Validates `evidence` list without asserting `attribute` is present.
- **Impact**: If research data contains evidence but lacks an attribute block, validation passes, but the importer rolls back with a database integrity constraint violation.
- **Recommended Fix**: Add a check in `_check_evidence_safety` in `validator.py` to ensure that `attribute` is present if `evidence` is provided.
- **Assignee**: **OpenCode #1** (Backend)

### HIGH-PRIORITY ISSUE 2: Page details bypass optimized Detail endpoint, forcing N+1 API calls
- **Issue**: The optimized backend `/api/v1/venues/{venue_id}/detail` query is bypassed. The frontend details page makes three separate API calls.
- **Evidence**:
  - [`venues/[id]/page.tsx:L171-L175`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/frontend/src/app/venues/%5Bid%5D/page.tsx#L171-L175):
    ```typescript
    const [venueData, attributesData, evidenceData] = await Promise.all([
      venuesApi.getById(venueId),
      accessibilityApi.getForVenue(venueId).then(r => r.items),
      evidenceApi.getForVenue(venueId).then(r => r.items),
    ]);
    ```
- **Impact**: Unnecessary HTTP requests, slower client load times, and database overhead.
- **Recommended Fix**: Add the `detail` endpoint to [`client.ts`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/frontend/src/lib/api/client.ts) and call it on the detail page to load all data in a single request.
- **Assignee**: **OpenCode #2** (Frontend)

### HIGH-PRIORITY ISSUE 3: Venue Search Results completely exclude Accessibility Summaries
- **Issue**: Backend search and nearby endpoints return `VenueResponse` objects that lack accessibility summaries.
- **Evidence**:
  - [`search.py:L19`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/backend/app/routers/search.py#L19): Response model is `VenueListResponse`, which lists flat `VenueResponse`.
  - [`page.tsx:L305-L310`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/frontend/src/app/page.tsx#L305-L310): The search result cards rely on local hardcoded `DEMO_ATTRIBUTES` and `DEMO_EVIDENCE` mapped to the venue ID.
- **Impact**: Any real venue returned by the database search will show "0 accessible features" and "No data available" on the home page list, rendering the search cards useless for comparing accessibility features at a glance.
- **Recommended Fix**: Extend `VenueResponse` to include an optional `accessibility_summary` structure, and load these counts in `VenueService` when searching.
- **Assignee**: **OpenCode #1** & **OpenCode #2**

### HIGH-PRIORITY ISSUE 4: Geolocation-based Search Filters (has_accessible_entrance) are ignored
- **Issue**: The contract lists accessibility search filters, but they are not implemented in the service layer or routers.
- **Evidence**:
  - [`schemas.py:L270`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/backend/app/schemas/schemas.py#L270): Declares `has_accessible_entrance`.
  - [`venue_service.py:L75-L89`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/backend/app/services/venue_service.py#L75-L89): `search_venues` and `get_nearby_venues` ignore this parameter.
- **Impact**: Users cannot search or filter for venues that are actually accessible.
- **Recommended Fix**: Implement standard SQL joins in `VenueService` to filter results based on their accessibility attributes.
- **Assignee**: **OpenCode #1** (Backend)

### HIGH-PRIORITY ISSUE 5: VenueLocation interface field mismatch between Frontend and Backend
- **Issue**: The backend database returns `location_type` but the frontend TypeScript interface declares `type`, causing property access to resolve to `undefined`.
- **Evidence**:
  - [`types.ts:L47`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/frontend/src/lib/api/types.ts#L47): Interface `VenueLocation` defines `type: string`.
  - [`location-based-attributes.tsx:L155`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/frontend/src/components/location-based-attributes.tsx#L155):
    ```typescript
    const locationType = location.type || "area";
    ```
- **Impact**: Location types returned from the API default to `"area"` in the UI. Incorrect icons (e.g. MapPin instead of DoorOpen for entrances) are displayed on the details page.
- **Recommended Fix**: Standardize on `location_type` across the TypeScript interface and the rendering components.
- **Assignee**: **OpenCode #2** (Frontend)

---

## 4. Medium-Priority Improvements

### MEDIUM-PRIORITY 1: Haversine Bounding Box polar safety
- **Issue**: Standard Haversine coordinates calculations in [`venue_service.py:L108`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/backend/app/services/venue_service.py#L108) could result in a `ZeroDivisionError` at the poles due to `cos(radians(latitude))` approaching 0.
- **Impact**: Theoretical service crash, though highly unlikely given the target scope (India, lat 8 to 37).
- **Recommended Fix**: Clamp `abs(cos(radians(latitude)))` to a small minimum float value (e.g. `1e-9`).
- **Assignee**: **OpenCode #1**

### MEDIUM-PRIORITY 2: Demo data fallback in production environments
- **Issue**: On backend network failure, the frontend client falls back to synthetic demo data without warning the user that live endpoints are unreachable.
- **Impact**: Confusing UX; fake locations may appear to a user if the backend goes down briefly.
- **Recommended Fix**: Check `process.env.NODE_ENV` to only permit demo data fallback in development/test setups.
- **Assignee**: **OpenCode #2**

---

## 5. Backend ↔ Frontend Contract Audit

| Endpoint | Contract Schema | Implemented Model | Status / Mismatch |
|---|---|---|---|
| `GET /api/v1/venues/{id}/detail` | Nested locations, attributes, and evidence | Flat venue + nested data | **Bypassed by Frontend**. The frontend makes 3 separate calls instead of this optimized endpoint. |
| `POST /api/v1/admin/import/record` | JSON with `location.type` & `attribute.name` | Expects DB-compatible keys | **Broken**. Mismatch on `type`/`location_type` and `name`/`attribute_name` causes runtime crashes. |
| `GET /api/v1/venues/search` | Can filter by accessibility parameters | Ignores filter params | **Unimplemented filter parameters** in backend service layers. |

---

## 6. Map Architecture Audit
- **Provider Abstraction Quality**: High. The split between `MapProviderInstance` and `GoogleMapsProvider` keeps map logic isolated.
- **API Key Handling**: High. Configured via `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- **Initialization & Lifecycle**: High. Includes retry controls, loading spin states, and coordinates error boundary logic.
- **Marker / List Sync**: The sync works inside `InteractiveMapView` itself, but the pages separate the map component from the primary search result list cards, meaning list items outside the map block do not highlight on marker click.
- **Entrance-level support**: High. The database structure `VENUE` → `LOCATION/ENTRANCE` → `ATTRIBUTE` natively supports entrance coordinates. The map can query and draw sub-markers for locations if updated in the future.

---

## 7. Data Integrity & Evidence Safety Audit
- **Unverified vs Observed Fact**: Checked. Validation rules correctly prevent AI inferences from being verified.
- **Uncertainty preservation**: Yes. `UNKNOWN` is treated as a valid state and is never mapped to `NO`.
- **Provenance preservation**: Correct. Sources are saved and reused based on unique names, maintaining integrity.
- **Conflicting evidence**: Backend `get_evidence_conflicts` correctly flags contradictory claims. However, `validator.py` should warn researchers if they are overwriting conflict states on import.

---

## 8. Accessibility UX Audit
- **Semantic HTML**: High. Skip-to-content links, ARIA roles, and keyboard navigation are well-formed.
- **Color contrast**: High contrast preferences are supported.
- **Tap Targets**: Large tap targets (min 44px) are implemented.
- **Fallback**: The list mode acts as a robust text fallback when maps fail.

---

## 9. Security Audit
- **VULNERABILITY: No Authentication or Authorization**: There are no auth/API key protections on any endpoint. Anyone can create, edit, delete venues, or post imports.
- **API Key restriction**: The client-side Google Maps API key must be restricted via the Google Cloud Console to prevent misuse.

---

## 10. Testing Gaps
- **Validation + Import Integration Tests**: The existing tests mock validation and import in isolation, which is why the key name mismatches (`type` / `location_type` and `name` / `attribute_name`) went unnoticed. A test should run the validator on a payload, then immediately feed the validated payload to the importer.
- **Geospatial queries on PostgreSQL**: Tests run on SQLite, which doesn't validate how PostgreSQL index scans will perform under load without PostGIS spatial indexes.

---

## 11. Production Readiness Gaps
- **Missing Database Migrations**: Ensure Alembic migrations are compiled and verified against a live PostgreSQL instance (not just SQLite).
- **No Rate Limiting**: The API is vulnerable to scraping and denial-of-service.
- **No Input Sanitization**: Vulnerable to script injection on `evidence_text` and `notes` fields.

---

## 12. Recommended Next Actions

### OpenCode #1 Tasks (Backend)
1. Update [`importer.py`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/backend/app/importers/importer.py) to accept `type` and map it to `location_type` under the location block, and map `name` to `attribute_name` under the attribute block.
2. Synchronize [`validator.py`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/backend/app/importers/validator.py) quality checks to ensure they validate the same keys.
3. Update `validator.py` to enforce that an `attribute` block must accompany any `evidence` list to avoid database constraint failures.
4. Implement `has_accessible_entrance` filtering inside `VenueService`.
5. Add basic token-based authentication for Admin import routes.

### OpenCode #2 Tasks (Frontend)
1. Update homepage, nearby page, and venue detail page imports to import `MapView` from `@/components/map` (or update `map-view.tsx` to re-export `InteractiveMapView`) to enable the real Google Maps integration.
2. Update the `VenueLocation` interface and usage in `LocationBasedAttributes.tsx` to reference `location_type` instead of `type`.
3. Add the `/venues/{id}/detail` query to [`client.ts`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/frontend/src/lib/api/client.ts) and fetch details via a single API request on the detail page.
4. Update search cards to request and display venue summaries instead of defaulting to hardcoded demo data.

### Research-Dependent Tasks
1. Claude to structure the raw research records matching [`DATA_RECORD_TEMPLATE.json`](file:///C:/Users/Vino%20Aldrin/Desktop/SIH/docs/DATA_RECORD_TEMPLATE.json).
2. Establish a clear coordinate acquisition protocol to capture exact entrances without fabricating positions.

---

## FINAL VERDICT

**READY WITH FIXES**

*The core layout, database models, and interactive map components are developed and functionally verified in unit tests. However, the system cannot be deployed or integrated until the key mismatches in the import pipeline are corrected and the interactive map component is swapped in place of the deprecated CSS mock map.*
