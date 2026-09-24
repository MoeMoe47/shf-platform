# Project 1 Phase 1.3: Scene, Coordinate, and Destination Relationships

## Authority boundary

The server city registry remains the identity authority. `metaverseDestinationRelationshipRegistry.js` is a bounded frontend relationship projection: it joins canonical destination IDs to existing facility coordinates, Quick Map markers, district/facility scene IDs, and asset references. It does not redefine destination labels, statuses, routes, or geometry.

## Current relationships

- All 36 canonical destinations retain their existing master-city facility ID and normalized `x`/`y` position.
- District scene IDs are derived from existing production district scenes.
- Facility scene IDs are populated only for existing production facility scenes: `main-data-center`, `data-center-training-lab`, `innovation-lab`, and `student-hub`.
- Reference-only assets remain reference-only. Missing facility backgrounds remain `MISSING`.
- Quick Map currently has no verified destination-level marker bindings. Its six infrastructure markers remain `PROVISIONAL_INFRASTRUCTURE` with `destinationId: null`.

## Deferred mobility and venue relationships

Road, water, Sky Bridge, and venue reference arrays are present but empty. Existing road traces, traffic routes, river traces, and water zones remain separate geometry authorities. No dock, stop, road-access, or venue relationship is inferred from visual proximity.

## Query and validation contract

The relationship registry provides bounded lookups for spatial relationships, master-city location, Quick Map location, scene/background relationships, road access, and water access. Unknown IDs return `null` or an empty list. Validation rejects unknown destination, district, facility, scene, asset, road, and water references; duplicate destination ownership; invalid coordinate ownership; and non-empty Sky Bridge/Venue references while those registries do not exist.
