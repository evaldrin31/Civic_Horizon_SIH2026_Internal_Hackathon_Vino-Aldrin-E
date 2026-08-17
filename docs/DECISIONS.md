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

## Pending

-   Final attribute taxonomy (depends on Claude's research)
-   Confidence formula (TBD, requires research)
-   Map provider
-   Authentication
-   Deployment strategy
-   AI/CV model
-   Data licensing policy
