# Project 1 Phase 1.4 — Coordinate Calibration

## Coordinate authorities

- Destination identity remains owned by `apps/shs-api/src/domain/metaverse/registry/city-registry.ts` and its frontend projection.
- Master City geometry remains owned by `metaverseNavigationModel.js` and is exposed through `metaverseDestinationRelationshipRegistry.js`.
- Quick Map geometry remains owned by `metaverseMiniMapRegistry.js`.
- The approved Quick Map asset is `public/assets/metaverse/minimap/silicon-heartland-metaverse-top-map.png` at 1448 × 1086 pixels.

## Separate coordinate spaces

Master City and Quick Map both use normalized percentages, but they are different projections and are never mathematically interchangeable:

- `master-city`: cinematic city composition, normalized 0–100 x/y.
- `quick-map`: overhead map asset, normalized 0–100 x/y with native dimensions recorded in the space definition.

Every relationship carries the relevant coordinate-space ID and coordinate status.

## Coordinate status

- `VERIFIED`: accepted from an authoritative existing relationship.
- `CALIBRATED`: captured through the developer calibration workflow and ready for source review.
- `PROVISIONAL`: existing marker retained for future owner confirmation.
- `UNMAPPED`: no trustworthy coordinate is currently available.

The nine canonical districts remain `UNMAPPED`. The overhead artwork labels six generic regions and does not establish a defensible one-to-one mapping to the nine Silicon Heartland districts. No coordinates were guessed.

## Calibration workflow

In a development build, open the city Quick Map with `?minimapCalibrate=1`. Select a district or canonical destination, click the overhead map, inspect the normalized preview, and copy the formatted mapping. The tool is preview/export-only: it does not write source files, mutate production registries, or persist runtime coordinates.

The copied mapping must be reviewed and placed deliberately in the source-controlled registry. Validation rejects non-normalized coordinates, invalid statuses, and unmapped entries that carry coordinates.

## Boundaries

Quick Map coordinate proximity does not establish road access, water access, Sky Bridge stops, venues, rooms, or live presence. Those references remain empty until their owning systems provide verified relationships. Regional scene maps remain independent of the city Quick Map.

