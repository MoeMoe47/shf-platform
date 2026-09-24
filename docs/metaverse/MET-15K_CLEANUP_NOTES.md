# MET-15K — Living City Cleanup Notes

Internal reference only. Planning/reference — no implementation here.

## What changed

The runtime-traced vehicle/traffic system and the runtime-traced
river-motion/rapids system are **RETIRED_FROM_PRODUCTION**:

- Deleted: `MetaverseVehicleLayer.jsx`, `MetaverseTrafficLayer.jsx`,
  `MetaverseRiverMotionLayer.jsx` (and their CSS: `.met-vehicle*`,
  `.met-living-vehicle*`, `.met-river-motion`, `.met-river-rapids-svg`,
  `.met-river-wash`, `.met-river-streak-line*`).
- `MetaverseLivingCityLayer.jsx` no longer imports or mounts any of the
  above; it carries `data-traffic="RETIRED_FROM_PRODUCTION"` and
  `data-river-motion="RETIRED_FROM_PRODUCTION"` on `.met-living-city`.
- Kept as **DEBUG / REFERENCE ONLY** (not imported by anything in the
  production render path): `metaverseRoadTraceRegistry.js`,
  `metaverseRiverFlowRegistry.js`, `livingCityRegistry.js`'s traffic/transit
  path data, `metaverseVehicleMotion.js` (pure interpolation/perspective
  math), `metaverseRiverMotionPresentation.js` (pure clip-path/time-of-day
  math). Each file's header comment says so explicitly.
- `MetaverseRoadTraceDebugLayer.jsx` / `MetaverseRiverFlowDebugLayer.jsx`
  stay mounted — they were already dev-build + explicit query-param gated
  (`?roadTraceDebug=1`, `?riverFlowDebug=1`) and never render for a normal
  learner, so they remain the one legitimate way to inspect the retained
  trace geometry.

## Why

- Vehicle alignment against the production plate read as visibly
  inaccurate.
- Road tracing was not producing believable traffic motion.
- River/rapids tracing was not producing convincing water motion.

## Future direction (MET-16 — not started)

Static city plate + cinematically-aligned motion overlays, hand-placed and
tuned against the actual production DAY/DUSK/NIGHT plates rather than
derived purely from traced polyline geometry.

## Traffic overlay candidate zones (planning only)

Identified from the retained road-trace geometry and MET-15H's manual
alignment audit — these are the segments that visually read as real,
legible roadway on the production plate and are the most promising starting
points for hand-tuned cinematic traffic:

- **Main bridge** — the cable-stayed bridge crossing (FREEWAY_02 /
  BRIDGE_02 area), strong foreground read, clear multi-lane deck.
- **Waterfront freeway / southeast river crossing** — the causeway
  spanning the water on the right side of the plate (FREEWAY_03 / BRIDGE_03
  area); corrected in MET-15H to actually track the deck's rise, so the
  geometry itself is a solid reference even though it's not animated.
- **Central boulevard** — the road running in front of Civic Plaza /
  City Hall (MAJOR_ROAD_04), wide and clearly a primary civic street.
- **Data Center access road / interchange loop** — the curving
  interchange near the Data Center / Treasury area (MAJOR_ROAD_02,
  MAJOR_ROAD_03), good candidate for a slower, local-feeling overlay.
- **Civic approach** — the foreground belt road along the bottom of the
  frame (FREEWAY_01), most prominent/closest-to-camera road on the plate.

## Water overlay candidate zones (planning only)

- **Primary river channel** — the main river body running through the
  center of the city; large, unmistakable, good anchor for any water
  treatment.
- **Confluence** — where the main channel and secondary flow paths meet
  near the center-right of the plate (see `MAIN_FLOW`/`SECONDARY_FLOW` in
  `metaverseRiverFlowRegistry.js`).
- **Rapids/whitewater area** — the zone previously mapped as
  `RAPIDS_ZONE_01`/`TURBULENCE_ZONE_01`, a Grand-Rapids-style broad/shallow
  civic rapids feature; geometry is retained and still the best available
  reference for where a convincing whitewater treatment should sit, even
  though the CSS/SVG approach that rendered it is retired.
- **Reflective waterfront zone** — the calm water in front of Civic Plaza
  / City Hall (`CALM_WATER_COMMUNITY_POND` and the main waterfront in front
  of the fountain plaza), good candidate for a subtle reflection/shimmer
  treatment rather than active flow.

## Explicitly out of scope for this note

No cinematic overlays, video layers, sprite sheets, water masks, or
animated displacement are implemented here. This file is planning
reference for MET-16 only.
