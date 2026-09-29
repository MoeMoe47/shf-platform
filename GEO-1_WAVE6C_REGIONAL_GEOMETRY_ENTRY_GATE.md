# GEO-1 Wave 6C Regional Geometry Entry Gate

## Current Decision

`READY_TO_BUILD_TRACER_WITH_CONDITIONS`

The concrete coordinate bounds and authoring semantics are now frozen. Asset
alignment and geometry ownership approval are additional conditions.

## Required Before Authoring

1. Confirm the Metaverse Regional geometry authority.
2. Approve the dedicated geometry registry model.
3. Establish asset alignment evidence or variant-specific geometry policy.
4. Approve Polygon validation and version/hash metadata.

## Adapter Status

The Regional Spatial adapter remains `BLOCKED_BY_COORDINATES`. A completed
coordinate standard or authoring design does not make a scene Spatial-eligible.
At least one approved, valid geometry payload is required first.

## Browser Condition

The targeted browser check is environment-blocked by the companion SHS API.
The repository's API service is `apps/shs-api`, started with `npm run dev` from
that directory, listening on port `8091`; its health endpoint is `/health`.
This is preparation for later browser certification, not a product change.
