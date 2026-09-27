# GEO-1B Test Architecture

Tests must exist before production implementation begins.

## Required Test Families

- contract tests for all shared types
- coordinate-family isolation tests
- no-fabricated-geography tests
- publication boundary tests
- adapter tests
- selection lifecycle tests
- interaction bus tests
- temporal state tests
- accessibility tests
- Quick Map isolation tests
- regression tests for existing maps

## Explicit Tests

Unknown entity must NOT automatically become Franklin County.

Quick Map coordinates must NOT be accepted as master-city coordinates without a registered transform.

## Suggested Placement

- `tests/spatialContracts.test.mjs`
- `tests/spatialCoordinateIsolation.test.mjs`
- `tests/spatialPublicationBoundary.test.mjs`
- `tests/spatialSelection.test.mjs`
- `tests/spatialInteractionBus.test.mjs`
- `tests/spatialStateProjection.test.mjs`
- `tests/ui/spatial-pilot.spec.mjs` when a pilot client begins
