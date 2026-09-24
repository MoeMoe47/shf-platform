// Canonical road-trace registry for the Silicon Heartland Metaverse.
// Geometry only — no vehicle/bus/streak animation is implemented here.
// Coordinates are traced against public/assets/metaverse/city/silicon-heartland-city-master-overview.png
// (1672x941, the only production DAY-equivalent city-overview plate currently
// wired in METAVERSE_PRODUCTION_BACKGROUND_SET) and use the same 0-100 x/y
// scene-percentage convention as METAVERSE_DISTRICT_MARKERS and
// METAVERSE_TRAFFIC_PATHS, which MET-15A's canonical projection
// (metaverseCameraProjection.js) guarantees stays attached to that same
// source-image pixel regardless of viewport size, zoom, or pan.
//
// MET-15K — this geometry itself is NOT retired: it's DEBUG / REFERENCE
// DATA, still consumed by MetaverseRoadTraceDebugLayer.jsx (dev-build +
// ?roadTraceDebug=1 gated, never renders for a normal learner) and kept as
// the geometry reference for the future Cinematic Living City Layer
// (MET-16). What WAS retired is the runtime-traced vehicle animation that
// used to consume this data in production (MetaverseVehicleLayer.jsx /
// MetaverseTrafficLayer.jsx, both deleted) — see
// docs/metaverse/MET-15K_CLEANUP_NOTES.md.

export const METAVERSE_ROAD_TRACE_PATH_TYPES = ["FREEWAY", "MAJOR_ROAD", "DISTRICT_CONNECTOR", "BRIDGE"];

// MET-15C-R Phase 3: a canonical bus route's overall shape. Not every route
// has to return to its own start — a route is only required to be an
// unbroken, continuous polyline, not a closed loop.
export const METAVERSE_ROUTE_TOPOLOGIES = ["LOOP", "LINE", "OUT_AND_BACK"];

export const METAVERSE_ROAD_DEPTH_BANDS = {
  DEPTH_FAR: { minY: 0, maxY: 42 },
  DEPTH_MID: { minY: 42, maxY: 72 },
  DEPTH_NEAR: { minY: 72, maxY: 100 },
};

export function classifyDepthBand(y) {
  if (y <= METAVERSE_ROAD_DEPTH_BANDS.DEPTH_FAR.maxY) return "DEPTH_FAR";
  if (y <= METAVERSE_ROAD_DEPTH_BANDS.DEPTH_MID.maxY) return "DEPTH_MID";
  return "DEPTH_NEAR";
}

// Derived from actual traced points rather than hand-typed, so a path's
// recorded depth coverage can never drift out of sync with its own geometry.
export function computeDepthCoverage(points) {
  const bands = new Set(points.map((point) => classifyDepthBand(point.y)));
  return ["DEPTH_FAR", "DEPTH_MID", "DEPTH_NEAR"].filter((band) => bands.has(band));
}

// Freeway streaks are allowed only on these three ids (MET_ROAD_TRACE_SPEC_V1
// "Freeway Streaks" section) regardless of what an individual path's own
// description says — this list is the single source of truth used both to
// set streakEligible below and to validate it never drifts.
const STREAK_ELIGIBLE_IDS = ["FREEWAY_01", "FREEWAY_02", "FREEWAY_03"];

const RAW_ROAD_TRACES = [
  {
    id: "FREEWAY_01",
    name: "Foreground South Belt",
    sceneId: "silicon-heartland-city",
    pathTypes: ["FREEWAY"],
    points: [
      { x: 27, y: 79 }, { x: 34, y: 83 }, { x: 42, y: 87 }, { x: 50, y: 90 },
      { x: 58, y: 91 }, { x: 66, y: 91 }, { x: 74, y: 90 }, { x: 82, y: 91 },
      { x: 90, y: 92 }, { x: 97, y: 92 },
    ],
    vehicleEligible: true,
    busEligible: false,
    density: "STANDARD",
    notes: "Large foreground multi-lane corridor spanning the bottom of the frame; picks up where FREEWAY_02's cable-stayed approach lands on the east bank (shared endpoint at 27,79) and runs to the right edge.",
  },
  {
    id: "FREEWAY_02",
    name: "Southwest Cable-Stayed Bridge Approach",
    sceneId: "silicon-heartland-city",
    pathTypes: ["FREEWAY", "BRIDGE"],
    points: [
      { x: 11, y: 58 }, { x: 14, y: 61 }, { x: 17, y: 65 }, { x: 19, y: 68 },
      { x: 21, y: 71 }, { x: 23, y: 74 }, { x: 25, y: 77 }, { x: 27, y: 79 },
    ],
    vehicleEligible: true,
    busEligible: false,
    density: "LOW",
    notes: "The twin-pylon cable-stayed bridge on the left side of the plate, from its Data Center District landing down across the river to where it merges into FREEWAY_01.",
  },
  {
    id: "FREEWAY_03",
    name: "Southeast River Crossing",
    sceneId: "silicon-heartland-city",
    pathTypes: ["FREEWAY", "BRIDGE"],
    points: [
      // MET-15H traffic-realism audit: the previous points 5-7 continued
      // descending in a straight line and drifted off the actual deck into
      // open water — the real causeway dips to its lowest on-screen point
      // near the shore (~x=79) then arcs upward as it crosses the water.
      // Re-measured directly against the production dusk plate (pixel grid
      // + lane-marker centerline reading) at every x station below.
      { x: 61, y: 74 }, { x: 67, y: 77 }, { x: 73, y: 81 }, { x: 79, y: 81 },
      { x: 85, y: 79 }, { x: 91, y: 76 }, { x: 97, y: 74 },
    ],
    vehicleEligible: true,
    busEligible: false,
    density: "LOW",
    notes: "The wide lower causeway crossing on the right side of the plate, below and separate from BRIDGE_02's diagonal cable crossing over the same water body.",
  },
  {
    id: "MAJOR_ROAD_01",
    name: "Left Data Center Crescent",
    sceneId: "silicon-heartland-city",
    pathTypes: ["MAJOR_ROAD", "DISTRICT_CONNECTOR"],
    points: [
      { x: 1, y: 58 }, { x: 6, y: 58 }, { x: 12, y: 59 }, { x: 17, y: 61 },
      { x: 21, y: 63 }, { x: 24, y: 60 }, { x: 26, y: 55 }, { x: 27, y: 50 },
    ],
    vehicleEligible: true,
    busEligible: true,
    density: "LOW",
    notes: "Curved road/transit corridor along the south and east edge of the Data Center District campus, from the left frame edge to where it feeds the central interchange. Stops short of the decorative ring drive around the Learning Arcade building above it (see excluded corridors).",
  },
  {
    id: "MAJOR_ROAD_02",
    name: "Central Lower Interchange Arc",
    sceneId: "silicon-heartland-city",
    pathTypes: ["DISTRICT_CONNECTOR"],
    points: [
      // MET-15H traffic-realism audit: the previous rightward bulge (out to
      // x=41) overshot the real ramp's curve and cut diagonally across
      // parkland/a building footprint instead of following the lit road
      // surface. Endpoints kept in place (MAJOR_ROAD_01/04 continuity —
      // see the continuity notes below); the interior curve pulled back to
      // track the ramp's actual, tighter rightward arc.
      { x: 33, y: 48 }, { x: 35, y: 52 }, { x: 36, y: 56 }, { x: 35, y: 61 },
      { x: 33, y: 65 }, { x: 34, y: 69 }, { x: 34, y: 72 },
    ],
    vehicleEligible: true,
    busEligible: true,
    density: "LOW",
    notes: "Curved interchange-ramp arc in the utility/energy/Infrastructure Zone interchange, left-center of the lower half of the plate.",
  },
  {
    id: "MAJOR_ROAD_03",
    name: "Right Office District Loop",
    sceneId: "silicon-heartland-city",
    pathTypes: ["MAJOR_ROAD"],
    points: [
      // MET-15H traffic-realism audit: the previous start (66,38)->(71,41)
      // ->(76,44) ran directly across the office-tower rooftops left of
      // this interchange (no road there at all — confirmed against the
      // production dusk plate). The visible curving interchange road only
      // starts around x=75; points 4-6 (already confirmed onto real
      // pavement down to the BRIDGE_02 join in MET-15C-R) are unchanged.
      { x: 77, y: 42 }, { x: 78, y: 44 }, { x: 79, y: 46 }, { x: 80, y: 49 },
      { x: 82, y: 53 }, { x: 80, y: 57 },
    ],
    vehicleEligible: true,
    busEligible: true,
    density: "LOW",
    // MET-15C-R: retraced the tail. The original (78,53)->(73,52)->(69,48)
    // loop-back didn't reach any real connecting road (nearest neighbor,
    // BRIDGE_02, was 15.62 away). A tight grid crop of x:55-90 y:38-68 shows
    // this curve actually continues downhill and lands directly on
    // BRIDGE_02's east end (~80,57 vs BRIDGE_02's 78,60 — 3.61 apart, real
    // pavement the whole way). Kept as a curving connector, not a literal
    // closed loop (it wasn't one before either).
    notes: "Curving road around the right-center office/waterfront district between Treasury & Commerce and the Community District bridge approach, continuing down to meet BRIDGE_02.",
  },
  {
    id: "MAJOR_ROAD_04",
    name: "Civic Front Cross Axis",
    sceneId: "silicon-heartland-city",
    pathTypes: ["MAJOR_ROAD"],
    points: [
      { x: 29, y: 43 }, { x: 36, y: 44 }, { x: 44, y: 45 }, { x: 48, y: 45 },
      { x: 52, y: 44 }, { x: 56, y: 44 },
    ],
    vehicleEligible: true,
    busEligible: true,
    density: "LOW",
    // MET-15C-R: trimmed the east end. A tight grid crop (x:45-70 y:36-52)
    // shows the visible road/pavement ends around x:56-58, where the
    // Treasury & Commerce tower base begins; the original tail points
    // (58,44) and (63,43) sat on/past the building, which is what made the
    // old MAJOR_ROAD_04->MAJOR_ROAD_03 join a false (building-crossing)
    // connection despite a small numeric distance. This is now the real,
    // confirmed extent of the road — see BUS_ROUTE_01's Civic Circulator
    // out-and-back for the reasoning on why this doesn't reach MAJOR_ROAD_03.
    notes: "Calm east-west road crossing directly in front of (south of) Civic Plaza / the Capitol building, connecting the Learning Arcade area toward Treasury & Commerce until the visible pavement ends at the tower base. Distinct from the pedestrian plaza/fountain promenade directly north of it (excluded, see excluded corridors).",
  },
  {
    id: "BRIDGE_01",
    name: "Central Small Arch Bridge",
    sceneId: "silicon-heartland-city",
    pathTypes: ["BRIDGE", "DISTRICT_CONNECTOR"],
    points: [
      { x: 40, y: 49 }, { x: 44, y: 51 }, { x: 48, y: 52 }, { x: 52, y: 54 }, { x: 56, y: 56 },
    ],
    vehicleEligible: true,
    busEligible: false,
    density: "LOW",
    notes: "The small white arch bridge crossing the central river between the Civic and Treasury & Commerce districts.",
  },
  {
    id: "BRIDGE_02",
    name: "Center-Right Diagonal Bridge",
    sceneId: "silicon-heartland-city",
    pathTypes: ["BRIDGE", "MAJOR_ROAD"],
    points: [
      { x: 59, y: 60 }, { x: 64, y: 62 }, { x: 69, y: 63 }, { x: 74, y: 62 }, { x: 78, y: 60 },
    ],
    vehicleEligible: true,
    busEligible: true,
    density: "LOW",
    notes: "Diagonal cable crossing over the narrower water channel next to the Infrastructure Zone wind turbine, above and distinct from FREEWAY_03's wider causeway.",
  },
  {
    id: "BRIDGE_03",
    name: "Rightmost Low Bridge",
    sceneId: "silicon-heartland-city",
    pathTypes: ["BRIDGE", "DISTRICT_CONNECTOR"],
    points: [
      // MET-15H traffic-realism audit: resolves the reviewOnAssetVariantUpgrade
      // flag below now that DAY/DUSK/NIGHT are in production (MET-15G).
      // The old points sagged well below the actual causeway deck (same
      // systematic error FREEWAY_03 had) and ended up over open water.
      // Re-measured directly against the deck (pixel grid + lane-marker
      // reading); still traced as the same causeway's lower/southern edge,
      // per the interpretive call below, just now tracking its real rise.
      { x: 83, y: 79 }, { x: 88, y: 77 }, { x: 93, y: 75 }, { x: 97, y: 74 },
    ],
    vehicleEligible: true,
    busEligible: true,
    density: "LOW",
    // MET-15C Phase 6: kept explicitly provisional rather than invented or
    // silently accepted as final. validateRoadTraceRegistry() requires a
    // reviewReason whenever provisional is true, and does NOT fail
    // registry integrity because of it — see validateRoadTraceRegistry.
    provisional: true,
    // MET-15H: re-audited now that DAY/DUSK/NIGHT are wired into
    // production (MET-15G) per the original reviewOnAssetVariantUpgrade
    // flag. The interpretive call itself (see reviewReason) still stands —
    // the production plate still shows no fifth independent crossing — so
    // this stays provisional; only the point geometry was re-measured and
    // corrected (see points above). No further asset-variant re-review is
    // pending.
    reviewOnAssetVariantUpgrade: false,
    reviewReason: "INTERPRETIVE CALL: the production plate does not show a fifth, fully independent river crossing distinct from FREEWAY_03. This path is modeled as the low, local-access southern edge of the same eastern causeway structure FREEWAY_03 uses (a shorter, slightly offset span of the same real bridge/causeway pixels), representing the secondary/local character the spec describes rather than inventing a crossing that is not present in the source image.",
  },
];

export const METAVERSE_ROAD_TRACES = RAW_ROAD_TRACES.map((path) => ({
  ...path,
  streakEligible: STREAK_ELIGIBLE_IDS.includes(path.id),
  depthCoverage: computeDepthCoverage(path.points),
  stateClassification: "DECORATIVE",
}));

// MET-15C route-continuity model. Each route resolves to one continuous
// ordered polyline built from explicit, directional segment references
// (Phase 4's {pathId, direction} shape) instead of a flat id list, so a
// route can legitimately traverse the same road twice in opposite
// directions (an out-and-back spur onto a real interchange arc) without
// that being mistaken for a data error. `usesPathIds` is still derived
// below for backward compatibility with MET-15B call sites/tests — this
// file remains the single route authority; nothing else owns route data.
export const METAVERSE_BUS_ROUTES = [
  {
    id: "BUS_ROUTE_01",
    name: "Civic Circulator",
    sceneId: "silicon-heartland-city",
    topology: "OUT_AND_BACK",
    // MET-15C-R redesign (supersedes MET-15C's "Civic Loop"): the original
    // MAJOR_ROAD_04 -> MAJOR_ROAD_03 composition was proven to cross the
    // Treasury & Commerce building block (see MAJOR_ROAD_04's own notes —
    // its trace was also trimmed back to its real, confirmed extent as part
    // of this fix). MAJOR_ROAD_04 does not connect to any other registered
    // road at its east end, so rather than force a connection or fabricate
    // one, the Civic Circulator is a smaller, honest out-and-back shuttle
    // along the full confirmed length of the civic cross axis: out from the
    // interchange hub end (29,43) to the confirmed real-pavement turnaround
    // at (56,44), then back. Every point is on real, previously-validated
    // road; the turnaround itself sits on confirmed pavement (see
    // MAJOR_ROAD_04's MET-15C-R note), not inside a building.
    segments: [
      { pathId: "MAJOR_ROAD_04", direction: "FORWARD" },
      { pathId: "MAJOR_ROAD_04", direction: "REVERSE" },
    ],
    behavior: { density: "RARE", speed: "SLOW", character: "STEADY" },
    stateClassification: "DECORATIVE",
    provisional: false,
    supersedes: "BUS_ROUTE_01 'Civic Loop' (MET-15C, provisional) — see git history for the original MAJOR_ROAD_04 -> MAJOR_ROAD_03 concept and why it was abandoned rather than repaired.",
  },
  {
    id: "BUS_ROUTE_02",
    name: "Data Center to Civic Connector",
    sceneId: "silicon-heartland-city",
    topology: "LINE",
    // Unchanged from MET-15C: MAJOR_ROAD_02 (the interchange arc) only
    // meets the other two roads near its OWN start point (33,48) — 6.32
    // from MAJOR_ROAD_01's end and 6.40 from MAJOR_ROAD_04's start, both
    // visually confirmed on real interchange road (production plate,
    // x:20-45 y:38-60). It is a spur off that hub, not a through-road
    // between them, so the continuous route traverses it out and back
    // (an OUT_AND_BACK detour embedded in an overall point-to-point LINE)
    // before continuing to MAJOR_ROAD_04. No connector needed; no gap
    // exceeds tolerance. MAJOR_ROAD_04 was trimmed at its far (east) end in
    // MET-15C-R, which shortens where this route now terminates but does
    // not affect the MAJOR_ROAD_04 *start* point this route actually joins.
    segments: [
      { pathId: "MAJOR_ROAD_01", direction: "FORWARD" },
      { pathId: "MAJOR_ROAD_02", direction: "FORWARD" },
      { pathId: "MAJOR_ROAD_02", direction: "REVERSE" },
      { pathId: "MAJOR_ROAD_04", direction: "FORWARD" },
    ],
    behavior: { density: "RARE", speed: "SLOW", character: "FUNCTIONAL" },
    stateClassification: "DECORATIVE",
    provisional: false,
  },
  {
    id: "BUS_ROUTE_03",
    name: "East District Shuttle",
    sceneId: "silicon-heartland-city",
    topology: "LINE",
    // MET-15C-R redesign (supersedes MET-15C's "East District Waterfront
    // Loop"): a tight grid crop of x:55-90 y:38-68 shows MAJOR_ROAD_03's
    // curve actually continues downhill past its old (69,48) endpoint and
    // lands directly on BRIDGE_02's east end — MAJOR_ROAD_03 was retraced
    // to follow that real pavement (see its own notes), closing what is
    // now a 3.61-unit gap to BRIDGE_02, well within tolerance. BRIDGE_03
    // still does not connect to this pair (closest remaining gap ~22.6,
    // crossing the Community District waterfront park/pond) and is
    // deliberately NOT part of this route — it stays a separate,
    // independently provisional road (see BRIDGE_03). This is a one-way
    // LINE from the Infrastructure Zone/turbine end of BRIDGE_02 up into
    // the Right Office District, not a loop — the visible geometry does
    // not support closing a loop back to the start.
    segments: [
      { pathId: "BRIDGE_02", direction: "FORWARD" },
      { pathId: "MAJOR_ROAD_03", direction: "REVERSE" },
    ],
    behavior: { density: "RARE", speed: "SLOW", character: "SMOOTH" },
    stateClassification: "DECORATIVE",
    provisional: false,
    supersedes: "BUS_ROUTE_03 'East District Waterfront Loop' (MET-15C, provisional) — see git history for the original MAJOR_ROAD_03 -> BRIDGE_02 -> BRIDGE_03 concept and why BRIDGE_03 was dropped rather than repaired.",
  },
].map((route) => ({
  ...route,
  usesPathIds: route.segments.map((segment) => segment.pathId),
}));

// Roads/scenery areas visually considered and intentionally NOT traced as
// traffic-eligible corridors (MET_ROAD_TRACE_SPEC_V1 "No-Traffic Zones").
// Documented per MET-15B Phase 6 rather than silently omitted.
export const METAVERSE_EXCLUDED_ROAD_CORRIDORS = [
  {
    area: "Learning Arcade ring drive",
    approxRegion: { x: [24, 38], y: [33, 42] },
    excludedAs: "decorative internal loop",
    reason: "Circular drive directly encircling the donut-shaped Learning Arcade building; reads as a building ring, not a through-road.",
  },
  {
    area: "Civic Plaza ceremonial approach",
    approxRegion: { x: [40, 56], y: [22, 42] },
    excludedAs: "landscaped civic path / pedestrian promenade",
    reason: "Symmetrical fountain plaza and diagonal walkways directly in front of the Capitol building; a pedestrian civic space, not a vehicle road.",
  },
  {
    area: "Community District waterfront park path",
    approxRegion: { x: [78, 92], y: [46, 60] },
    excludedAs: "park walkway",
    reason: "Winding decorative pond and landscaped walking path beside the Community District building.",
  },
  {
    area: "Student Life / Community District residential streets",
    approxRegion: { x: [84, 100], y: [28, 44] },
    excludedAs: "tiny far-background street",
    reason: "Fine local streets inside the residential blocks at the far right edge; too small/ambiguous at this render distance to trace confidently.",
  },
  {
    area: "Infrastructure Zone solar-farm access lanes",
    approxRegion: { x: [46, 58], y: [76, 90] },
    excludedAs: "ambiguous service lane",
    reason: "Short access lanes between solar panel arrays near the wind turbine; service-lane character, not a through-road.",
  },
  {
    area: "Data Center drop-off apron",
    approxRegion: { x: [4, 20], y: [40, 46] },
    excludedAs: "building drop-off loop",
    reason: "Paved apron/plaza directly in front of the Data Center District buildings.",
  },
];

export function getRoadTraceById(id) {
  return METAVERSE_ROAD_TRACES.find((path) => path.id === id) || null;
}

export function getRoadTracesForScene(sceneId) {
  return METAVERSE_ROAD_TRACES.filter((path) => path.sceneId === sceneId);
}

export function getBusRouteById(id) {
  return METAVERSE_BUS_ROUTES.find((route) => route.id === id) || null;
}

export const METAVERSE_ROUTE_DIRECTIONS = ["FORWARD", "REVERSE"];

// Chosen from the MET-15C Phase 2 audit: every endpoint gap visually
// confirmed to sit on real, continuous interchange road (independently
// traced segments meeting at the same hub) measured 5.83-7.8 units; every
// gap visually confirmed to cross non-road space (buildings, park/pond)
// measured 15+ units. 8.0 sits between those two clusters. This was picked
// from that evidence, not raised after the fact to make a route pass.
export const METAVERSE_ROUTE_CONTINUITY_TOLERANCE = 8;

// Resolves a bus route's segments to their point arrays, applying point
// reversal for direction: "REVERSE" segments. This is the one place segment
// direction is interpreted — resolveBusRoutePoints and
// getBusRouteContinuityReport both build on it, so there is a single route
// authority for direction semantics.
export function resolveBusRouteSegments(routeId) {
  const route = getBusRouteById(routeId);
  if (!route) return [];
  return route.segments.map((segment) => {
    const path = getRoadTraceById(segment.pathId);
    const points = !path ? [] : segment.direction === "REVERSE" ? [...path.points].reverse() : path.points;
    return { ...segment, points };
  });
}

// Reports the endpoint gap between every consecutive pair of segments in a
// route's authored order, without applying any tolerance-hiding: every gap
// is reported, `withinTolerance` just flags which ones a future movement
// engine could treat as effectively continuous.
export function getBusRouteContinuityReport(routeId) {
  const segments = resolveBusRouteSegments(routeId);
  const gaps = [];
  for (let i = 0; i < segments.length - 1; i += 1) {
    const from = segments[i];
    const to = segments[i + 1];
    const fromPoint = from.points[from.points.length - 1];
    const toPoint = to.points[0];
    if (!fromPoint || !toPoint) {
      gaps.push({
        fromPathId: from.pathId, fromDirection: from.direction, fromPoint: fromPoint || null,
        toPathId: to.pathId, toDirection: to.direction, toPoint: toPoint || null,
        distance: null, withinTolerance: false,
      });
      continue;
    }
    const distance = Math.hypot(fromPoint.x - toPoint.x, fromPoint.y - toPoint.y);
    gaps.push({
      fromPathId: from.pathId, fromDirection: from.direction, fromPoint,
      toPathId: to.pathId, toDirection: to.direction, toPoint,
      distance, withinTolerance: distance <= METAVERSE_ROUTE_CONTINUITY_TOLERANCE,
    });
  }
  return { routeId, gaps, continuous: gaps.length > 0 && gaps.every((gap) => gap.withinTolerance) };
}

// Resolves a bus route to an explicit, directly-usable, deduplicated point
// array by concatenating its segments' (direction-aware) points in order.
// Consecutive exact-duplicate points at segment joins are dropped (Phase 4
// endpoint deduplication) so a route never contains a zero-length hop.
// Segments whose neighbor exceeds METAVERSE_ROUTE_CONTINUITY_TOLERANCE are
// still concatenated (see getBusRouteContinuityReport for the honest gap
// report) rather than silently dropped — a route that isn't fully
// continuous should still resolve to *something* inspectable, with its
// `provisional`/`reviewReason` fields carrying the caveat.
export function resolveBusRoutePoints(routeId) {
  const segments = resolveBusRouteSegments(routeId);
  const points = [];
  for (const segment of segments) {
    for (const point of segment.points) {
      const prev = points[points.length - 1];
      if (prev && prev.x === point.x && prev.y === point.y) continue;
      points.push(point);
    }
  }
  return points;
}

export function validateRoadTraceRegistry() {
  const errors = [];
  const seenIds = new Set();

  for (const path of METAVERSE_ROAD_TRACES) {
    if (!path.id || !path.sceneId) errors.push(`Road trace missing identity: ${path.id}`);
    if (seenIds.has(path.id)) errors.push(`Duplicate road trace id: ${path.id}`);
    seenIds.add(path.id);
    if (!Array.isArray(path.points) || path.points.length < 3) {
      errors.push(`Road trace ${path.id} needs at least 3 points to represent a real polyline`);
    }
    for (const point of path.points || []) {
      if (point.x < 0 || point.x > 100 || point.y < 0 || point.y > 100) {
        errors.push(`Road trace ${path.id} point out of scene bounds: ${JSON.stringify(point)}`);
      }
    }
    if (!Array.isArray(path.pathTypes) || path.pathTypes.length === 0) {
      errors.push(`Road trace ${path.id} missing pathTypes`);
    }
    for (const type of path.pathTypes || []) {
      if (!METAVERSE_ROAD_TRACE_PATH_TYPES.includes(type)) {
        errors.push(`Road trace ${path.id} has invalid pathType ${type}`);
      }
    }
    if (path.stateClassification !== "DECORATIVE") {
      errors.push(`Road trace ${path.id} must stay DECORATIVE`);
    }
    if (path.streakEligible && !STREAK_ELIGIBLE_IDS.includes(path.id)) {
      errors.push(`Road trace ${path.id} is streak-eligible but not in the approved freeway streak list`);
    }
    // MET-15C Phase 6: a road may be provisional (see BRIDGE_03), but that
    // status must be honest and documented, not a silent integrity hole.
    if (path.provisional && !path.reviewReason) {
      errors.push(`Road trace ${path.id} is marked provisional but has no reviewReason`);
    }
  }

  const roadIds = new Set(METAVERSE_ROAD_TRACES.map((path) => path.id));
  const seenRouteIds = new Set();
  for (const route of METAVERSE_BUS_ROUTES) {
    if (!route.id || !route.sceneId) errors.push(`Bus route missing identity: ${route.id}`);
    if (seenRouteIds.has(route.id)) errors.push(`Duplicate bus route id: ${route.id}`);
    seenRouteIds.add(route.id);

    if (!Array.isArray(route.segments) || route.segments.length === 0) {
      errors.push(`Bus route ${route.id} has no segments`);
    }
    for (let i = 0; i < (route.segments || []).length; i += 1) {
      const segment = route.segments[i];
      if (!segment.pathId || !roadIds.has(segment.pathId)) {
        errors.push(`Bus route ${route.id} segment ${i} references unknown road trace ${segment.pathId}`);
      }
      if (!METAVERSE_ROUTE_DIRECTIONS.includes(segment.direction)) {
        errors.push(`Bus route ${route.id} segment ${i} (${segment.pathId}) has invalid direction ${segment.direction}`);
      }
      const next = route.segments[i + 1];
      if (next && next.pathId === segment.pathId && next.direction === segment.direction) {
        errors.push(`Bus route ${route.id} has a redundant duplicate consecutive segment: ${segment.pathId}/${segment.direction}`);
      }
    }

    if (route.stateClassification !== "DECORATIVE") {
      errors.push(`Bus route ${route.id} must stay DECORATIVE`);
    }

    // MET-15C-R Phase 3: topology is optional metadata, but if present it
    // must be one of the three recognized shapes.
    if (route.topology && !METAVERSE_ROUTE_TOPOLOGIES.includes(route.topology)) {
      errors.push(`Bus route ${route.id} has invalid topology ${route.topology}`);
    }

    // MET-15C Phase 6 pattern reused at the route level: a route may be
    // provisional, but only with a documented reason.
    if (route.provisional && !route.reviewReason) {
      errors.push(`Bus route ${route.id} is marked provisional but has no reviewReason`);
    }

    const resolvedPoints = resolveBusRoutePoints(route.id);
    if (resolvedPoints.length < 2) {
      errors.push(`Bus route ${route.id} does not resolve to a usable path (zero-length route)`);
    }
    for (const point of resolvedPoints) {
      if (point.x < 0 || point.x > 100 || point.y < 0 || point.y > 100) {
        errors.push(`Bus route ${route.id} resolved point out of scene bounds: ${JSON.stringify(point)}`);
      }
    }
    for (let i = 1; i < resolvedPoints.length; i += 1) {
      const prev = resolvedPoints[i - 1];
      const curr = resolvedPoints[i];
      if (prev.x === curr.x && prev.y === curr.y) {
        errors.push(`Bus route ${route.id} has a duplicate adjacent point at index ${i} (zero-length hop)`);
      }
    }

    // A route not marked provisional is a claim that it is actually
    // continuous — hold it to that. A provisional route is allowed to have
    // gaps (that is the point of marking it provisional), but only if the
    // gap is the one already documented in reviewReason, not a silent new
    // one — enforced loosely here by requiring reviewReason to exist
    // (checked above) rather than re-parsing free text.
    if (!route.provisional) {
      const continuity = getBusRouteContinuityReport(route.id);
      for (const gap of continuity.gaps) {
        if (!gap.withinTolerance) {
          errors.push(
            `Bus route ${route.id} claims continuity but ${gap.fromPathId}(${gap.fromDirection}) -> ${gap.toPathId}(${gap.toDirection}) gap is ${gap.distance?.toFixed(2)}, exceeding tolerance ${METAVERSE_ROUTE_CONTINUITY_TOLERANCE}`,
          );
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
