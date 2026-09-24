export const CARGO_SHIP_ASSET_BASE = "public/assets/metaverse/vessels/cargo-ships";

export const CARGO_SHIP_ASSETS = {
  ship01: {
    id: "ship01",
    path: `${CARGO_SHIP_ASSET_BASE}/1.png`,
    label: "Container ship 01",
    suitability: "far / side profile",
    waterline: 0.72,
  },
  ship02: {
    id: "ship02",
    path: `${CARGO_SHIP_ASSET_BASE}/2.png`,
    label: "Container ship 02",
    suitability: "far / side profile",
    waterline: 0.72,
  },
  ship03: {
    id: "ship03",
    path: `${CARGO_SHIP_ASSET_BASE}/3.png`,
    label: "Container ship 03",
    suitability: "mid / angled profile",
    waterline: 0.73,
  },
  ship04: {
    id: "ship04",
    path: `${CARGO_SHIP_ASSET_BASE}/4.png`,
    label: "Container ship 04",
    suitability: "mid / side profile",
    waterline: 0.72,
  },
};

export const CARGO_SHIP_DEPTH_GROUPS = ["far", "mid"];

export const OIL_RIG_DAY_CARGO_SHIP_PRESET = {
  id: "oil-rig-day-cargo-ships",
  sceneId: "oil-rig",
  timeOfDay: "DAY",
  label: "Oil Rig Day",
  enabled: true,
  motionEnabled: true,
  bobbingEnabled: true,
  windDirection: 268,
  windSpeed: 1,
  globalSpeed: 0.48,
  scaleMultiplier: 1,
  shipCount: 3,
  showFarShips: true,
  showMidShips: true,
  routes: [
    {
      id: "horizon-eastbound",
      label: "Horizon pass eastbound",
      depth: "far",
      speedPxPerSecond: 1.9,
      windInfluenceMultiplier: 0.22,
      loop: true,
      enabled: true,
      controlPoints: [{ x: -12, y: 23.2 }, { x: 112, y: 23.2 }],
    },
    {
      id: "distant-westbound",
      label: "Distant crossing westbound",
      depth: "far",
      speedPxPerSecond: 1.6,
      windInfluenceMultiplier: 0.18,
      loop: true,
      enabled: true,
      controlPoints: [{ x: 112, y: 24.8 }, { x: -12, y: 24.8 }],
    },
    {
      id: "mid-corridor-eastbound",
      label: "Mid-distance corridor pass",
      depth: "mid",
      speedPxPerSecond: 2.25,
      windInfluenceMultiplier: 0.24,
      loop: true,
      enabled: true,
      controlPoints: [{ x: -14, y: 30.6 }, { x: 114, y: 30.6 }],
    },
  ],
  instances: [
    { id: "cargo-far-east", asset: "ship01", routeId: "horizon-eastbound", depth: "far", phase: 0.48, widthPx: 82, opacity: 0.62, speed: 0.84, flipX: false },
    { id: "cargo-mid-east", asset: "ship04", routeId: "mid-corridor-eastbound", depth: "mid", phase: 0.3, widthPx: 118, opacity: 0.72, speed: 0.78, flipX: false },
    { id: "cargo-far-west", asset: "ship02", routeId: "distant-westbound", depth: "far", phase: 0.22, widthPx: 76, opacity: 0.58, speed: 0.8, flipX: true },
  ],
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function numberOr(value, fallback) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export function cloneCargoShipSceneConfig(config = OIL_RIG_DAY_CARGO_SHIP_PRESET) {
  return structuredClone(config);
}

export function resolveCargoShipWindVector(windDirection = 270) {
  const radians = (numberOr(windDirection, 270) * Math.PI) / 180;
  return { x: Math.sin(radians), y: -Math.cos(radians) };
}

export function normalizeCargoShipSceneConfig(source = OIL_RIG_DAY_CARGO_SHIP_PRESET) {
  const fallback = OIL_RIG_DAY_CARGO_SHIP_PRESET;
  return {
    ...fallback,
    ...source,
    enabled: source.enabled !== false,
    motionEnabled: source.motionEnabled !== false,
    bobbingEnabled: source.bobbingEnabled !== false,
    windDirection: ((numberOr(source.windDirection, fallback.windDirection) % 360) + 360) % 360,
    windSpeed: clamp(numberOr(source.windSpeed, fallback.windSpeed), 0, 3),
    globalSpeed: clamp(numberOr(source.globalSpeed, fallback.globalSpeed), 0, 3),
    scaleMultiplier: clamp(numberOr(source.scaleMultiplier, fallback.scaleMultiplier), 0.4, 2),
    shipCount: Math.round(clamp(numberOr(source.shipCount, fallback.shipCount), 0, 3)),
    showFarShips: source.showFarShips !== false,
    showMidShips: source.showMidShips !== false,
    routes: (source.routes || fallback.routes).map((route) => ({
      ...route,
      enabled: route.enabled !== false,
      depth: CARGO_SHIP_DEPTH_GROUPS.includes(route.depth) ? route.depth : "far",
      speedPxPerSecond: clamp(numberOr(route.speedPxPerSecond, 2), 0, 30),
      windInfluenceMultiplier: clamp(numberOr(route.windInfluenceMultiplier, 0.3), 0, 2),
      controlPoints: (route.controlPoints || []).map((point) => ({ x: numberOr(point.x, 0), y: numberOr(point.y, 24) })),
    })),
    instances: (source.instances || fallback.instances).map((instance) => ({
      ...instance,
      enabled: instance.enabled !== false,
      depth: CARGO_SHIP_DEPTH_GROUPS.includes(instance.depth) ? instance.depth : "far",
      phase: numberOr(instance.phase, 0),
      widthPx: clamp(numberOr(instance.widthPx, 120), 40, 280),
      opacity: clamp(numberOr(instance.opacity, 0.7), 0, 1),
      speed: clamp(numberOr(instance.speed, 1), 0, 3),
      flipX: instance.flipX === true,
    })),
  };
}

export function resolveRenderableCargoShips(config = OIL_RIG_DAY_CARGO_SHIP_PRESET) {
  const normalized = normalizeCargoShipSceneConfig(config);
  if (!normalized.enabled) return { ships: [], routes: [] };
  const routesById = new Map(normalized.routes.filter((route) => route.enabled).map((route) => [route.id, route]));
  const ships = normalized.instances
    .filter((instance) => instance.enabled && routesById.has(instance.routeId))
    .filter((instance) => instance.depth !== "far" || normalized.showFarShips)
    .filter((instance) => instance.depth !== "mid" || normalized.showMidShips)
    .slice(0, normalized.shipCount)
    .map((instance) => ({ ...instance, asset: CARGO_SHIP_ASSETS[instance.asset], route: routesById.get(instance.routeId) }))
    .filter((instance) => instance.asset);
  return { ships, routes: normalized.routes };
}

export function validateCargoShipSceneConfig(config = OIL_RIG_DAY_CARGO_SHIP_PRESET) {
  const errors = [];
  const normalized = normalizeCargoShipSceneConfig(config);
  if (!normalized.id) errors.push("cargo ship config missing id");
  for (const asset of Object.values(CARGO_SHIP_ASSETS)) {
    if (!asset.path.startsWith(CARGO_SHIP_ASSET_BASE) || !asset.path.endsWith(".png")) errors.push(`invalid cargo ship asset ${asset.path}`);
  }
  for (const route of normalized.routes) {
    if (!route.id) errors.push("cargo ship route missing id");
    if (route.controlPoints.length < 2) errors.push(`${route.id} needs at least two control points`);
  }
  for (const instance of normalized.instances) {
    if (!instance.id) errors.push("cargo ship instance missing id");
    if (!CARGO_SHIP_ASSETS[instance.asset]) errors.push(`${instance.id} references unknown asset ${instance.asset}`);
    if (!normalized.routes.some((route) => route.id === instance.routeId)) errors.push(`${instance.id} references unknown route ${instance.routeId}`);
  }
  return { valid: errors.length === 0, errors };
}
