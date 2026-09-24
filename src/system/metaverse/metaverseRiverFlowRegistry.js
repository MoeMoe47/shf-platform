// Canonical river-flow / water-zone registry for the Silicon Heartland
// Metaverse. Geometry and zone mapping only — no water/rapids animation is
// implemented here. Traced against
// public/assets/metaverse/city/silicon-heartland-city-master-overview.png
// (1672x941, the same production plate metaverseRoadTraceRegistry.js was
// traced against) using the same 0-100 x/y scene-percentage convention, so
// MET-15A's canonical projection keeps this aligned regardless of viewport,
// zoom, or pan. Reuses metaverseRoadTraceRegistry.js conventions
// (sceneId, DECORATIVE classification, a validate*Registry() function)
// rather than creating a second system.
//
// MET-15K — this geometry itself is NOT retired: it's DEBUG / REFERENCE
// DATA, still consumed by MetaverseRiverFlowDebugLayer.jsx (dev-build +
// ?riverFlowDebug=1 gated, never renders for a normal learner) and kept as
// the geometry reference for the future Cinematic Living City Layer
// (MET-16). What WAS retired is the runtime-traced rapids/water-motion
// animation that used to consume this data in production
// (MetaverseRiverMotionLayer.jsx, deleted) — see
// docs/metaverse/MET-15K_CLEANUP_NOTES.md. The static water baked into the
// accepted DAY/DUSK/NIGHT background images is untouched by any of this.

import { getRoadTraceById } from "./metaverseRoadTraceRegistry.js";

export const METAVERSE_WATER_FLOW_TYPES = ["MAIN_FLOW", "SECONDARY_FLOW", "RAPIDS_FLOW", "TURBULENCE_FLOW"];

export const METAVERSE_WATER_ZONE_TYPES = [
  "CALM_WATER",
  "FLOWING_WATER",
  "RAPIDS_ZONE",
  "TURBULENCE_ZONE",
  "BRIDGE_DISTURBANCE",
  "NO_EFFECT_BUFFER",
];

const SCENE_ID = "silicon-heartland-city";

// Visible water footprint, traced as named regions rather than one blob so
// later phases can reason about "which body is this zone/path in." Each
// region's boundingBox is descriptive (what was visually confirmed), not
// itself an authoritative shape — zones/paths below carry the actual
// geometry. SOUTHWEST_CHANNEL and COMMUNITY_POND are explicitly NOT
// connected to the main channel in this production plate (checked: the
// land between them — Infrastructure Zone / Data Center interchange, and
// Community District parkland, respectively — has no visible water gap) —
// documented here rather than inventing a hidden connector.
export const METAVERSE_WATER_FOOTPRINT_REGIONS = [
  {
    id: "NORTH_CONFLUENCE",
    sceneId: SCENE_ID,
    boundingBox: { x: [34, 58], y: [42, 58] },
    connectedTo: ["CENTRAL_BASIN"],
    notes: "Narrow headwaters-looking stretch directly south of Civic Plaza / the Capitol, where the river is at its narrowest visible point.",
  },
  {
    id: "CENTRAL_BASIN",
    sceneId: SCENE_ID,
    boundingBox: { x: [38, 62], y: [48, 65] },
    connectedTo: ["NORTH_CONFLUENCE", "TURBINE_CROSSING"],
    notes: "Widens near Treasury & Commerce / the small arch bridge (BRIDGE_01).",
  },
  {
    id: "TURBINE_CROSSING",
    sceneId: SCENE_ID,
    boundingBox: { x: [57, 82], y: [55, 68] },
    connectedTo: ["CENTRAL_BASIN", "EAST_CAUSEWAY_CHANNEL"],
    notes: "Water around the Infrastructure Zone wind turbine, crossed by the diagonal cable bridge (BRIDGE_02).",
  },
  {
    id: "EAST_CAUSEWAY_CHANNEL",
    sceneId: SCENE_ID,
    boundingBox: { x: [59, 100], y: [70, 90] },
    connectedTo: ["TURBINE_CROSSING"],
    notes: "Continues past the Community District to the right frame edge, crossed by the FREEWAY_03/BRIDGE_03 causeway.",
  },
  {
    id: "SOUTHWEST_CHANNEL",
    sceneId: SCENE_ID,
    boundingBox: { x: [0, 40], y: [74, 94] },
    connectedTo: [],
    notes: "Crossed by the FREEWAY_02 cable-stayed bridge, exits the left frame edge. NOT visibly connected to the main channel in this plate — the Infrastructure Zone/Data Center interchange landmass sits between them (checked x:15-52 y:55-85, all land). Modeled as its own SECONDARY_FLOW rather than assuming a hidden connection.",
  },
  {
    id: "COMMUNITY_POND",
    sceneId: SCENE_ID,
    boundingBox: { x: [78, 93], y: [53, 61] },
    connectedTo: [],
    notes: "Small decorative winding pond beside the Community District building, fully surrounded by landscaped park. No visible inlet/outlet to the main river — modeled as an isolated CALM_WATER body.",
  },
];

const RAW_RIVER_FLOW_PATHS = [
  {
    id: "MAIN_FLOW_01",
    name: "Central Channel Downstream Flow",
    sceneId: SCENE_ID,
    waterType: "MAIN_FLOW",
    points: [
      { x: 43, y: 48 }, { x: 41, y: 53 }, { x: 44, y: 57 }, { x: 49, y: 59 }, { x: 55, y: 61 },
      { x: 62, y: 63 }, { x: 70, y: 66 }, { x: 80, y: 74 }, { x: 89, y: 79 }, { x: 97, y: 83 },
    ],
    notes: "The main navigable channel through NORTH_CONFLUENCE -> CENTRAL_BASIN (passing just south of BRIDGE_01 and through RAPIDS_ZONE_01) -> TURBINE_CROSSING (past BRIDGE_02) -> EAST_CAUSEWAY_CHANNEL. Direction is a presentation choice (generally civic-core toward the east causeway), not derived from any current in the artwork. Every point checked >=2 units clear of the nearest road/bridge trace.",
  },
  {
    id: "SECONDARY_FLOW_01",
    name: "Southwest Channel Flow",
    sceneId: SCENE_ID,
    waterType: "SECONDARY_FLOW",
    points: [
      { x: 39, y: 75 }, { x: 30, y: 79 }, { x: 20, y: 83 }, { x: 10, y: 87 }, { x: 2, y: 90 },
    ],
    notes: "SOUTHWEST_CHANNEL only. Not assumed to be hydrologically the same current as MAIN_FLOW_01 given the two are not visibly connected in-frame.",
  },
  {
    id: "RAPIDS_FLOW_01",
    name: "Civic Rapids Flow",
    sceneId: SCENE_ID,
    waterType: "RAPIDS_FLOW",
    points: [
      { x: 45, y: 59 }, { x: 49, y: 59 }, { x: 53, y: 60 }, { x: 56, y: 61 },
    ],
    notes: "Localized flow direction inside RAPIDS_ZONE_01 only — see that zone for the civic/urban Grand-Rapids-style rapids framing.",
  },
  {
    id: "TURBULENCE_FLOW_01",
    name: "Bridge-Pier Turbulence Flow",
    sceneId: SCENE_ID,
    waterType: "TURBULENCE_FLOW",
    points: [
      { x: 62, y: 60 }, { x: 65, y: 61 }, { x: 68, y: 62 },
    ],
    notes: "Secondary, smaller turbulence near the BRIDGE_02 pier bases — support detail, not the main rapids destination.",
  },
];

export const METAVERSE_RIVER_FLOW_PATHS = RAW_RIVER_FLOW_PATHS.map((path) => ({
  ...path,
  stateClassification: "DECORATIVE",
}));

// Resolves a zone's geometry to a concrete point array. Zones either carry
// their own traced polygon, or (for bridge-disturbance zones) reference an
// existing canonical road trace by id so the water zone can never drift out
// of sync with that bridge's own geometry — one owner for bridge shape,
// reused here rather than re-typed.
export function resolveWaterZoneGeometryPoints(zone) {
  if (zone.geometry.points) return zone.geometry.points;
  if (zone.geometry.pathId) return getRoadTraceById(zone.geometry.pathId)?.points || [];
  return [];
}

const RAW_WATER_ZONES = [
  {
    id: "RAPIDS_ZONE_01",
    type: "RAPIDS_ZONE",
    sceneId: SCENE_ID,
    geometry: {
      shape: "polygon",
      points: [
        { x: 45, y: 58 }, { x: 56, y: 57 }, { x: 58, y: 60 }, { x: 55, y: 63 }, { x: 47, y: 63 }, { x: 44, y: 61 },
      ],
    },
    rapidsAssetsAllowed: true,
    flowStreakOverlaysAllowed: true,
    notes: "Canonical main rapids zone. Sits inside CENTRAL_BASIN, directly downstream (south) of BRIDGE_01's arch span, between the Treasury & Commerce shoreline and the Infrastructure Zone shoreline — a civic destination framing, inspired by the broad/shallow/urban rapids near the convention center in Grand Rapids, MI (not wilderness, not a waterfall). Grid-confirmed as a wide, clear open-water basin (x:44-58 y:57-63) with no road/interchange crossing it, bounded above by BRIDGE_01 and the MAJOR_ROAD_02 interchange, below by the Infrastructure Zone shore, and east by BRIDGE_02's approach. Geometrically verified (point-in-polygon AND line-segment intersection against every one of the 10 canonical road traces, not just a bounding-box check) to have zero overlap. Bounded — does not span the river system. (An earlier candidate immediately west of BRIDGE_01 was rejected after this same check found it crossed MAJOR_ROAD_02.)",
  },
  {
    id: "TURBULENCE_ZONE_01",
    type: "TURBULENCE_ZONE",
    sceneId: SCENE_ID,
    geometry: {
      shape: "polygon",
      points: [
        { x: 62, y: 58 }, { x: 68, y: 58 }, { x: 68, y: 63 }, { x: 62, y: 63 },
      ],
    },
    rapidsAssetsAllowed: false,
    flowStreakOverlaysAllowed: true,
    notes: "Secondary/support zone around the BRIDGE_02 pier bases in TURBINE_CROSSING. Smaller and subtler than the main rapids — bridge-pier disturbance character, not a second destination feature.",
  },
  {
    id: "FLOWING_WATER_MAIN",
    type: "FLOWING_WATER",
    sceneId: SCENE_ID,
    geometry: { shape: "band", points: RAW_RIVER_FLOW_PATHS[0].points },
    rapidsAssetsAllowed: false,
    flowStreakOverlaysAllowed: true,
    notes: "General flowing-water character along MAIN_FLOW_01, outside the localized RAPIDS_ZONE_01/TURBULENCE_ZONE_01 pockets.",
  },
  {
    id: "FLOWING_WATER_SOUTHWEST",
    type: "FLOWING_WATER",
    sceneId: SCENE_ID,
    geometry: { shape: "band", points: RAW_RIVER_FLOW_PATHS[1].points },
    rapidsAssetsAllowed: false,
    flowStreakOverlaysAllowed: true,
    notes: "General flowing-water character along the SOUTHWEST_CHANNEL.",
  },
  {
    id: "CALM_WATER_COMMUNITY_POND",
    type: "CALM_WATER",
    sceneId: SCENE_ID,
    geometry: {
      shape: "polygon",
      points: [
        { x: 82, y: 55 }, { x: 85, y: 54 }, { x: 87, y: 58 }, { x: 85, y: 60 }, { x: 82, y: 59 }, { x: 81, y: 57 },
      ],
    },
    rapidsAssetsAllowed: false,
    flowStreakOverlaysAllowed: false,
    notes: "Isolated decorative pond — no current, no rapids/streak eligibility. Narrow winding shape verified clear of MAJOR_ROAD_03's approach to BRIDGE_02 (its nearest point, (80,57), sits just outside this polygon's western tip).",
  },
  {
    id: "BRIDGE_DISTURBANCE_BRIDGE_01",
    type: "BRIDGE_DISTURBANCE",
    sceneId: SCENE_ID,
    geometry: { shape: "band", pathId: "BRIDGE_01" },
    rapidsAssetsAllowed: false,
    flowStreakOverlaysAllowed: false,
    notes: "Directly under the small arch bridge deck — reserved for future pier-wake detail only, not general rapids/streak overlays.",
  },
  {
    id: "BRIDGE_DISTURBANCE_BRIDGE_02",
    type: "BRIDGE_DISTURBANCE",
    sceneId: SCENE_ID,
    geometry: { shape: "band", pathId: "BRIDGE_02" },
    rapidsAssetsAllowed: false,
    flowStreakOverlaysAllowed: false,
    notes: "Directly under the diagonal cable bridge deck.",
  },
  {
    id: "BRIDGE_DISTURBANCE_BRIDGE_03",
    type: "BRIDGE_DISTURBANCE",
    sceneId: SCENE_ID,
    geometry: { shape: "band", pathId: "BRIDGE_03" },
    rapidsAssetsAllowed: false,
    flowStreakOverlaysAllowed: false,
    notes: "Directly under the (independently provisional — see metaverseRoadTraceRegistry.js BRIDGE_03) low causeway span.",
  },
  {
    id: "BRIDGE_DISTURBANCE_FREEWAY_02",
    type: "BRIDGE_DISTURBANCE",
    sceneId: SCENE_ID,
    geometry: { shape: "band", pathId: "FREEWAY_02" },
    rapidsAssetsAllowed: false,
    flowStreakOverlaysAllowed: false,
    notes: "Directly under the southwest cable-stayed bridge deck.",
  },
  {
    id: "BRIDGE_DISTURBANCE_FREEWAY_03",
    type: "BRIDGE_DISTURBANCE",
    sceneId: SCENE_ID,
    geometry: { shape: "band", pathId: "FREEWAY_03" },
    rapidsAssetsAllowed: false,
    flowStreakOverlaysAllowed: false,
    notes: "Directly under the southeast river-crossing causeway deck.",
  },
  {
    id: "NO_EFFECT_BUFFER_CIVIC_SHORE",
    type: "NO_EFFECT_BUFFER",
    sceneId: SCENE_ID,
    geometry: { shape: "polygon", points: [{ x: 34, y: 40 }, { x: 58, y: 40 }, { x: 58, y: 49 }, { x: 34, y: 49 }] },
    rapidsAssetsAllowed: false,
    flowStreakOverlaysAllowed: false,
    notes: "North shoreline margin below Civic Plaza / the light-rail viaduct, immediately upstream of RAPIDS_ZONE_01. Keeps rapids/streak overlays from spilling onto the plaza or the road.",
  },
  {
    id: "NO_EFFECT_BUFFER_INFRASTRUCTURE_SOUTH_SHORE",
    type: "NO_EFFECT_BUFFER",
    sceneId: SCENE_ID,
    geometry: { shape: "polygon", points: [{ x: 36, y: 65 }, { x: 58, y: 65 }, { x: 58, y: 80 }, { x: 36, y: 80 }] },
    rapidsAssetsAllowed: false,
    flowStreakOverlaysAllowed: false,
    notes: "South shoreline margin at the Infrastructure Zone plaza/solar farm, between CENTRAL_BASIN and SOUTHWEST_CHANNEL's landmass gap.",
  },
];

export const METAVERSE_WATER_ZONES = RAW_WATER_ZONES.map((zone) => ({
  ...zone,
  stateClassification: "DECORATIVE",
}));

// Areas future rapids/water overlays must never spill into. Reuses/extends
// the MET-15B excluded road corridors that happen to double as riverbank
// land, plus bridge decks and shoreline roads by reference (no re-typed
// coordinates for anything already owned by metaverseRoadTraceRegistry.js).
export const METAVERSE_WATER_EXCLUSION_ZONES = [
  {
    id: "EXCLUDE_CIVIC_PLAZA",
    area: "Civic Plaza / Capitol fountain plaza",
    excludedAs: "plaza",
    approxRegion: { x: [40, 56], y: [22, 42] },
    reason: "Pedestrian civic plaza directly north of RAPIDS_ZONE_01 — same area already excluded from road traces in MET-15B.",
  },
  {
    id: "EXCLUDE_DATA_CENTER_SHORE",
    area: "Data Center District campus/buildings",
    excludedAs: "building",
    approxRegion: { x: [0, 34], y: [40, 50] },
    reason: "Data Center District buildings and grounds along the NORTH_CONFLUENCE/CENTRAL_BASIN north shore.",
  },
  {
    id: "EXCLUDE_TREASURY_SHORE",
    area: "Treasury & Commerce towers",
    excludedAs: "building",
    approxRegion: { x: [46, 70], y: [38, 50] },
    reason: "Treasury & Commerce tower block along the CENTRAL_BASIN north shore.",
  },
  {
    id: "EXCLUDE_COMMUNITY_RIVERWALK",
    area: "Community District waterfront park path",
    excludedAs: "riverwalk edge",
    approxRegion: { x: [76, 94], y: [44, 62] },
    reason: "Landscaped walking path directly bordering COMMUNITY_POND — same area already excluded from road traces in MET-15B.",
  },
  {
    id: "EXCLUDE_INFRASTRUCTURE_RETAINING_WALL",
    area: "Infrastructure Zone plaza / solar farm retaining edge",
    excludedAs: "retaining wall",
    approxRegion: { x: [36, 58], y: [65, 82] },
    reason: "Paved plaza and solar array grounds along the CENTRAL_BASIN/TURBINE_CROSSING south shore.",
  },
  { id: "EXCLUDE_BRIDGE_DECK_BRIDGE_01", area: "BRIDGE_01 deck", excludedAs: "bridge deck", pathId: "BRIDGE_01", reason: "Bridge deck surface — see BRIDGE_DISTURBANCE_BRIDGE_01 for the below-deck water zone." },
  { id: "EXCLUDE_BRIDGE_DECK_BRIDGE_02", area: "BRIDGE_02 deck", excludedAs: "bridge deck", pathId: "BRIDGE_02", reason: "Bridge deck surface." },
  { id: "EXCLUDE_BRIDGE_DECK_BRIDGE_03", area: "BRIDGE_03 deck", excludedAs: "bridge deck", pathId: "BRIDGE_03", reason: "Bridge deck surface (BRIDGE_03 itself remains independently provisional)." },
  { id: "EXCLUDE_BRIDGE_DECK_FREEWAY_02", area: "FREEWAY_02 deck", excludedAs: "bridge deck", pathId: "FREEWAY_02", reason: "Cable-stayed bridge deck surface." },
  { id: "EXCLUDE_BRIDGE_DECK_FREEWAY_03", area: "FREEWAY_03 deck", excludedAs: "bridge deck", pathId: "FREEWAY_03", reason: "Causeway deck surface." },
  { id: "EXCLUDE_ROAD_MAJOR_ROAD_01", area: "MAJOR_ROAD_01 (Data Center Crescent)", excludedAs: "road", pathId: "MAJOR_ROAD_01", reason: "Runs directly along the NORTH_CONFLUENCE north shore." },
  { id: "EXCLUDE_ROAD_FREEWAY_01", area: "FREEWAY_01 (Foreground South Belt)", excludedAs: "road", pathId: "FREEWAY_01", reason: "Runs along the EAST_CAUSEWAY_CHANNEL/SOUTHWEST_CHANNEL south shore in places." },
];

export function getRiverFlowPathById(id) {
  return METAVERSE_RIVER_FLOW_PATHS.find((path) => path.id === id) || null;
}

export function getWaterZoneById(id) {
  return METAVERSE_WATER_ZONES.find((zone) => zone.id === id) || null;
}

export function getWaterZonesForScene(sceneId) {
  return METAVERSE_WATER_ZONES.filter((zone) => zone.sceneId === sceneId);
}

export function getRiverFlowPathsForScene(sceneId) {
  return METAVERSE_RIVER_FLOW_PATHS.filter((path) => path.sceneId === sceneId);
}

export function validateRiverFlowRegistry() {
  const errors = [];

  const seenPathIds = new Set();
  for (const path of METAVERSE_RIVER_FLOW_PATHS) {
    if (!path.id || !path.sceneId) errors.push(`River flow path missing identity: ${path.id}`);
    if (seenPathIds.has(path.id)) errors.push(`Duplicate river flow path id: ${path.id}`);
    seenPathIds.add(path.id);
    if (!Array.isArray(path.points) || path.points.length === 0) errors.push(`River flow path ${path.id} has no points`);
    for (const point of path.points || []) {
      if (point.x < 0 || point.x > 100 || point.y < 0 || point.y > 100) {
        errors.push(`River flow path ${path.id} point out of scene bounds: ${JSON.stringify(point)}`);
      }
    }
    if (!METAVERSE_WATER_FLOW_TYPES.includes(path.waterType)) {
      errors.push(`River flow path ${path.id} has invalid waterType ${path.waterType}`);
    }
    if (path.stateClassification !== "DECORATIVE") {
      errors.push(`River flow path ${path.id} must stay DECORATIVE`);
    }
  }

  const seenZoneIds = new Set();
  for (const zone of METAVERSE_WATER_ZONES) {
    if (!zone.id || !zone.sceneId) errors.push(`Water zone missing identity: ${zone.id}`);
    if (seenZoneIds.has(zone.id)) errors.push(`Duplicate water zone id: ${zone.id}`);
    seenZoneIds.add(zone.id);
    if (!METAVERSE_WATER_ZONE_TYPES.includes(zone.type)) {
      errors.push(`Water zone ${zone.id} has invalid type ${zone.type}`);
    }
    const points = resolveWaterZoneGeometryPoints(zone);
    if (!Array.isArray(points) || points.length === 0) {
      errors.push(`Water zone ${zone.id} resolves to no geometry`);
    }
    for (const point of points) {
      if (point.x < 0 || point.x > 100 || point.y < 0 || point.y > 100) {
        errors.push(`Water zone ${zone.id} point out of scene bounds: ${JSON.stringify(point)}`);
      }
    }
    if (typeof zone.rapidsAssetsAllowed !== "boolean") errors.push(`Water zone ${zone.id} missing rapidsAssetsAllowed`);
    if (typeof zone.flowStreakOverlaysAllowed !== "boolean") errors.push(`Water zone ${zone.id} missing flowStreakOverlaysAllowed`);
    if (zone.type !== "RAPIDS_ZONE" && zone.rapidsAssetsAllowed) {
      errors.push(`Water zone ${zone.id} allows rapids assets but is not a RAPIDS_ZONE`);
    }
    if (zone.stateClassification !== "DECORATIVE") errors.push(`Water zone ${zone.id} must stay DECORATIVE`);
  }

  if (!METAVERSE_WATER_ZONES.some((zone) => zone.type === "RAPIDS_ZONE")) {
    errors.push("No canonical RAPIDS_ZONE is defined");
  }

  const seenExclusionIds = new Set();
  for (const exclusion of METAVERSE_WATER_EXCLUSION_ZONES) {
    if (!exclusion.id) errors.push("Water exclusion zone missing id");
    if (seenExclusionIds.has(exclusion.id)) errors.push(`Duplicate water exclusion zone id: ${exclusion.id}`);
    seenExclusionIds.add(exclusion.id);
    if (!exclusion.area || !exclusion.excludedAs || !exclusion.reason) {
      errors.push(`Water exclusion zone ${exclusion.id} missing area/excludedAs/reason`);
    }
    if (!exclusion.approxRegion && !exclusion.pathId) {
      errors.push(`Water exclusion zone ${exclusion.id} has no approxRegion or pathId`);
    }
  }

  return { valid: errors.length === 0, errors };
}
