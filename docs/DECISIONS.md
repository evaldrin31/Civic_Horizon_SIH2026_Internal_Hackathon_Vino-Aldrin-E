# Architecture & Product Decisions

## D-001 --- Venue-level accessibility intelligence

Status: Accepted Date: 2026-08-17

The platform focuses on specific accessibility attributes at
venue/entrance/location level rather than a generic accessibility
rating.

## D-002 --- Evidence-backed attributes

Status: Accepted Date: 2026-08-17

Accessibility claims retain provenance and verification state.

## D-003 --- Unknown is valid

Status: Accepted Date: 2026-08-17

Missing evidence must not become NO.

## D-004 --- Parallel research and engineering

Status: Accepted Date: 2026-08-17

Research/data collection and software development proceed
simultaneously.

## D-005 --- Agent ownership

Status: Accepted Date: 2026-08-17

Claude handles research/data discovery; OpenCode agents handle
engineering; the user controls integration and architecture.

## D-006 --- Backend Technology Stack

Status: Accepted Date: 2026-08-17

**Stack Selected:** Python + FastAPI + SQLAlchemy + PostgreSQL

**Rationale:**
- FastAPI: Modern, fast, automatic OpenAPI docs, built-in validation via Pydantic
- SQLAlchemy: Mature ORM with migration support via Alembic
- PostgreSQL: Supports geospatial queries via PostGIS, robust, well-documented
- Python 3.13: Available in environment, excellent ecosystem for data/AI integration
- Alembic: Industry-standard migrations, supports reversible schema changes

**Alternative considered:** Node.js/Express/Prisma - rejected due to Python's superior data science ecosystem for future AI/CV integration.

## D-007 --- Database Schema V1

Status: Accepted Date: 2026-08-17

**Decision:** Initial schema with 6 tables using PostgreSQL enums for controlled vocabularies.

**Schema Overview:**
- UUID primary keys (distributed-safe)
- Proper indexing for common queries
- Foreign key constraints with cascade rules
- Enum types: VerificationStatus, SourceType, AttributeValue
- VerificationHistory for audit trail

**Rationale:**
- Modular design allows evolution
- Reversible via Alembic
- Supports conflicting evidence
- Preserves provenance

**May Evolve:** Attribute taxonomy, evidence structure, source hierarchy after Claude's research.

## D-008 --- Evidence Model

Status: Accepted Date: 2026-08-17

**Decision:** Evidence is first-class with verification states, not boolean flags.

**Key Principles:**
- Six verification states: UNVERIFIED, REPORTED, CORROBORATED, VERIFIED, CONFLICTING, OUTDATED
- Source hierarchy (8 levels)
- Never convert UNKNOWN to NO
- Preserve conflicting observations
- Verification history tracking

**Rationale:**
- Aligns with Evidence and Verification Policy
- Supports trust levels and freshness
- Enables contradiction detection
- Audit trail for verification changes

## D-009 --- Data Import Strategy

Status: Accepted Date: 2026-08-17

**Decision:** Structured import with validation, deduplication, and provenance preservation.

**Key Features:**
- Atomic transactions (per record)
- Venue deduplication by name+address+city
- Source auto-creation
- Import statistics and error reporting
- Validation before any database writes

**Format:**
```json
{
  "venue": {...},
  "location": {...},
  "attribute": {...},
  "evidence": [...]
}
```

## D-010 --- UUID Cross-Database Compatibility

Status: Accepted Date: 2026-08-17

**Decision:** Use String(36) for UUIDs to support both PostgreSQL (production) and SQLite (testing).

**Rationale:**
- PostgreSQL native UUID type is preferred for production
- SQLite does not support native UUID types
- String(36) format "550e8400-e29b-41d4-a716-446655440000" works identically in both
- No UUID conversion needed in application code
- Simplifies testing and local development

**Migration Path:** When moving to production PostgreSQL, the schema uses String(36) which works correctly. Future optimization could migrate to native PostgreSQL UUID if needed.

## D-011 --- Reserved Keyword Avoidance

Status: Accepted Date: 2026-08-17

**Decision:** Renamed `app/import/` to `app/importers/` to avoid Python reserved keyword collision.

**Rationale:**
- `import` is a Python reserved keyword
- Cannot use `from app.import.importer import ...` syntax
- `app/importers/` is semantically equivalent and syntactically valid

## D-012 --- Research Data Validation

Status: Accepted Date: 2026-08-17

**Decision:** Implement three-tier validation (ERROR/WARNING/INFO) with dry-run capability.

**Key Principles:**
- ERROR: Blocks import (invalid data, safety violations)
- WARNING: Allows import but flags concerns (missing data, single source)
- INFO: Informational only (recommendations, observations)
- Dry-run validation before any database writes
- Machine-readable import reports

**Rationale:**
- Research data inherently contains uncertainty
- Must preserve "unknown" states
- Cannot automatically convert missing to "no"
- Need clear feedback loop to Claude
- Supports iterative research workflow

## D-013 --- Evidence Safety Enforcement

Status: Accepted Date: 2026-08-17

**Decision:** Backend enforces evidence safety principles via validation rules.

**Enforced Rules:**
1. UNKNOWN value cannot be VERIFIED (contradictory)
2. AI inference cannot be VERIFIED (max REPORTED/CORROBORATED)
3. Positive claim (yes/partial) requires evidence
4. Conflicting observations preserved, not overwritten
5. Missing evidence does not default to NO

**Rationale:**
- Prevents accidental data corruption
- Maintains integrity of research process
- Preserves uncertainty for downstream decisions
- Supports evidence-based verification workflow

## D-014 --- Dry-Run Import Pattern

Status: Accepted Date: 2026-08-17

**Decision:** Separate validation from import via `/validate` endpoints.

**Pattern:**
```
1. POST /validate (dry-run, no DB writes)
2. Review report
3. Fix errors
4. POST /import (actual import)
```

**Rationale:**
- Allows safe experimentation
- Prevents partial/corrupted imports
- Gives clear feedback to researchers
- Supports batch processing

## Pending

-   Final attribute taxonomy (depends on Claude's research)
-   Confidence formula (TBD, requires research)
-   Map provider
-   Authentication
-   Deployment strategy
-   AI/CV model
-   Data licensing policy
