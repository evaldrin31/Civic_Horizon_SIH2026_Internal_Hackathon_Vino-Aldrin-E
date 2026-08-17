# Architecture --- V1

Research sources → evidence collection/curation → validation +
normalization → accessibility data store → backend APIs →
frontend/map/search

Optional intelligence path: permitted raw evidence → AI-assisted
extraction → candidate accessibility claims → human verification →
structured record

## Components

### Frontend

Search, map, venue discovery, filters, venue detail, evidence, reports.

### Backend

Venue management, accessibility attributes, evidence, verification,
search, geospatial queries, import pipeline.

### Database

Venues, venue parts/entrances, attributes, evidence, sources,
verification history, reports/audit history.

## Ownership

-   `backend/` → OpenCode #1
-   `database/` → OpenCode #1
-   `frontend/` → OpenCode #2
-   `data/` → Claude + import pipeline
-   `ml/` → User
-   `docs/` → shared, controlled
-   `scripts/` → backend/data

Frontend and backend communicate through a documented API contract.
Schema changes must be recorded before dependent work proceeds.
