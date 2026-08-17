# API Contract --- V1 Draft

This is the shared boundary between backend and frontend agents.

## Planned endpoints

GET `/api/v1/venues` GET `/api/v1/venues/{venue_id}` GET
`/api/v1/venues/{venue_id}/accessibility` GET
`/api/v1/venues/{venue_id}/evidence` GET `/api/v1/search` GET
`/api/v1/venues/nearby` POST `/api/v1/reports` POST
`/api/v1/verification` POST `/api/v1/import` (internal/admin)

Exact request/response schemas are TBD.

## Contract rule

If backend changes a response shape: 1. Update this document. 2. Add
migration/compatibility notes. 3. Notify frontend workstream. 4.
Add/update tests.
