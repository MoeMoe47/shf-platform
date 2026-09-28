# GEO-1 Wave 4 Quick Map Integration Plan

Status: PLANNING ONLY. No Quick Map source was changed in this phase.

## Purpose

Wave 4 will make the existing Metaverse Quick Map the first Spatial Engine
client. It will preserve the current map behavior while allowing safe,
viewer-eligible `ClientProjectionResult` values to drive future markers,
selection, and accessible equivalents.

The governing boundaries remain:

- Separate authorities, shared spatial coordination.
- Preservation before replacement.
- Quick Map is a client, not a domain, projection, publication, coordinate,
  destination, route, event, mission, traffic, water, or emergency authority.
- No implicit conversion between `metaverse.quick-map`,
  `metaverse.master-city`, or any other coordinate space.

## Forensic Scope

There are two current Quick Map surfaces:

1. The city minimap in `src/components/metaverse/MetaverseMiniMap.jsx`.
2. The regional-scene Quick Map route overview in the same component, using
   `regionalScene.quickMapAsset`.

The first Wave 4 pilot should target the city minimap only. Regional scene
assets use a separate registry and per-scene aspect ratios and should remain a
later client surface.

## Confirmed Repository Evidence

- `src/components/metaverse/MetaverseMiniMap.jsx:276-380` renders the city
  map as a background image with DOM overlays. District markers call
  `onSelectDistrict`; infrastructure markers are non-interactive.
- `src/system/metaverse/metaverseMiniMapRegistry.js:11-28` identifies the
  installed asset, dimensions, and `quick-map` coordinate space.
- `src/system/metaverse/metaverseMiniMapRegistry.js:68-89` contains nine
  `DISTRICT` entries that are `UNMAPPED`, plus six `INFRASTRUCTURE` entries
  with `PROVISIONAL` coordinates and no destination IDs.
- `src/system/metaverse/metaverseMiniMapRegistry.js:130-182` validates
  bounded normalized coordinates, coordinate-space identity, provisional
  infrastructure, and destination references.
- `src/pages/metaverse/MetaverseCityPage.jsx:983-998` owns district selection,
  protected-entry evaluation, selection state, camera focus, and scene-level
  transition.
- `src/pages/metaverse/MetaverseCityPage.jsx:1067-1099` owns fast-travel
  authorization/result handling and destination transition.
- `src/pages/metaverse/MetaverseCityPage.jsx:1424-1439` mounts the city map and
  supplies live district, event, opportunity, presence, and navigation data.
- `src/components/metaverse/MetaverseMiniMap.jsx:482-537` renders regional
  Quick Map assets, route sequence, current/previous/next labels, and a
  non-interactive current-scene marker.
- `src/system/metaverse/regionalSceneRegistry.js:29-33` explicitly keeps
  regional scene identity separate from city destination identity and gives
  every current regional scene a null destination reference.
- `tests/metaverseMiniMapV2.test.mjs:44-169`,
  `tests/metaverseMiniMapV3.test.mjs:133-170`, and
  `tests/metaverseMinimapFinalReconciliation.test.mjs:45-101` preserve asset,
  marker, modal, responsive, accessibility, and navigation behavior.

## Coordinate Contract

The city Quick Map uses:

| Field | Verified value |
| --- | --- |
| Asset | `public/assets/metaverse/minimap/silicon-heartland-metaverse-top-map.png` |
| Natural dimensions | 1448 x 1086 PNG |
| Coordinate space | `quick-map` / canonical Spatial ID `metaverse.quick-map` |
| Units | normalized-percent |
| Bounds | x 0..100, y 0..100 |
| Origin | top-left, as defined by the normalized DOM positioning convention |
| Axis direction | x rightward, y downward |
| Rendering | CSS percentage `left` and `top` over a background image |
| Scaling | `background-size: cover`; local CSS `scale()` and `transform-origin` for Recenter/Fit World |

The source registry and tests verify 1448 x 1086 (`file`/`sips`,
`tests/metaverseMiniMapV2.test.mjs:51-59`, and
`tests/metaverseCoordinateCalibration.test.mjs:29-38`). The nine canonical
districts remain unmapped because the generic art does not prove identity.

`metaverse.master-city` is a different normalized space in
`src/system/metaverse/metaverseDestinationRelationshipRegistry.js:21-30`.
No transform is registered or planned in Wave 4.

Regional Quick Map assets are not aliases for the city space. For example,
`src/system/metaverse/regionalSceneRegistry.js:104-108` gives Oil Rig an
asset-specific 1584/993 aspect ratio, while lines 174-178 give Open Sea
1672/941. Their dimensions, route sequence, and camera orientation must be
audited independently before any future integration.

## Proposed Client Flow

```text
Metaverse-owned or domain-backed record
        |
        v
Projection adapter with explicit authority and coordinate space
        |
        v
Spatial Projection Pipeline
        |
        v
ClientProjectionResult[]
        |
        v
Quick Map client adapter
        |
        v
Existing DOM marker and semantic-list rendering
```

The client adapter may filter to `metaverse.quick-map`, preserve stable
feature IDs, and pass through selected/highlighted presentation dimensions. It
may not manufacture a source record for a static art marker or reinterpret
master-city coordinates as Quick Map coordinates.

## First Legitimate Adapter Recommendation

Do not create a production adapter for the nine district markers or six
infrastructure markers yet.

- District entries have `UNMAPPED` coordinates and no confirmed Quick Map
  mapping.
- Infrastructure entries are explicitly `PROVISIONAL`, unclaimed, and have
  no destination ID.
- The city component receives live district and activity data, but that does
  not by itself establish Quick Map geometry or publication authority.

The smallest legitimate Wave 4B source set is therefore a test-only fixture
adapter for one explicitly named, source-backed record in `metaverse.quick-map`,
plus a client-owned static presentation record path that remains outside the
Spatial authority model. Production integration should wait for an owner-
reviewed mapping and a declared source authority. No fake `metaverse` or
`destination` authority should be introduced.

## Selection Integration Plan

The city marker flow should become:

```text
marker click or semantic-list activation
    -> SELECT interaction
    -> validated single SpatialSelection
    -> Wave 2B Selection Store
    -> presentation update in map and panels
    -> optional existing destination request
```

Selection remains presentation-only. It does not grant entry, approve an
action, mutate a mission/event, or change the Metaverse selection authority.
The existing `selectDistrict` path remains the authority for protected entry
and scene transition until a later adapter explicitly delegates a request.

Unknown, restricted, unpublished, unavailable, or wrong-space results are not
placed into the client selectable set. They are cleared or represented using
the frozen safe client behavior; no replacement marker is invented.

## Interaction Bus Plan

Use only interactions needed by the current surface:

- `SELECT` for district/feature activation.
- `DESELECT` for explicit clear or close behavior where a selection exists.
- `FOCUS` for keyboard/focus movement if a non-map equivalent needs to keep
  panels synchronized.
- `OPEN_RECORD` only when a real record reference is available.
- `HIGHLIGHT` only for an existing hover/focus or panel synchronization need.

Do not publish `REQUEST_ROUTE`, `FOLLOW_ROUTE`, or
`REQUEST_DOMAIN_ACTION` from the city minimap until a real route or domain
action contract is identified. Existing navigation remains owned by
`MetaverseCityPage` and its protected-entry/fast-travel services.

## Destination Safety

Current city district navigation is owned by `MetaverseCityPage` through
`selectDistrict`. Fast travel is owned by `navigateFastTravelDestination`,
which calls `fastTravelApi` and checks `can_enter` before changing scene state.
Spatial may request a record open or client navigation action, but it must not
decide that a destination exists, is accessible, or is authorized.

The regional route overview is currently presentation-only: it renders the
current scene and route list, while `REGIONAL_SCENE_DESTINATION_REFS` keeps
destination IDs null. Wave 4 must preserve that fact.

## Accessibility Plan

The current map already provides keyboard buttons, marker `aria-label` values,
tab/selected semantics, pressed layer controls, expanded/collapsed controls,
focus-visible styling, and a text-equivalent district activity list. Wave 4
should preserve these while making the semantic destination list consume the
same client projection results as the map markers.

The implementation plan requires:

- keyboard activation through the same selection API as pointer activation;
- stable focus and focus return when the full-map modal opens/closes;
- selected, unavailable, restricted, stale, and highlighted text equivalents;
- no private feature data in labels or diagnostics;
- reduced-motion behavior for map and selection presentation;
- no map-only capability for opening a record or requesting navigation.

## Staged Implementation

### Wave 4A: Forensic Baseline and Preservation Tests

Lock the current asset, coordinate, marker, route, modal, navigation, and
accessibility behavior in tests. Add no Spatial integration.

### Wave 4B: Client Adapter and First Legitimate Projection Adapter

Introduce a Quick Map client adapter and a test-only fixture adapter first.
Production records may enter only after authority, coordinate, provenance, and
publication evidence is accepted.

### Wave 4C: Selection and Interaction Integration

Connect marker/list activation to the existing Selection Store and the minimum
Interaction Bus events. Keep destination transition outside Spatial.

### Wave 4D: Accessibility and Non-map Equivalent

Drive the semantic destination/activity list from the same safe client results,
including focus, status text, masking, and reduced-motion behavior.

### Wave 4E: Parity, Regression, and Acceptance

Verify existing map behavior, coordinate isolation, privacy, source
authority, selection behavior, navigation ownership, and absence of domain
mutation. Only then consider broader Metaverse client surfaces.

These subphases refine execution of GEO-1/GEO-4 client work; they do not
rename or replace the larger GEO-1 through GEO-10 roadmap.

## Deferred Questions

- owner-confirmed district-to-Quick-Map mappings;
- source authority for provisional infrastructure points;
- whether any static marker should become a projected feature;
- exact feature IDs for canonical Metaverse records;
- publication policy for student presence, events, and opportunities;
- regional Quick Map integration and scene-to-destination ownership;
- whether current route labels are merely presentation or a future route
  projection;
- final reduced-motion behavior for map zoom and modal transitions.
