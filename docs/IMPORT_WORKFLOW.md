# Research Data Import Workflow

This document describes the workflow for importing research data from Claude's accessibility research into the platform.

## Data Lifecycle

```
RESEARCH
    ↓
data/research/     (Raw research output)
    ↓
VALIDATION       (Dry-run import with /validate)
    ↓
PROCESSED        (Validated records)
    ↓
IMPORT           (Actual database import)
    ↓
VERIFIED         (Human review/verification)
    ↓
API              (Available via REST API)
    ↓
FRONTEND         (Displayed to users)
```

## Directory Structure

```
data/
├── raw/              # Original source data (PDFs, websites, etc.)
├── research/         # Claude's structured research output
├── processed/        # Validated and normalized records
└── verified/         # Records that have passed verification
```

## Validation Rules

### ERROR Level (Import Blocked)

- **Missing required fields**: venue.name, venue.city, venue.state, venue.latitude, venue.longitude
- **Invalid coordinates**: latitude outside [-90, 90], longitude outside [-180, 180]
- **Invalid enum values**: attribute.value not in {yes, no, unknown, partial}
- **Malformed data**: Incorrect data types, impossible references
- **Evidence safety violations**:
  - Positive claim (yes/partial) without evidence
  - AI inference marked as VERIFIED
  - UNKNOWN value marked as VERIFIED

### WARNING Level (Import Allowed)

- **Missing recommended fields**: address, category
- **Missing coordinates**: Will need geocoding
- **Single-source evidence**: Should be corroborated
- **Missing source**: Provenance unclear
- **Missing observation date**: Cannot track freshness
- **AI inference**: Should be corroborated by human observation

### INFO Level (FYI)

- General recommendations
- Data completeness notes
- Suggested improvements

## API Endpoints

### Validate Single Record

```bash
POST /api/v1/admin/import/validate/record
Content-Type: application/json

{
  "venue": {
    "name": "Test Hospital",
    "category": "hospital",
    "city": "Mumbai",
    "state": "Maharashtra",
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "attribute": {
    "category": "mobility",
    "name": "ramp",
    "value": "yes"
  },
  "evidence": [{
    "evidence_text": "Ramp observed",
    "source_type": "direct_observation",
    "observed_at": "2024-01-15"
  }]
}
```

**Response:**
```json
{
  "valid": true,
  "issues": [],
  "issue_count": {
    "errors": 0,
    "warnings": 0,
    "info": 0
  }
}
```

### Validate Batch

```bash
POST /api/v1/admin/import/validate
Content-Type: application/json

[
  { /* record 1 */ },
  { /* record 2 */ }
]
```

**Response:**
```json
{
  "total": 100,
  "valid": 82,
  "invalid": 8,
  "warnings": 10,
  "duplicates": 5,
  "conflicts": 2,
  "errors": [
    {
      "record": 17,
      "field": "venue.latitude",
      "message": "Invalid latitude: 200",
      "severity": "error",
      "venue": "Test Hospital"
    }
  ],
  "warnings_list": [...],
  "info": [...]
}
```

### Import Records

```bash
POST /api/v1/admin/import/records
Content-Type: application/json

[
  { /* validated record */ }
]
```

## Research Record Template

See `docs/DATA_RECORD_TEMPLATE.json` for the complete template.

### Minimal Valid Record

```json
{
  "venue": {
    "name": "Hospital Name",
    "city": "Mumbai",
    "state": "Maharashtra",
    "latitude": 19.0760,
    "longitude": 72.8777
  }
}
```

### Complete Record with Evidence

```json
{
  "venue": {
    "name": "City Hospital",
    "category": "hospital",
    "address": "123 Main Road",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "location": {
    "name": "Main Entrance",
    "location_type": "entrance",
    "description": "Primary hospital entrance facing Main Road"
  },
  "attribute": {
    "category": "mobility",
    "name": "ramp",
    "value": "yes",
    "notes": "Accessible ramp with handrails on both sides"
  },
  "evidence": [
    {
      "source": {
        "source_type": "direct_observation",
        "source_name": "Site Visit - March 2024"
      },
      "evidence_text": "Concrete ramp approximately 1:12 gradient, handrails on both sides, non-slip surface",
      "observed_at": "2024-03-15T10:30:00",
      "verification_status": "verified",
      "confidence": 0.95
    }
  ]
}
```

## Evidence Safety Principles

### Never Convert UNKNOWN to NO

```json
// CORRECT
{
  "attribute": {
    "name": "elevator",
    "value": "unknown"
  }
}

// INCORRECT
{
  "attribute": {
    "name": "elevator",
    "value": "no"  // Only if evidence confirms no elevator
  }
}
```

### Preserve Uncertainty

```json
// AI inference should be marked as REPORTED, not VERIFIED
{
  "evidence": [{
    "source_type": "ai_inference",
    "verification_status": "reported",  // CORRECT
    // "verification_status": "verified"  // INCORRECT
  }]
}
```

### Preserve Conflicting Evidence

If Source A says "ramp = yes" and Source B says "ramp = no":

```json
// Create two evidence records
{
  "evidence": [
    {
      "evidence_text": "Ramp present at main entrance",
      "source_type": "official_venue",
      "verification_status": "reported"
    },
    {
      "evidence_text": "No ramp found at entrance",
      "source_type": "community_observation",
      "verification_status": "reported"
    }
  ]
}
```

The system will mark this as CONFLICTING and preserve both claims.

## Duplicate Detection

Duplicates are detected by normalized:
- venue.name
- venue.address  
- venue.city

Example duplicates:
```json
// Record 1
{ "venue": { "name": "City Hospital", "address": "123 Main St", "city": "Mumbai" }}

// Record 2 (duplicate)
{ "venue": { "name": "City Hospital", "address": "123 Main St", "city": "Mumbai" }}
```

## Source Deduplication

Sources are matched by `source_name`. If the same source is referenced multiple times:

1. First occurrence: Create source record
2. Subsequent occurrences: Reuse existing source_id

## Conflict Detection

Conflicts are detected when:
1. Same venue + location
2. Same attribute name
3. Different values (yes/no)
4. Both from verified/corroborated sources

Conflicts are marked with `verification_status: CONFLICTING`.

## Freshness Tracking

Use `observed_at` to track when evidence was collected:

```json
{
  "evidence": [{
    "observed_at": "2024-01-15",
    // System will calculate age and flag stale evidence
  }]
}
```

Freshness thresholds are configurable but not hardcoded.

## Import Workflow

### Step 1: Validate Research Data

```bash
# Validate all research records
curl -X POST http://localhost:8000/api/v1/admin/import/validate \
  -H "Content-Type: application/json" \
  -d @data/research/batch_1.json
```

### Step 2: Review Validation Report

Check:
- How many records are valid?
- What errors need fixing?
- What warnings can be ignored?
- Which records are duplicates?

### Step 3: Fix Errors

Update research records based on validation errors.

### Step 4: Import Valid Records

```bash
# Import validated records
curl -X POST http://localhost:8000/api/v1/admin/import/records \
  -H "Content-Type: application/json" \
  -d @data/processed/validated_batch_1.json
```

### Step 5: Verify Import

Check import report for:
- venues_created
- venues_matched
- attributes_created
- evidence_created
- sources_created

## Quality Assurance

### Before Import

- [ ] Run dry-run validation
- [ ] Review all ERROR-level issues
- [ ] Address critical WARNINGs
- [ ] Check for duplicates
- [ ] Verify evidence safety

### After Import

- [ ] Verify counts match expectations
- [ ] Check for import errors
- [ ] Review verification status distribution
- [ ] Confirm sources are properly linked

## Troubleshooting

### Issue: "Invalid latitude"

**Cause**: Latitude outside valid range [-90, 90]

**Fix**: Verify coordinate format and hemisphere

### Issue: "Positive claim without evidence"

**Cause**: attribute.value = "yes" but no evidence provided

**Fix**: Either:
1. Add evidence, or
2. Change value to "unknown"

### Issue: "AI inference cannot be verified"

**Cause**: AI-generated evidence marked as VERIFIED

**Fix**: Change verification_status to "reported" or "corroborated"

### Issue: "Duplicate venue detected"

**Cause**: Same venue already exists in database

**Fix**: Use deduplication logic or verify if truly duplicate

## Contact

For questions about data import:
- Backend: OpenCode Agent #1
- Research: Claude
- Integration: User
