# Multi-Agent Work Rules

## OpenCode #1 --- Backend/DB

Owns backend, database, scripts and backend tests. Do not modify
frontend implementation without coordination.

## OpenCode #2 --- Frontend/UX

Owns frontend and frontend tests. Do not modify backend implementation
without coordination.

## Claude

Owns research, evidence discovery and structured data research. Do not
modify application code.

## Antigravity

Use for independent QA, research, UI exploration, dataset analysis,
documentation review and experiments that do not conflict with active
OpenCode work.

## All agents

-   Read relevant docs first.
-   Do not silently change schema.
-   Do not invent data.
-   Keep changes small and testable.
-   Update CHANGELOG for meaningful changes.
-   Record major decisions in DECISIONS.md.
-   Never overwrite another agent's work without coordination.
