# GEO-1 Wave 6C Regional Geometry Entry Gate

## Current Decision

`BLOCKED_BY_COORDINATE_STANDARD`

The registered space exists, but its concrete scene coordinate bounds and
authoring semantics are not frozen. Asset alignment and geometry ownership
approval are additional conditions.

## Required Before Authoring

1. Approve exact `metaverse.regional-scene` coordinate semantics.
2. Confirm the Metaverse Regional geometry authority.
3. Approve the dedicated geometry registry model.
4. Establish asset alignment evidence or variant-specific geometry policy.
5. Approve Polygon validation and version/hash metadata.

## Adapter Status

The Regional Spatial adapter remains `BLOCKED_BY_COORDINATES`. A completed
authoring design does not make a scene Spatial-eligible. At least one approved,
valid geometry payload is required first.

## Browser Condition

The targeted browser check is environment-blocked by the companion SHS API.
The repository's API service is `apps/shs-api`, started with `npm run dev` from
that directory, listening on port `8091`; its health endpoint is `/health`.
This is preparation for later browser certification, not a product change.
