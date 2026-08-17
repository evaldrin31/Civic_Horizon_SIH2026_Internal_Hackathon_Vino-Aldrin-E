# API Contract --- V1 Implemented

This is the shared boundary between backend and frontend agents.

**Last Updated:** 2026-08-17  
**Backend Version:** 0.1.0  
**Status:** Implemented and Tested

## Contract Rules

If backend changes a response shape:
1. Update this document.
2. Add migration/compatibility notes.
3. Notify frontend workstream.
4. Add/update tests.

---

## Base URLs

- Development: `http://localhost:8000`
- API Prefix: `/api/v1`

---

## Common Response Patterns

### Pagination

```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "page_size": 20,
  "pages": 5
}
```

### Error Response

```json
{
  "error": "NOT_FOUND",
  "message": "Venue with id 'xxx' not found"
}
```

---

## Endpoints

### Venues

#### GET `/api/v1/venues`

List venues with optional filters.

**Query Parameters:**
- `page` (int, default: 1) - Page number
- `page_size` (int, default: 20, max: 100) - Items per page
- `category` (string, optional) - Filter by category
- `city` (string, optional) - Filter by city
- `state` (string, optional) - Filter by state

**Response:**
```json
{
  "items": [
    {
      "venue_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "City Hospital",
      "category": "hospital",
      "address": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "postal_code": "400001",
      "latitude": 19.0760,
      "longitude": 72.8777,
      "official_url": "https://example.com",
      "contact_phone": "+91-1234567890",
      "contact_email": "info@example.com",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20,
  "pages": 1
}
```

#### GET `/api/v1/venues/{venue_id}`

Get a specific venue by ID.

**Path Parameters:**
- `venue_id` (UUID, required)

**Response:** Venue object (see above)

**Error:** 404 if venue not found

#### POST `/api/v1/venues`

Create a new venue.

**Request Body:**
```json
{
  "name": "City Hospital",
  "category": "hospital",
  "address": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "postal_code": "400001",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "official_url": "https://example.com",
  "contact_phone": "+91-1234567890",
  "contact_email": "info@example.com"
}
```

**Required Fields:** `name`, `category`, `city`, `state`, `latitude`, `longitude`

**Response:** 201 Created - Venue object

#### PATCH `/api/v1/venues/{venue_id}`

Update an existing venue (partial update).

**Request Body:** Same as POST, all fields optional

**Response:** Updated venue object

#### DELETE `/api/v1/venues/{venue_id}`

Delete a venue.

**Response:** 204 No Content

---

### Search

#### GET `/api/v1/venues/search`

Search venues by name and filters.

**Query Parameters:**
- `q` (string, optional) - Search query for venue name (case-insensitive)
- `category` (string, optional)
- `city` (string, optional)
- `state` (string, optional)
- `page`, `page_size` - Standard pagination

**Response:** Paginated list of venues

#### GET `/api/v1/venues/nearby`

Find venues near a location.

**Query Parameters:**
- `lat` (float, required) - Latitude (-90 to 90)
- `lon` (float, required) - Longitude (-180 to 180)
- `radius` (float, default: 5.0) - Search radius in km (0.1 to 100)
- `category` (string, optional)
- `page`, `page_size` - Standard pagination

**Response:** Paginated list of venues

#### GET `/api/v1/search`

Unified search endpoint (combines text and location search).

**Query Parameters:**
- `q` (string, optional) - Text search
- `lat`, `lon`, `radius` (optional) - Location search
- `category`, `city`, `state` (optional) - Filters
- `page`, `page_size` - Standard pagination

**Note:** If `lat` and `lon` are provided, performs nearby search. Otherwise performs text search.

---

### Accessibility Attributes

#### GET `/api/v1/venues/{venue_id}/accessibility`

Get accessibility attributes for a venue.

**Query Parameters:**
- `category` (string, optional) - Filter by category
- `attribute_name` (string, optional) - Filter by attribute name
- `page`, `page_size` - Standard pagination

**Response:**
```json
{
  "items": [
    {
      "attribute_id": "550e8400-e29b-41d4-a716-446655440001",
      "venue_id": "550e8400-e29b-41d4-a716-446655440000",
      "location_id": null,
      "category": "mobility",
      "attribute_name": "ramp",
      "value": "yes",
      "value_type": "boolean",
      "value_text": null,
      "notes": "Accessible ramp at main entrance",
      "last_observed_at": "2024-01-15T00:00:00Z",
      "location": null,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 100,
  "pages": 1
}
```

**Valid Values:** `yes`, `no`, `unknown`, `partial`

#### POST `/api/v1/venues/{venue_id}/accessibility`

Create an accessibility attribute.

**Request Body:**
```json
{
  "venue_id": "550e8400-e29b-41d4-a716-446655440000",
  "location_id": null,
  "category": "mobility",
  "attribute_name": "ramp",
  "value": "yes",
  "value_type": "boolean",
  "value_text": null,
  "notes": "Ramp available"
}
```

**Response:** 201 Created - Attribute object

#### GET `/api/v1/venues/{venue_id}/accessibility/{attribute_id}`

Get a specific attribute.

**Response:** Attribute object with nested `location` and `evidence` (if any)

#### PATCH `/api/v1/venues/{venue_id}/accessibility/{attribute_id}`

Update an attribute.

**Request Body:** Partial attribute object

#### DELETE `/api/v1/venues/{venue_id}/accessibility/{attribute_id}`

Delete an attribute.

**Response:** 204 No Content

#### GET `/api/v1/venues/{venue_id}/accessibility/summary`

Get summary statistics for venue accessibility.

**Response:**
```json
{
  "total_attributes": 5,
  "by_category": {
    "mobility": {"total": 3, "yes": 2, "no": 0, "unknown": 1, "partial": 0}
  },
  "by_value": {"yes": 2, "no": 0, "unknown": 1, "partial": 0},
  "with_evidence": 2,
  "without_evidence": 1
}
```

---

### Evidence

#### GET `/api/v1/venues/{venue_id}/evidence`

Get all evidence for a venue.

**Query Parameters:**
- `verification_status` (string, optional) - Filter by status
- `page`, `page_size` - Standard pagination

**Response:**
```json
{
  "items": [
    {
      "evidence_id": "550e8400-e29b-41d4-a716-446655440002",
      "attribute_id": "550e8400-e29b-41d4-a716-446655440001",
      "source_id": null,
      "evidence_text": "Photograph shows ramp with handrails",
      "evidence_media_url": null,
      "observed_at": "2024-01-15T00:00:00Z",
      "collected_at": "2024-01-15T10:30:00Z",
      "collector": "test_collector",
      "verification_status": "verified",
      "confidence": 0.95,
      "notes": "Verified during site visit",
      "source": null,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20,
  "pages": 1
}
```

#### GET `/api/v1/evidence/{evidence_id}`

Get specific evidence.

**Response:** Evidence object with nested `source` and `attribute` objects

#### POST `/api/v1/evidence`

Create evidence.

**Request Body:**
```json
{
  "attribute_id": "550e8400-e29b-41d4-a716-446655440001",
  "source_id": null,
  "evidence_text": "...",
  "verification_status": "verified",
  "confidence": 0.95,
  "observed_at": "2024-01-15T00:00:00Z"
}
```

**Or with inline source:**
```json
{
  "attribute_id": "...",
  "source": {
    "source_type": "official_venue",
    "source_name": "Hospital Website"
  },
  "evidence_text": "..."
}
```

#### PATCH `/api/v1/evidence/{evidence_id}`

Update evidence (mainly verification status and confidence).

**Request Body:**
```json
{
  "verification_status": "corroborated",
  "confidence": 0.98,
  "notes": "Additional verification performed"
}
```

**Note:** Updating `verification_status` automatically creates a history record.

#### GET `/api/v1/evidence/{evidence_id}/history`

Get verification history for evidence.

**Response:**
```json
[
  {
    "history_id": "...",
    "evidence_id": "...",
    "previous_status": "unverified",
    "new_status": "verified",
    "change_reason": "Verified via site visit",
    "changed_by": "admin",
    "changed_at": "2024-01-15T10:30:00Z"
  }
]
```

#### GET `/api/v1/evidence/{evidence_id}/conflicts`

Get conflicting evidence for the same attribute.

**Response:**
```json
[
  {
    "evidence_id": "...",
    "reason": "contradictory_claims",
    "positive_evidence": "Has ramp...",
    "negative_evidence": "No ramp..."
  }
]
```

---

## Verification Status Values

- `unverified` - Initial state
- `reported` - Claim made, not independently verified
- `corroborated` - Multiple sources agree
- `verified` - Confirmed by authoritative source
- `conflicting` - Different sources disagree
- `outdated` - Previously verified but may no longer be accurate

---

## Source Types (Hierarchy)

1. `government` - Government/regulatory source
2. `professional_audit` - Professional accessibility audit
3. `official_venue` - Official venue/institution source
4. `direct_observation` - Direct on-site measurement/photo
5. `institutional_dataset` - Trusted institutional dataset
6. `community_observation` - Community observation
7. `public_review` - Public review
8. `ai_inference` - AI inference (lowest trust)

---

## Data Import (Admin)

### POST `/api/v1/admin/import/record`

Import a single structured record.

**Request Body:**
```json
{
  "venue": {
    "name": "Example Hospital",
    "category": "hospital",
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "location": {
    "name": "Main Entrance",
    "location_type": "entrance"
  },
  "attribute": {
    "category": "mobility",
    "attribute_name": "ramp",
    "value": "yes"
  },
  "evidence": [
    {
      "source": {
        "source_type": "official_venue",
        "source_name": "Hospital Website"
      },
      "evidence_text": "...",
      "verification_status": "verified"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "venue_id": "...",
  "venue_created": true,
  "errors": []
}
```

### POST `/api/v1/admin/import/records`

Import multiple records (batch).

**Request Body:** Array of record objects (see above)

**Response:**
```json
{
  "total": 10,
  "successful": 9,
  "failed": 1,
  "stats": {
    "venues_created": 5,
    "venues_matched": 4,
    "attributes_created": 9,
    "evidence_created": 15,
    "sources_created": 3
  },
  "results": [...]
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content (delete success)
- `400` - Bad Request (validation error)
- `404` - Not Found
- `422` - Unprocessable Entity (validation error with details)
- `500` - Internal Server Error

---

## Schema Compatibility Notes

### Current Limitations (V1)

1. **Confidence formula:** Not yet implemented. Confidence is manually set.
2. **Geospatial queries:** Uses approximate bounding box, not PostGIS.
3. **Advanced search:** No fuzzy matching or relevance ranking yet.
4. **Media handling:** Evidence media URLs are stored but not processed.

### Potential Schema Changes

Per docs/DATA_SCHEMA.md, the following may evolve:

1. **Attribute taxonomy:** Final attribute names may change after Claude's research.
2. **Source hierarchy:** Additional source types may be added.
3. **Evidence structure:** May support structured data extraction.
4. **Venue locations:** May add additional location types.
5. **Verification workflow:** May add automated verification states.
