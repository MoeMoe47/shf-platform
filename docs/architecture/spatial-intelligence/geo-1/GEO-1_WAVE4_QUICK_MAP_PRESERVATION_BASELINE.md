# GEO-1 Wave 4 Quick Map Preservation Baseline

Status: READ-ONLY forensic baseline. No source behavior was changed.

## Surfaces

### City Quick Map

Primary implementation: `src/components/metaverse/MetaverseMiniMap.jsx`.

Mounted by `src/pages/metaverse/MetaverseCityPage.jsx:1424-1439` with district,
presence, event, opportunity, civic, destination, and reduced-motion inputs.

### Regional Quick Map

Rendered by `MetaverseMiniMap.jsx:482-540` when a regional scene is active.
Source definitions and asset aspect ratios live in
`src/system/metaverse/regionalSceneRegistry.js`.

## City Baseline

### Asset and coordinates

- Asset: `public/assets/metaverse/minimap/silicon-heartland-metaverse-top-map.png`.
- Verified file: PNG, 1448 x 1086, RGB, non-interlaced.
- Registry: `src/system/metaverse/metaverseMiniMapRegistry.js:11-28`.
- Positions: normalized percentage values, with CSS percentage `left` and
  `top`, over an image background.
- Nine district entries have null coordinates and `UNMAPPED` status.
- Six infrastructure entries have provisional normalized coordinates and no
  destination IDs.
- Master-city positions are maintained separately in
  `src/system/metaverse/metaverseDestinationRelationshipRegistry.js:21-30`.

### State and controls

- Persistent map states are `collapsed`, `compact`, and `expanded` in
  `MetaverseMiniMap.jsx:12-22`.
- State persistence uses `localStorage` with a safe fallback.
- The compact map exposes Recenter, Fit World, and View Full Map controls at
  `MetaverseMiniMap.jsx:262-273`.
- Recenter uses the current district only when a confirmed Quick Map mapping
  exists; Fit World returns to scale 1 and origin 50%/50%.
- The full-map modal reuses `renderMapLayers` rather than a second marker
  implementation.

### Rendering and layers

Current city render order is:

1. background image;
2. district marker buttons;
3. current-student indicator and aggregate student counts;
4. event/opportunity indicators;
5. provisional infrastructure markers;
6. legend and text-equivalent activity content.

District markers are rendered only when `getDistrictQuickMapLocation` returns a
non-`UNMAPPED` mapping (`MetaverseMiniMap.jsx:301-357`). This currently means
the nine canonical districts do not render from the Quick Map registry. The
infrastructure layer is intentionally non-interactive
(`MetaverseMiniMap.jsx:358-371`).

### Interaction and navigation

- District markers are keyboard-capable `button` elements with accessible
  labels (`MetaverseMiniMap.jsx:312-321`).
- Marker activation calls `onSelectDistrict`, supplied as `selectDistrict` by
  `MetaverseCityPage`.
- `selectDistrict` requests protected entry, updates local selection/camera,
  and only enters the district after `canEnterMetaverseResource` succeeds
  (`MetaverseCityPage.jsx:983-998`).
- Fast travel uses `fastTravelApi`, checks `can_enter`, then selects the
  district/facility/activity or returns to the city overview
  (`MetaverseCityPage.jsx:1067-1099`).
- The current map surface itself does not use the Spatial Selection Store or
  Interaction Bus yet.

### Accessibility and motion

- Map toggles expose `aria-expanded`.
- Tabs use `role=tab`, `aria-selected`.
- Layer controls use `aria-pressed`.
- District markers expose full labels and current/live/activity context.
- A text-equivalent district activity list is present.
- Responsive CSS and focus-visible behavior are covered by the existing
  minimap tests.
- `reducedMotion` is passed from the city page; Wave 4 must preserve its
  meaning and verify motion behavior at runtime.

## Regional Baseline

- Regional Quick Map assets are scene-specific and use `aspectRatio` values in
  `regionalSceneRegistry.js`.
- The route sequence is ordered from Oil Rig through the existing city
  (`REGIONAL_ROUTE_SEQUENCE`, lines 11-27).
- Scene-to-destination references are explicitly null (lines 29-33).
- The regional view displays an image, current scene number, west/east labels,
  previous/next metadata, travel direction, and an accessible route overview.
- The current scene marker is decorative (`aria-hidden`) and does not create a
  destination action.

## Preservation Rules

1. Do not replace the image asset or regenerate it.
2. Do not copy master-city coordinates into Quick Map.
3. Do not promote provisional infrastructure to canonical destination data.
4. Do not convert static labels into domain records without source evidence.
5. Do not remove existing protected-entry checks from navigation.
6. Keep visual markers and the semantic list on the same client result set.
7. Keep regional scenes separate from city destination identity.
8. Preserve the current render path, modal behavior, responsive behavior, and
   keyboard semantics until parity evidence supports a change.

## Known Baseline Limitations

- No confirmed production Quick Map district mapping exists.
- No production Quick Map adapter exists.
- Current district selection is local Metaverse page behavior, not shared
  Spatial selection.
- Current static infrastructure points have no source record or destination.
- Regional Quick Map route items have no destination references.
- The exact owner/provenance of live district, event, opportunity, and
  presence inputs must be mapped before publication through Spatial.
