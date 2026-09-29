# GEO-1 Wave 6C Regional Authoring Entry Gate

## Coordinate Standard

The Regional scene coordinate semantics are now frozen as `METAVERSE`,
`metaverse.regional-scene`, top-left origin, right/down axes, normalized
`0..100` bounds, and `[x, y]` points.

## Remaining Conditions

Before building a tracer:

1. confirm Metaverse Regional geometry ownership;
2. approve a geometry registry/export schema;
3. complete asset alignment review for the chosen scene;
4. approve the scene-specific Polygon meaning and lifecycle;
5. provide an approved reference asset and publication status.

## Decision

`READY_TO_BUILD_TRACER_WITH_CONDITIONS`

The coordinate semantics are sufficiently specified for a future DEV-only
tracer, but no scene is selected for authoring until alignment and ownership
conditions close.

## Adapter Gate

The Regional adapter remains `BLOCKED_BY_COORDINATES`. A coordinate standard
alone does not create an approved geometry payload.
