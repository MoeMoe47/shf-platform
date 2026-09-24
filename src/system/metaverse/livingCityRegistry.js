import { METAVERSE_DISTRICT_MARKERS, METAVERSE_FACILITIES } from "./metaverseNavigationModel.js";
import { METAVERSE_PRODUCTION_BACKGROUND_SET } from "./metaverseVisualAssets.js";

export const LIVING_CITY_STATE_CLASSIFICATIONS = ["DECORATIVE", "SOURCE_BACKED", "HYBRID"];
export const LIVING_CITY_PERFORMANCE_MODES = ["HIGH", "STANDARD", "LOW"];

export const LIVING_CITY_AUTHORITY_BOUNDARY = {
  presentationOnly: true,
  decorativeStateGrantsAuthority: false,
  clientTimeGrantsAuthority: false,
  trafficTriggersBusinessLogic: false,
  fastTravelRequiresProtectedEntry: true,
  sourceBackedCountsOnly: true,
  noPrivateIdentityDisclosure: true,
};

function sceneFromAsset(asset) {
  return {
    sceneId: asset.facility || asset.district || "silicon-heartland-city",
    assetId: asset.assetId,
    cameraLevel: asset.cameraLevel,
    districtId: asset.district,
    facilityId: asset.facility,
    baseAsset: asset.targetPath,
    dayAsset: asset.dayAsset || null,
    duskAsset: asset.duskAsset || asset.targetPath,
    nightAsset: asset.nightAsset || null,
    cleanPlateStatus: asset.cleanPlateStatus || "NEEDS_TRAFFIC_CLEANUP",
    trafficOverlaySupport: asset.trafficOverlaySupport ?? true,
    ambientOverlaySupport: asset.ambientOverlaySupport ?? true,
    weatherOverlaySupport: asset.weatherOverlaySupport ?? true,
    notes: asset.cleanPlateNotes || asset.notes,
  };
}

export const METAVERSE_LIVING_CITY_SCENES = METAVERSE_PRODUCTION_BACKGROUND_SET.map(sceneFromAsset);

// MET-15K — DEBUG / REFERENCE DATA. The legacy per-district traffic layer
// that used to render these paths (MetaverseTrafficLayer.jsx) was deleted;
// the runtime-traced vehicle system is RETIRED_FROM_PRODUCTION. Nothing in
// the production render path calls getTrafficPathsForScene() anymore —
// this geometry is kept only as reference for the future Cinematic Living
// City Layer (MET-16). See docs/metaverse/MET-15K_CLEANUP_NOTES.md.
export const METAVERSE_TRAFFIC_PATHS = [
  {
    pathId: "city-loop-gold",
    sceneId: "silicon-heartland-city",
    vehicleType: "sedan",
    points: [{ x: 10, y: 69 }, { x: 28, y: 58 }, { x: 51, y: 53 }, { x: 75, y: 61 }, { x: 90, y: 73 }],
    speedSeconds: 18,
    density: "STANDARD",
    direction: "FORWARD",
    repeat: true,
    timeOfDay: ["DAY", "DUSK", "NIGHT"],
    enabled: true,
    reducedMotionBehavior: "HIDE",
    stateClassification: "DECORATIVE",
  },
  {
    pathId: "city-transit-blue",
    sceneId: "silicon-heartland-city",
    vehicleType: "bus",
    points: [{ x: 18, y: 46 }, { x: 36, y: 48 }, { x: 55, y: 44 }, { x: 76, y: 48 }],
    speedSeconds: 24,
    density: "LOW",
    direction: "FORWARD",
    repeat: true,
    timeOfDay: ["DAY", "DUSK", "NIGHT"],
    enabled: true,
    reducedMotionBehavior: "HIDE",
    stateClassification: "DECORATIVE",
  },
  {
    pathId: "data-center-service-road",
    sceneId: "data-center-district",
    vehicleType: "service",
    points: [{ x: 12, y: 66 }, { x: 31, y: 58 }, { x: 54, y: 61 }, { x: 82, y: 68 }],
    speedSeconds: 22,
    density: "LOW",
    direction: "FORWARD",
    repeat: true,
    timeOfDay: ["DAY", "DUSK", "NIGHT"],
    enabled: true,
    reducedMotionBehavior: "HIDE",
    stateClassification: "DECORATIVE",
  },
  {
    pathId: "public-realm-shuttle",
    sceneId: "public-realm",
    vehicleType: "shuttle",
    points: [{ x: 16, y: 70 }, { x: 34, y: 61 }, { x: 54, y: 58 }, { x: 76, y: 64 }],
    speedSeconds: 20,
    density: "STANDARD",
    direction: "FORWARD",
    repeat: true,
    timeOfDay: ["DAY", "DUSK", "NIGHT"],
    enabled: true,
    reducedMotionBehavior: "HIDE",
    stateClassification: "DECORATIVE",
  },
];

export const METAVERSE_TRANSIT_PATHS = [
  {
    pathId: "city-rail-glide",
    sceneId: "silicon-heartland-city",
    vehicleType: "transit",
    points: [{ x: 8, y: 34 }, { x: 30, y: 36 }, { x: 59, y: 33 }, { x: 92, y: 38 }],
    speedSeconds: 30,
    density: "LOW",
    direction: "FORWARD",
    repeat: true,
    timeOfDay: ["DAY", "DUSK", "NIGHT"],
    enabled: true,
    reducedMotionBehavior: "HIDE",
    stateClassification: "DECORATIVE",
  },
];

export const METAVERSE_AMBIENT_EFFECTS = [
  { effectId: "cloud-drift", sceneId: "*", type: "CLOUDS", stateClassification: "DECORATIVE", reducedMotionBehavior: "STATIC" },
  { effectId: "water-shimmer", sceneId: "public-realm", type: "SHIMMER", stateClassification: "DECORATIVE", reducedMotionBehavior: "HIDE" },
  { effectId: "data-center-cooling", sceneId: "data-center-district", type: "VAPOR", stateClassification: "HYBRID", source: "simulation_activity", reducedMotionBehavior: "STATIC" },
  { effectId: "fiber-road-pulse", sceneId: "*", type: "ENERGY_FLOW", stateClassification: "DECORATIVE", reducedMotionBehavior: "HIDE" },
];

export const METAVERSE_BUILDING_EFFECTS = [
  { facilityId: "main-data-center", sceneId: "data-center-district", x: 44, y: 45, kind: "operational-pulse", source: "simulation_activity", stateClassification: "HYBRID" },
  { facilityId: "career-center", sceneId: "career-education-district", x: 34, y: 50, kind: "opportunity-glow", source: "opportunity_count", stateClassification: "SOURCE_BACKED" },
  { facilityId: "city-hall", sceneId: "civic-district", x: 32, y: 44, kind: "civic-beacon", source: "civic_state", stateClassification: "SOURCE_BACKED" },
  { facilityId: "store-marketplace", sceneId: "treasury-commerce-district", x: 47, y: 62, kind: "commerce-pulse", source: "market_activity", stateClassification: "SOURCE_BACKED" },
  { facilityId: "builder-studio", sceneId: "technology-innovation-district", x: 45, y: 62, kind: "project-indicator", source: "enterprise_activity", stateClassification: "SOURCE_BACKED" },
];

export const METAVERSE_EVENT_ZONES = METAVERSE_DISTRICT_MARKERS.map((district) => ({
  districtId: district.id,
  sceneId: district.id,
  x: district.x,
  y: district.y,
  stateClassification: "SOURCE_BACKED",
}));

export function getLivingCitySceneId({ level, districtId, facilityId }) {
  if ((level === "FACILITY_VIEW" || level === "ACTIVITY_SIMULATION_VIEW") && facilityId) return facilityId;
  if (level === "DISTRICT_VIEW" && districtId) return districtId;
  return "silicon-heartland-city";
}

export function getTrafficPathsForScene(sceneId, { performanceMode = "STANDARD", reducedMotion = false } = {}) {
  if (reducedMotion) return [];
  const paths = [...METAVERSE_TRAFFIC_PATHS, ...METAVERSE_TRANSIT_PATHS].filter((path) => path.enabled && path.sceneId === sceneId);
  if (performanceMode === "LOW") return paths.slice(0, 1);
  if (performanceMode === "STANDARD") return paths.filter((path) => path.density !== "HIGH");
  return paths;
}

export function getBuildingEffectsForScene(sceneId) {
  const facilityIds = new Set(METAVERSE_FACILITIES.filter((facility) => facility.districtId === sceneId || facility.id === sceneId).map((facility) => facility.id));
  return METAVERSE_BUILDING_EFFECTS.filter((effect) => effect.sceneId === sceneId || facilityIds.has(effect.facilityId));
}

export function getAmbientEffectsForScene(sceneId) {
  return METAVERSE_AMBIENT_EFFECTS.filter((effect) => effect.sceneId === "*" || effect.sceneId === sceneId);
}

export function validateLivingCityRegistry() {
  const errors = [];
  const sceneIds = new Set(METAVERSE_LIVING_CITY_SCENES.map((scene) => scene.sceneId));
  for (const path of [...METAVERSE_TRAFFIC_PATHS, ...METAVERSE_TRANSIT_PATHS]) {
    if (!path.pathId || !path.sceneId) errors.push(`Traffic path missing identity: ${path.pathId}`);
    if (!sceneIds.has(path.sceneId)) errors.push(`Traffic path ${path.pathId} references unknown scene ${path.sceneId}`);
    if (!Array.isArray(path.points) || path.points.length < 2) errors.push(`Traffic path ${path.pathId} needs at least two points`);
    for (const point of path.points || []) {
      if (point.x < 0 || point.x > 100 || point.y < 0 || point.y > 100) errors.push(`Traffic path ${path.pathId} point out of scene bounds`);
    }
    if (path.stateClassification !== "DECORATIVE") errors.push(`Traffic path ${path.pathId} must stay decorative`);
  }
  for (const effect of [...METAVERSE_AMBIENT_EFFECTS, ...METAVERSE_BUILDING_EFFECTS, ...METAVERSE_EVENT_ZONES]) {
    if (!LIVING_CITY_STATE_CLASSIFICATIONS.includes(effect.stateClassification)) errors.push(`Invalid state classification on ${effect.effectId || effect.facilityId || effect.districtId}`);
  }
  return { valid: errors.length === 0, errors };
}
