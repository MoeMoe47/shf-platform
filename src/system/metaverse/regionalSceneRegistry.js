import { validateMetaverseDevCapabilities } from "./metaverseDevCapabilities.js";
import { OIL_RIG_DAY_OCEAN_VIDEO_PRESET } from "./regionalOceanVideo.js";

export const REGIONAL_WORLD_ORIENTATION = {
  north: "top",
  south: "bottom",
  east: "offshore ocean / oil rig",
  west: "Silicon Heartland city",
};

export const REGIONAL_ROUTE_SEQUENCE = [
  { id: "oil-rig", order: 1, slug: "oil-rig", title: "Oil Rig" },
  { id: "open-sea", order: 2, slug: "open-sea", title: "Open Sea" },
  { id: "shipping-corridor", order: 3, slug: "shipping-corridor", title: "Shipping Corridor" },
  { id: "harbor-in-distance", order: 4, slug: "harbor-in-distance", title: "Harbor in Distance" },
  { id: "harbor-approach", order: 5, slug: "harbor-approach", title: "Harbor Approach / Port Entrance" },
  { id: "container-yard", order: 6, slug: "container-yard", title: "Container Yard" },
  { id: "freight-highway", order: 7, slug: "freight-highway", title: "Freight Highway" },
  { id: "farms", order: 8, slug: "farms", title: "Farms" },
  { id: "woods", order: 9, slug: "woods", title: "Woods" },
  { id: "river", order: 10, slug: "river", title: "River" },
  { id: "bridge", order: 11, slug: "bridge", title: "Bridge" },
  { id: "mountain-region", order: 12, slug: "mountain-region", title: "Mountain Region" },
  { id: "final-approach", order: 13, slug: "final-approach", title: "Final Pre-City Approach" },
  { id: "gateway", order: 14, slug: "gateway", title: "Gateway" },
  { id: "silicon-heartland-city", order: 15, slug: "city", title: "Existing Silicon Heartland City" },
];

export const REGIONAL_SCENE_CONTRACT_FIELDS = [
  "id",
  "order",
  "slug",
  "title",
  "subtitle",
  "region",
  "description",
  "backgroundAsset",
  "foregroundLayer",
  "oceanVideo",
  "quickMapAsset",
  "nextScene",
  "previousScene",
  "travelDirection",
  "worldOrientation",
  "availableTimeModes",
  "mobilityLayers",
  "interactiveLayers",
  "pointsOfInterest",
  "educationalContext",
  "emergencyCapabilities",
  "assetStatus",
  "devCapabilities",
];

export const REGIONAL_SCENES = [
  {
    id: "oil-rig",
    order: 1,
    slug: "oil-rig",
    title: "Oil Rig",
    subtitle: "Eastern Waters",
    region: "Eastern Waters",
    description: "Explore offshore energy infrastructure, maritime operations, logistics, safety, and the systems that connect remote ocean facilities to the wider economy.",
    classification: "Offshore Industrial / Energy / Maritime",
    backgroundAsset: {
      dayAsset: "public/assets/metaverse/regional/oil-rig/oil-rig-background-day.png",
      duskAsset: "public/assets/metaverse/regional/oil-rig/oil-rig-background-dusk.png",
      nightAsset: "public/assets/metaverse/regional/oil-rig/oil-rig-background-night.png",
      baseAsset: "public/assets/metaverse/regional/oil-rig/oil-rig-background-day.png",
      aspectRatio: 1536 / 1024,
      focalPoint: "center",
      cameraFamily: "high elevated oblique bird's-eye/world view",
    },
    foregroundLayer: {
      id: "oil-rig-day-depth-foreground",
      role: "rig-silhouette-depth-mask",
      dayAsset: "public/assets/metaverse/regional/oil-rig/oil-rig-day-foreground-cutout.png",
      availableTimeModes: ["DAY"],
      aspectRatio: 1536 / 1024,
      alignment: "full-plate",
      enabledByDefault: true,
      notes: "Transparent foreground cutout derived from the approved Oil Rig DAY master plate so sky clouds can pass visually behind the rig without altering the base image.",
    },
    oceanVideo: OIL_RIG_DAY_OCEAN_VIDEO_PRESET,
    vesselLayer: {
      id: "oil-rig-day-cargo-ships",
      role: "cargo-ship-traffic",
      presetId: "oil-rig-day-cargo-ships",
      depth: "behindRig",
      availableTimeModes: ["DAY"],
      enabledByDefault: true,
      notes: "Reusable cargo ship traffic layer rendered on the ocean horizon beneath the rig foreground depth mask.",
    },
    quickMapAsset: {
      asset: "public/assets/metaverse/regional/oil-rig/oil-rig-quick-map.png",
      aspectRatio: 1584 / 993,
      cameraFamily: "direct overhead / true top-down",
      orientation: REGIONAL_WORLD_ORIENTATION,
    },
    nextScene: "open-sea",
    previousScene: null,
    travelDirection: "WEST",
    worldDirection: "Westbound toward Open Sea",
    worldOrientation: REGIONAL_WORLD_ORIENTATION,
    availableTimeModes: ["DAY", "DUSK", "NIGHT"],
    mobilityLayers: {
      waterMobilityAuthority: "pending",
      configuredVesselRoutes: [],
      layerSlots: ["water-effects", "vessels", "rig-effects", "aircraft", "birds", "weather"],
    },
    interactiveLayers: ["scene-info", "westbound-continuation", "route-progress", "quick-map"],
    pointsOfInterest: [
      { id: "rig-platform", label: "Offshore platform", x: 50, y: 52, type: "infrastructure" },
      { id: "helipad", label: "Helipad", x: 54, y: 42, type: "aviation" },
      { id: "service-zone", label: "Service vessel zone", x: 36, y: 62, type: "maritime" },
    ],
    educationalContext: {
      title: "Oil Rig",
      subtitle: "Eastern Waters",
      summary: "Offshore energy infrastructure, maritime logistics, safety, and remote operations.",
    },
    emergencyCapabilities: [
      "offshore-medical-emergency",
      "worker-injury",
      "fire",
      "hazardous-spill",
      "vessel-emergency",
      "helicopter-evacuation",
      "marine-rescue",
      "severe-weather-incident",
    ],
    assetStatus: {
      day: "READY",
      dusk: "READY",
      night: "READY",
      quickMap: "READY",
      livingWorldPngLayers: "SLOTS_ONLY",
    },
    devCapabilities: {
      scene: true, clouds: true, ocean: true, foamTurbulence: true, weather: { enabled: true, precipitation: ["rain"], fog: true, lightning: true, wetSurface: false, snowAccumulation: false }, cargoShips: true, wildlife: true, depthMask: true, debug: true, performance: true,
    },
    visibilityExclusions: ["city", "harbor", "coastline", "container port", "mountains", "farms", "woods", "river", "gateway"],
  },
  {
    id: "open-sea",
    order: 2,
    slug: "open-sea",
    title: "Open Sea",
    subtitle: "Eastern Waters",
    region: "Eastern Waters",
    description: "Cross the isolated ocean between the offshore energy platform and the wider maritime shipping corridor.",
    classification: "Open Ocean / Maritime",
    backgroundAsset: {
      dayAsset: "public/assets/metaverse/regional/open-sea/open-sea-background-day.png",
      duskAsset: "public/assets/metaverse/regional/open-sea/open-sea-background-dusk.png",
      nightAsset: "public/assets/metaverse/regional/open-sea/open-sea-background-night.png",
      baseAsset: "public/assets/metaverse/regional/open-sea/open-sea-background-day.png",
      aspectRatio: 1584 / 993,
      focalPoint: "center",
      cameraFamily: "high elevated oblique bird's-eye/world view",
    },
    foregroundLayer: null,
    oceanVideo: null,
    quickMapAsset: {
      asset: "public/assets/metaverse/regional/open-sea/open-sea-quick-map.png",
      aspectRatio: 1672 / 941,
      cameraFamily: "direct overhead / true top-down",
      orientation: REGIONAL_WORLD_ORIENTATION,
    },
    nextScene: "shipping-corridor",
    previousScene: "oil-rig",
    travelDirection: "WEST",
    worldDirection: "Westbound toward Shipping Corridor",
    worldOrientation: REGIONAL_WORLD_ORIENTATION,
    availableTimeModes: ["DAY", "DUSK", "NIGHT"],
    mobilityLayers: {
      waterMobilityAuthority: "pending",
      configuredVesselRoutes: [],
      layerSlots: ["water-effects", "vessels", "aircraft", "birds", "weather"],
    },
    interactiveLayers: ["scene-info", "westbound-continuation", "route-progress", "quick-map"],
    pointsOfInterest: [],
    educationalContext: {
      title: "Open Sea",
      subtitle: "Eastern Waters",
      summary: "Open-ocean navigation, maritime weather, safety, and the transition toward commercial shipping lanes.",
    },
    emergencyCapabilities: [
      "vessel-emergency",
      "marine-rescue",
      "medical-evacuation",
      "severe-weather-incident",
      "environmental-response",
    ],
    assetStatus: {
      day: "READY",
      dusk: "READY",
      night: "READY",
      quickMap: "READY",
      livingWorldPngLayers: "SLOTS_ONLY",
    },
    devCapabilities: {
      scene: true, clouds: true, weather: { enabled: true, precipitation: ["rain"], fog: true, lightning: true, wetSurface: false, snowAccumulation: false }, wildlife: true, debug: true, performance: true,
    },
    visibilityExclusions: ["oil rig", "city", "harbor", "coastline", "port", "cranes", "container yard", "mountains", "farms", "forest", "gateway"],
  },
];

export function getRegionalSceneBySlug(slug) {
  return REGIONAL_SCENES.find((scene) => scene.slug === slug || scene.id === slug) || null;
}

export function getRegionalRouteStop(sceneId) {
  return REGIONAL_ROUTE_SEQUENCE.find((stop) => stop.id === sceneId) || null;
}

export function getRegionalRouteNeighbors(sceneId) {
  const index = REGIONAL_ROUTE_SEQUENCE.findIndex((stop) => stop.id === sceneId);
  return {
    previous: index > 0 ? REGIONAL_ROUTE_SEQUENCE[index - 1] : null,
    current: index >= 0 ? REGIONAL_ROUTE_SEQUENCE[index] : null,
    next: index >= 0 && index < REGIONAL_ROUTE_SEQUENCE.length - 1 ? REGIONAL_ROUTE_SEQUENCE[index + 1] : null,
  };
}

export function getImplementedRegionalSceneSlugs() {
  return REGIONAL_SCENES.map((scene) => scene.slug);
}

export function validateRegionalSceneRegistry() {
  const errors = [];
  const ids = new Set();
  for (const scene of REGIONAL_SCENES) {
    for (const field of REGIONAL_SCENE_CONTRACT_FIELDS) {
      if (!(field in scene)) errors.push(`${scene.id || "unknown"} missing ${field}`);
    }
    if (ids.has(scene.id)) errors.push(`Duplicate regional scene id ${scene.id}`);
    ids.add(scene.id);
    if (scene.previousScene !== null && !REGIONAL_ROUTE_SEQUENCE.some((stop) => stop.id === scene.previousScene)) {
      errors.push(`${scene.id} references unknown previousScene ${scene.previousScene}`);
    }
    if (scene.nextScene !== null && !REGIONAL_ROUTE_SEQUENCE.some((stop) => stop.id === scene.nextScene)) {
      errors.push(`${scene.id} references unknown nextScene ${scene.nextScene}`);
    }
    if (scene.travelDirection !== "WEST") errors.push(`${scene.id} must preserve westbound travel`);
    if (scene.worldOrientation.east !== REGIONAL_WORLD_ORIENTATION.east || scene.worldOrientation.west !== REGIONAL_WORLD_ORIENTATION.west) {
      errors.push(`${scene.id} must preserve regional east/west geography`);
    }
    errors.push(...validateMetaverseDevCapabilities(scene.devCapabilities).errors.map((error) => `${scene.id}: ${error}`));
  }
  return { valid: errors.length === 0, errors };
}
