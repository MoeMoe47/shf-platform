# GEO-1 Wave 5D IEP Dual-Run Final Report

## Pipeline

The real route loads the qualified Census GeoJSON, constructs Census source records, registers the production `CensusCountyGeometryAdapter`, projects through the production Spatial Projection Pipeline, converts sanitized client results through `IepCountyClientAdapter`, and compares them with the existing legacy features.

## Parity

| Check | Result |
| --- | --- |
| Legacy counties | 88 |
| Spatial counties | 88 |
| FIPS parity | PASS |
| Label parity | PASS |
| Geometry parity | PASS |
| Default map path | Legacy / unchanged |
| Production switch | Not performed |

## Interaction and Safety

Selection remains presentation state owned by the existing IEP page. The county control uses explicit `countyFips`-backed profile data, does not invoke `entityToCounty`, and does not navigate. Private/unpublished domain data is not merged into public Census geometry.

## Browser

- IEP legacy and dual-run certification: `4/4 PASS`.
- Existing Quick Map accessibility/live parity: `4/4 PASS`.
- Browser environment: Chromium via Playwright on the repository Vite server at `127.0.0.1:5174`.
- Production preview gating: not browser-certified because the pre-existing production capital bundle fails before mount with `__DEFINES__ is not defined`; the application-level DEV/query gate remains unit-tested and the default DEV route remains inactive.

## Browser Timing Sample

One Chromium sample on the local Vite server reached the first county path in approximately `594 ms` for the legacy route and `569 ms` for the dual-run route. These are smoke measurements, not a performance benchmark; no material dual-run regression was observed.

## Cutover Condition

The route is ready for a separate final cutover decision after this uncommitted browser/accessibility work is reviewed. No production switch or legacy-path retirement occurred here.
