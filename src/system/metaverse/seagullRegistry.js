export const SEAGULL_ASSET_BASE = "public/assets/metaverse/fauna/seagulls";

export const SEAGULL_ASSETS = {
  flying: {
    glide: `${SEAGULL_ASSET_BASE}/sg_fly_01.png`,
    wingsRaised: `${SEAGULL_ASSET_BASE}/sg_fly_02.png`,
    bank: `${SEAGULL_ASSET_BASE}/sg_fly_03.png`,
    glideDown: `${SEAGULL_ASSET_BASE}/sg_fly_04.png`,
  },
  perched: {
    perchA: `${SEAGULL_ASSET_BASE}/sg_perch_01.png`,
    perchB: `${SEAGULL_ASSET_BASE}/sg_perch_02.png`,
    perchC: `${SEAGULL_ASSET_BASE}/sg_perch_03.png`,
    perchD: `${SEAGULL_ASSET_BASE}/sg_perch_04.png`,
  },
};

export const SEAGULL_DEPTH_GROUPS = ["far", "mid", "near"];

export const OIL_RIG_DAY_SEAGULL_PRESET = {
  id: "oil-rig-day-seagulls",
  sceneId: "oil-rig",
  timeOfDay: "DAY",
  label: "Oil Rig Day Seagulls",
  enabled: true,
  windDirection: 268,
  windSpeed: 1,
  globalSpeed: 1,
  windInfluence: 0.34,
  glideAmount: 0.82,
  flapFrequency: 0.34,
  scaleMultiplier: 1,
  flyingEnabled: true,
  farFlyingEnabled: true,
  midFlyingEnabled: true,
  nearFlyingEnabled: true,
  perchedEnabled: true,
  flyingCount: 5,
  perchedCount: 3,
  flightPaths: [
    {
      id: "horizon-glide-west",
      label: "Horizon Glide West",
      type: "horizon-glide",
      depth: "far",
      enabled: true,
      loop: true,
      windInfluenceMultiplier: 0.5,
      controlPoints: [
        { x: 104, y: 17 },
        { x: 76, y: 15 },
        { x: 38, y: 17 },
        { x: -10, y: 16 },
      ],
    },
    {
      id: "horizon-glide-east",
      label: "Horizon Glide East",
      type: "horizon-glide",
      depth: "far",
      enabled: true,
      loop: true,
      windInfluenceMultiplier: 0.42,
      controlPoints: [
        { x: -8, y: 20 },
        { x: 22, y: 18 },
        { x: 64, y: 19 },
        { x: 108, y: 17 },
      ],
    },
    {
      id: "mid-rig-circle",
      label: "Mid Rig Circle",
      type: "circle-rig",
      depth: "mid",
      enabled: true,
      loop: true,
      windInfluenceMultiplier: 0.22,
      controlPoints: [
        { x: 72, y: 23 },
        { x: 62, y: 18 },
        { x: 48, y: 21 },
        { x: 56, y: 29 },
        { x: 72, y: 23 },
      ],
    },
    {
      id: "mid-arc-pass",
      label: "Mid Arc Pass",
      type: "arc-pass",
      depth: "mid",
      enabled: true,
      loop: true,
      windInfluenceMultiplier: 0.3,
      controlPoints: [
        { x: 10, y: 25 },
        { x: 32, y: 18 },
        { x: 58, y: 19 },
        { x: 88, y: 25 },
      ],
    },
    {
      id: "near-flyby",
      label: "Occasional Near Fly-By",
      type: "cross-scene",
      depth: "near",
      enabled: true,
      loop: true,
      windInfluenceMultiplier: 0.18,
      controlPoints: [
        { x: -12, y: 31 },
        { x: 24, y: 25 },
        { x: 66, y: 27 },
        { x: 112, y: 22 },
      ],
    },
  ],
  flyingInstances: [
    { id: "far-gull-01", pathId: "horizon-glide-west", assetSet: "flying", depth: "far", widthPx: 18, opacity: 0.72, speed: 0.62, phase: 0.08, bank: -2, enabled: true },
    { id: "far-gull-02", pathId: "horizon-glide-east", assetSet: "flying", depth: "far", widthPx: 16, opacity: 0.66, speed: 0.52, phase: 0.54, bank: 1, enabled: true },
    { id: "mid-gull-01", pathId: "mid-rig-circle", assetSet: "flying", depth: "mid", widthPx: 25, opacity: 0.82, speed: 0.74, phase: 0.18, bank: 5, enabled: true },
    { id: "mid-gull-02", pathId: "mid-arc-pass", assetSet: "flying", depth: "mid", widthPx: 22, opacity: 0.76, speed: 0.64, phase: 0.68, bank: -4, enabled: true },
    { id: "near-gull-01", pathId: "near-flyby", assetSet: "flying", depth: "near", widthPx: 34, opacity: 0.78, speed: 0.46, phase: 0.36, bank: 3, enabled: true },
  ],
  perchAnchors: [
    { id: "helipad-rail-east", label: "Helipad rail", x: 77.8, y: 40.8, depth: "near", widthPx: 22, rotation: -3, enabled: true, allowedAssets: ["perchA", "perchB"] },
    { id: "upper-deck-left-rail", label: "Upper deck rail", x: 45.2, y: 43.8, depth: "near", widthPx: 19, rotation: 2, enabled: true, allowedAssets: ["perchB", "perchC"] },
    { id: "crane-left-rail", label: "Left crane rail", x: 48.4, y: 33.8, depth: "mid", widthPx: 17, rotation: -5, enabled: true, allowedAssets: ["perchC", "perchD"] },
    { id: "tower-crossbeam", label: "Tower crossbeam", x: 58.7, y: 25.5, depth: "mid", widthPx: 15, rotation: 4, enabled: false, allowedAssets: ["perchA", "perchD"] },
    { id: "lower-deck-edge", label: "Lower deck edge", x: 61.6, y: 50.7, depth: "near", widthPx: 18, rotation: 1, enabled: true, allowedAssets: ["perchA", "perchC"] },
    { id: "service-platform-rail", label: "Service platform rail", x: 69.4, y: 46.2, depth: "near", widthPx: 17, rotation: -2, enabled: false, allowedAssets: ["perchB", "perchD"] },
  ],
  perchedInstances: [
    { id: "perched-gull-01", anchorId: "helipad-rail-east", asset: "perchA", scale: 1, idlePhase: 0.1, enabled: true },
    { id: "perched-gull-02", anchorId: "upper-deck-left-rail", asset: "perchC", scale: 0.92, idlePhase: 0.48, enabled: true },
    { id: "perched-gull-03", anchorId: "crane-left-rail", asset: "perchB", scale: 0.86, idlePhase: 0.78, enabled: true },
    { id: "perched-gull-04", anchorId: "lower-deck-edge", asset: "perchD", scale: 0.9, idlePhase: 0.34, enabled: false },
  ],
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function numberOr(value, fallback) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export function cloneSeagullSceneConfig(config = OIL_RIG_DAY_SEAGULL_PRESET) {
  return structuredClone(config);
}

export function resolveSeagullWindVector(windDirection = 270) {
  const radians = (numberOr(windDirection, 270) * Math.PI) / 180;
  return {
    x: Math.sin(radians),
    y: -Math.cos(radians),
  };
}

export function normalizeSeagullSceneConfig(source = OIL_RIG_DAY_SEAGULL_PRESET) {
  const fallback = OIL_RIG_DAY_SEAGULL_PRESET;
  return {
    ...fallback,
    ...source,
    enabled: source.enabled !== false,
    windDirection: ((numberOr(source.windDirection, fallback.windDirection) % 360) + 360) % 360,
    windSpeed: clamp(numberOr(source.windSpeed, fallback.windSpeed), 0, 3),
    globalSpeed: clamp(numberOr(source.globalSpeed, fallback.globalSpeed), 0, 3),
    windInfluence: clamp(numberOr(source.windInfluence, fallback.windInfluence), 0, 2),
    glideAmount: clamp(numberOr(source.glideAmount, fallback.glideAmount), 0, 1),
    flapFrequency: clamp(numberOr(source.flapFrequency, fallback.flapFrequency), 0, 2),
    scaleMultiplier: clamp(numberOr(source.scaleMultiplier, fallback.scaleMultiplier), 0.2, 3),
    flyingCount: Math.round(clamp(numberOr(source.flyingCount, fallback.flyingCount), 0, 12)),
    perchedCount: Math.round(clamp(numberOr(source.perchedCount, fallback.perchedCount), 0, 8)),
    flightPaths: (source.flightPaths || fallback.flightPaths).map((path) => ({
      ...path,
      enabled: path.enabled !== false,
      windInfluenceMultiplier: clamp(numberOr(path.windInfluenceMultiplier, 0.25), 0, 2),
      controlPoints: (path.controlPoints || []).map((point) => ({
        x: numberOr(point.x, 0),
        y: numberOr(point.y, 0),
      })),
    })),
    flyingInstances: (source.flyingInstances || fallback.flyingInstances).map((bird) => ({
      ...bird,
      enabled: bird.enabled !== false,
      widthPx: clamp(numberOr(bird.widthPx, 20), 4, 120),
      opacity: clamp(numberOr(bird.opacity, 0.8), 0, 1),
      speed: clamp(numberOr(bird.speed, 0.6), 0, 4),
      phase: clamp(numberOr(bird.phase, 0), 0, 1),
      bank: clamp(numberOr(bird.bank, 0), -35, 35),
    })),
    perchAnchors: (source.perchAnchors || fallback.perchAnchors).map((anchor) => ({
      ...anchor,
      enabled: anchor.enabled !== false,
      x: clamp(numberOr(anchor.x, 50), 0, 100),
      y: clamp(numberOr(anchor.y, 50), 0, 100),
      widthPx: clamp(numberOr(anchor.widthPx, 18), 4, 80),
      rotation: clamp(numberOr(anchor.rotation, 0), -35, 35),
    })),
    perchedInstances: (source.perchedInstances || fallback.perchedInstances).map((bird) => ({
      ...bird,
      enabled: bird.enabled !== false,
      scale: clamp(numberOr(bird.scale, 1), 0.2, 2),
      idlePhase: numberOr(bird.idlePhase, 0),
    })),
  };
}

export function resolveRenderableSeagulls(config = OIL_RIG_DAY_SEAGULL_PRESET) {
  const normalized = normalizeSeagullSceneConfig(config);
  if (!normalized.enabled) return { flying: [], perched: [], flightPaths: [], perchAnchors: [] };
  const pathsById = new Map(normalized.flightPaths.filter((path) => path.enabled).map((path) => [path.id, path]));
  const anchorsById = new Map(normalized.perchAnchors.filter((anchor) => anchor.enabled).map((anchor) => [anchor.id, anchor]));
  const flying = normalized.flyingEnabled === false ? [] : normalized.flyingInstances
    .filter((bird) => bird.enabled && pathsById.has(bird.pathId))
    .filter((bird) => {
      if (bird.depth === "far" && normalized.farFlyingEnabled === false) return false;
      if (bird.depth === "mid" && normalized.midFlyingEnabled === false) return false;
      if (bird.depth === "near" && normalized.nearFlyingEnabled === false) return false;
      return true;
    })
    .slice(0, normalized.flyingCount)
    .map((bird) => ({ ...bird, path: pathsById.get(bird.pathId) }));
  const perched = normalized.perchedEnabled === false ? [] : normalized.perchedInstances
    .filter((bird) => bird.enabled && anchorsById.has(bird.anchorId))
    .slice(0, normalized.perchedCount)
    .map((bird) => ({ ...bird, anchor: anchorsById.get(bird.anchorId) }));
  return {
    flying,
    perched,
    flightPaths: normalized.flightPaths,
    perchAnchors: normalized.perchAnchors,
  };
}

export function validateSeagullSceneConfig(config = OIL_RIG_DAY_SEAGULL_PRESET) {
  const errors = [];
  const normalized = normalizeSeagullSceneConfig(config);
  const assetValues = [...Object.values(SEAGULL_ASSETS.flying), ...Object.values(SEAGULL_ASSETS.perched)];
  for (const asset of assetValues) {
    if (!asset.startsWith(SEAGULL_ASSET_BASE) || !asset.endsWith(".png")) errors.push(`invalid seagull asset path ${asset}`);
  }
  for (const path of normalized.flightPaths) {
    if (!path.id) errors.push("flight path missing id");
    if (!SEAGULL_DEPTH_GROUPS.includes(path.depth)) errors.push(`${path.id} uses unsupported depth ${path.depth}`);
    if (path.controlPoints.length < 2) errors.push(`${path.id} needs at least two control points`);
  }
  for (const bird of normalized.flyingInstances) {
    if (!bird.id) errors.push("flying seagull missing id");
    if (!normalized.flightPaths.some((path) => path.id === bird.pathId)) errors.push(`${bird.id} references unknown path ${bird.pathId}`);
    if (!SEAGULL_DEPTH_GROUPS.includes(bird.depth)) errors.push(`${bird.id} uses unsupported depth ${bird.depth}`);
  }
  for (const anchor of normalized.perchAnchors) {
    if (!anchor.id) errors.push("perch anchor missing id");
    if (!SEAGULL_DEPTH_GROUPS.includes(anchor.depth)) errors.push(`${anchor.id} uses unsupported depth ${anchor.depth}`);
  }
  for (const bird of normalized.perchedInstances) {
    if (!bird.id) errors.push("perched seagull missing id");
    if (!normalized.perchAnchors.some((anchor) => anchor.id === bird.anchorId)) errors.push(`${bird.id} references unknown anchor ${bird.anchorId}`);
    if (!(bird.asset in SEAGULL_ASSETS.perched)) errors.push(`${bird.id} references unsupported perched asset ${bird.asset}`);
  }
  return { valid: errors.length === 0, errors };
}
