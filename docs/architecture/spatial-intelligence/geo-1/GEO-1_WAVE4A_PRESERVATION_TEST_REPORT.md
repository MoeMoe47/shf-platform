# GEO-1 Wave 4A Preservation Test Report

Status: COMPLETE WITH CONDITIONS. Wave 4A establishes a read-only preservation
baseline. No production Quick Map integration was performed.

## Planning and Branch

- Planning commit: `7baf6cb docs(spatial): freeze Wave 4 Quick Map integration plan`
- Test branch: `feature/spatial-engine-quick-map-wave4a`
- Wave 3B runtime remains frozen at `04a4044`.

## Existing Quick Map Baseline

The six existing Quick Map and Metaverse registry suites were run before the
new suite:

| Suite | Result | Test kind |
| --- | ---: | --- |
| `metaverseMiniMapV2.test.mjs` | 13/13 | source/asset/registry contract |
| `metaverseMiniMapV3.test.mjs` | 18/18 | source/CSS contract |
| `metaverseMinimapFinalReconciliation.test.mjs` | 8/8 | source/CSS reconciliation |
| `metaverseCoordinateCalibration.test.mjs` | 5/5 | registry/unit contract |
| `metaverseCanonicalDestination.test.mjs` | 5/5 | destination contract |
| `metaverseDestinationRelationships.test.mjs` | 7/7 | relationship contract |
| **Existing total** | **56/56** | **PASS** |

These suites are primarily static/source and registry tests. They do not
replace browser-rendered interaction coverage; that remains a future Wave 4
integration requirement.

## New Wave 4A Suite

Created:

`tests/spatialQuickMapPreservationWave4A.test.mjs`

Result: **18/18 PASS**.

Coverage includes:

- canonical asset, dimensions, coordinate bounds, origin, and axis direction;
- Quick Map/master-city and coordinate-family isolation;
- absence of implicit transforms;
- all 15 registry entries, including 9 `UNMAPPED` districts and 6
  `PROVISIONAL` infrastructure entries;
- absence of synthetic source authority or provenance;
- collapsed, compact, expanded, and full-map behavior contracts;
- Recenter, Fit World, and modal controls;
- DOM marker rendering and live overlay presence;
- accessibility attributes and semantic activity content;
- `MetaverseCityPage` navigation ownership and protected-entry checks;
- fast-travel authorization checks and provisional-marker non-navigation;
- regional 15-stop presentation route and null destination references;
- test-only client filtering for visible Quick Map projections;
- rejection of master-city, REAL_WORLD, unknown, unpublished, and restricted
  client results;
- presentation-only selection boundary;
- deferred Interaction Bus capabilities;
- absence of production Quick Map adapters or source mappings.

## Coordinate Verification

- Asset: `public/assets/metaverse/minimap/silicon-heartland-metaverse-top-map.png`
- Dimensions: 1448 x 1086
- Space: `metaverse.quick-map`
- Units: normalized percentages
- Bounds: x/y 0..100
- Origin: top-left
- Transform: none

## Registry Verification

The 15-entry registry is unchanged:

- 9 canonical districts remain `UNMAPPED` with null coordinates.
- 6 infrastructure landmarks remain `PROVISIONAL`.
- Provisional entries retain null destination IDs and routes.
- No source authority, source record, or synthetic provenance was added.

## Navigation Authority Verification

District navigation remains owned by `MetaverseCityPage` through
`selectDistrict`, protected-entry evaluation, camera focus, and scene state
changes. Fast travel remains owned by `navigateFastTravelDestination` and its
`fastTravelApi` response checks.

The Quick Map test suite confirms that provisional infrastructure markers do
not gain click navigation and that no destination identity is fabricated.

## Regional Quick Map Verification

The regional route remains a presentation-only 15-stop sequence. Current,
previous, next, travel direction, route overview, and missing-asset behavior
remain in the existing component. Regional scene destination references remain
null. No route engine was connected.

## Accessibility Verification

Preserved and tested:

- keyboard-capable district marker buttons;
- accessible marker labels;
- tab and selected semantics;
- pressed layer controls;
- expanded/collapsed controls;
- text-equivalent district activity content;
- focus-visible and responsive source contracts;
- reduced-motion input remains part of the map boundary.

Known gap: no browser-level focus traversal or screen-reader run was added in
Wave 4A. That belongs to the Wave 4D accessibility/non-map-equivalent stage.

## Spatial Safety Boundary

A test-only `QuickMapClientFixture` accepts only projected results with:

- status `PROJECTED`;
- coordinate family `METAVERSE`;
- coordinate space `metaverse.quick-map`.

The fixture is local to the test file and is not imported by production code.
It rejects master-city, REAL_WORLD, unknown-space, unpublished, and restricted
results. No production Quick Map adapter exists.

## Future Integration Coverage

The planning packet proposed 40 tests across preservation, Spatial, interaction,
and accessibility categories. Wave 4A added 18 non-duplicative executable
tests and reused 56 existing tests. The remaining client integration,
Interaction Bus, browser accessibility, and rendered parity cases are deferred
to Wave 4B-4E rather than represented by fake passing tests.

## Spatial Baseline

- Wave 1: 18/18 PASS
- Wave 2A: 11/11 PASS
- Wave 2B: 13/13 PASS
- Wave 3A: 11/11 PASS
- Wave 3B runtime: 27/27 PASS
- Wave 3B presentation: 36/36 PASS
- **Spatial total: 116/116 PASS**

## Build

`npm run build`: **PASS**.

Existing Vite warnings remain for ASL JSON import shape and large chunks. They
are unrelated to Wave 4A and were not changed.

## Scope Confirmation

- Quick Map production source: unchanged.
- Map integration: none.
- Production source mappings: none created.
- Coordinate transforms: none.
- Domain authority changes: none.
- Backend persistence, route engine, Mapbox, and domain adapters: none.

## Acceptance Decision

Wave 4A: **COMPLETE WITH CONDITIONS**.

The preservation baseline is in place and current behavior is protected by
56 existing plus 18 new tests. Conditions are deferred rendered/browser
coverage, legitimate source-authority mapping, and the later Wave 4B-4E client
integration stages.
