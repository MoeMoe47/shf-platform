# Project 1 Phase 1.2: Canonical Destination IDs

## Authority

`apps/shs-api/src/domain/metaverse/registry/city-registry.ts` owns the city, district, facility, destination, display, status, relationship, and route metadata. The frontend consumes a bounded identity projection; it does not own route or status semantics.

## ID rule

Canonical destination IDs are explicit, stable, lowercase kebab-case IDs from the server registry. Display names, routes, asset slots, scene IDs, traffic IDs, and water path IDs are not destination IDs.

## Compatibility aliases

Historical frontend/facility keys resolve only through `destination-id-crosswalk.ts`:

| Alias | Canonical destination |
| --- | --- |
| `public-works` | `public-works-office` |
| `park` | `city-park` |
| `student-profile-access` | `student-profile-portfolio-access` |

Unknown strings fail with `null`. No fuzzy matching or label inference is permitted.

## Frontend projection

`metaverseNavigationModel.js` retains legacy facility keys for current callers and adds `destinationId` as the canonical reference. Existing district and facility geometry remains unchanged. Quick Map coordinates remain a separate coordinate authority; current infrastructure pins are explicitly `PROVISIONAL_INFRASTRUCTURE` with no destination reference.

## Boundaries

Regional scene IDs, road traces, traffic routes, river traces, visual assets, and future Sky Bridge/water/venue records remain separate authorities. Future records may carry a nullable canonical destination reference, but this phase does not invent access mappings, docks, stops, venues, or scene relationships.

## Validation

The server validator checks canonical ID shape, alias targets, alias uniqueness, and alias/canonical collisions. Frontend tests check projection references, safe unknown lookup, Quick Map provisional-marker preservation, and regional-scene separation.
