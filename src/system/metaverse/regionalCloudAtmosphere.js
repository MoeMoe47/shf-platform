export const REGIONAL_CLOUD_ASSET_BASE = "public/assets/metaverse/clouds/day";

export const REGIONAL_CLOUD_LAYER_IDS = ["far", "mid", "near"];

export const CLOUD_MOTION_PREVIEW_MODES = ["NATURAL", "VISIBLE", "EXAGGERATED"];

export const CLOUD_MOTION_PREVIEW_MULTIPLIERS = {
  NATURAL: 1,
  VISIBLE: 2.75,
  EXAGGERATED: 6.25,
};

export const OIL_RIG_DAY_CLOUD_PRESET_ID = "oil-rig-day";

export const OIL_RIG_DAY_CLOUD_PRESET = {
  id: OIL_RIG_DAY_CLOUD_PRESET_ID,
  sceneId: "oil-rig",
  timeOfDay: "DAY",
  label: "Oil Rig Day",
  enabled: true,
  windDirection: 268,
  windSpeed: 1,
  globalSpeed: 1,
  globalOpacity: 0.94,
  density: 1,
  parallaxEnabled: true,
  rigProtectionRegion: { x: 50, y: 45, width: 30, height: 34 },
  horizonY: 22,
  cloudSkyClipY: 24,
  horizonProtectionY: 22,
  layers: [
    {
      id: "far",
      label: "Far / Horizon Clouds",
      depth: 0.22,
      enabled: true,
      speedMultiplier: 0.16,
      naturalSpeedPxPerSecond: 1.15,
      parallaxMultiplier: 0.12,
      opacity: 0.6,
      scaleRange: [0.52, 0.7],
      yRange: [8, 23],
      skyBounds: { minY: 6, maxBottomY: 23.6 },
      assets: [
        `${REGIONAL_CLOUD_ASSET_BASE}/far_a.png`,
        `${REGIONAL_CLOUD_ASSET_BASE}/far_b.png`,
        `${REGIONAL_CLOUD_ASSET_BASE}/far_c.png`,
        `${REGIONAL_CLOUD_ASSET_BASE}/skyline_band.png`,
      ],
      instances: [
        { id: "far-horizon-left", asset: `${REGIONAL_CLOUD_ASSET_BASE}/skyline_band.png`, x: -11, y: 10, width: 40, opacity: 0.48, speed: 0.72, phase: 0, verticalDrift: 0.1 },
        { id: "far-horizon-right", asset: `${REGIONAL_CLOUD_ASSET_BASE}/skyline_band.png`, x: 58, y: 10.8, width: 37, opacity: 0.44, speed: 0.66, phase: 41, flipX: true, verticalDrift: 0.1 },
        { id: "far-marine-left", asset: `${REGIONAL_CLOUD_ASSET_BASE}/far_b.png`, x: 16, y: 12.2, width: 24, opacity: 0.48, speed: 0.82, phase: 37, flipX: true, verticalDrift: 0.16 },
        { id: "far-marine-right", asset: `${REGIONAL_CLOUD_ASSET_BASE}/far_c.png`, x: 77, y: 13.4, width: 22, opacity: 0.42, speed: 0.9, phase: 71, verticalDrift: 0.14 },
        { id: "far-horizon-center", asset: `${REGIONAL_CLOUD_ASSET_BASE}/far_a.png`, x: 42, y: 13.8, width: 18, opacity: 0.34, speed: 0.78, phase: 106, verticalDrift: 0.12 },
      ],
    },
    {
      id: "mid",
      label: "Mid-Distance Clouds",
      depth: 0.52,
      enabled: true,
      speedMultiplier: 0.32,
      naturalSpeedPxPerSecond: 2.2,
      parallaxMultiplier: 0.38,
      opacity: 0.72,
      scaleRange: [0.72, 0.98],
      yRange: [8, 20],
      skyBounds: { minY: 4, maxBottomY: 20.5 },
      assets: [
        `${REGIONAL_CLOUD_ASSET_BASE}/far_a.png`,
        `${REGIONAL_CLOUD_ASSET_BASE}/far_b.png`,
        `${REGIONAL_CLOUD_ASSET_BASE}/far_c.png`,
      ],
      instances: [
        { id: "mid-marine-left", asset: `${REGIONAL_CLOUD_ASSET_BASE}/far_a.png`, x: 4, y: 10.6, width: 18, opacity: 0.64, speed: 0.82, phase: 18, verticalDrift: 0.2 },
        { id: "mid-marine-right", asset: `${REGIONAL_CLOUD_ASSET_BASE}/far_c.png`, x: 72, y: 12.2, width: 22, opacity: 0.62, speed: 0.9, phase: 54, flipX: true, verticalDrift: 0.18 },
        { id: "mid-marine-center", asset: `${REGIONAL_CLOUD_ASSET_BASE}/far_b.png`, x: 35, y: 11.4, width: 21, opacity: 0.46, speed: 0.76, phase: 86, verticalDrift: 0.18 },
        { id: "mid-marine-trail", asset: `${REGIONAL_CLOUD_ASSET_BASE}/far_a.png`, x: 92, y: 11.9, width: 16, opacity: 0.42, speed: 0.72, phase: 121, flipX: true, verticalDrift: 0.16 },
      ],
    },
    {
      id: "near",
      label: "Near Clouds",
      depth: 0.78,
      enabled: true,
      speedMultiplier: 0.52,
      naturalSpeedPxPerSecond: 4.05,
      parallaxMultiplier: 0.62,
      opacity: 0.48,
      scaleRange: [0.92, 1.14],
      yRange: [4, 16],
      skyBounds: { minY: 1, maxBottomY: 16.5 },
      assets: [
        `${REGIONAL_CLOUD_ASSET_BASE}/city_left.png`,
        `${REGIONAL_CLOUD_ASSET_BASE}/city_right.png`,
      ],
      instances: [
        { id: "near-marine-left", asset: `${REGIONAL_CLOUD_ASSET_BASE}/city_left.png`, x: -22, y: 7.8, width: 24, opacity: 0.38, speed: 0.84, phase: 24, verticalDrift: 0.22 },
        { id: "near-marine-right", asset: `${REGIONAL_CLOUD_ASSET_BASE}/city_right.png`, x: 90, y: 8.6, width: 22, opacity: 0.34, speed: 0.76, phase: 67, flipX: true, verticalDrift: 0.2 },
        { id: "near-marine-high", asset: `${REGIONAL_CLOUD_ASSET_BASE}/city_left.png`, x: 48, y: 7, width: 20, opacity: 0.2, speed: 0.68, phase: 104, flipX: true, verticalDrift: 0.18 },
      ],
    },
  ],
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function numberOr(value, fallback) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export function cloneCloudSceneConfig(config = OIL_RIG_DAY_CLOUD_PRESET) {
  return structuredClone(config);
}

export function resolveCloudWindVector(windDirection = 270) {
  const radians = (numberOr(windDirection, 270) * Math.PI) / 180;
  return {
    x: Math.sin(radians),
    y: -Math.cos(radians),
  };
}

export function normalizeCloudMotionPreviewMode(mode = "NATURAL") {
  const normalized = String(mode || "NATURAL").toUpperCase();
  return CLOUD_MOTION_PREVIEW_MODES.includes(normalized) ? normalized : "NATURAL";
}

export function normalizeCloudSceneConfig(source = OIL_RIG_DAY_CLOUD_PRESET) {
  const fallback = OIL_RIG_DAY_CLOUD_PRESET;
  return {
    ...fallback,
    ...source,
    enabled: source.enabled !== false,
    windDirection: ((numberOr(source.windDirection, fallback.windDirection) % 360) + 360) % 360,
    windSpeed: clamp(numberOr(source.windSpeed, fallback.windSpeed), 0, 4),
    globalSpeed: clamp(numberOr(source.globalSpeed, fallback.globalSpeed), 0, 4),
    globalOpacity: clamp(numberOr(source.globalOpacity, fallback.globalOpacity), 0, 1.5),
    density: clamp(numberOr(source.density, fallback.density), 0, 1),
    parallaxEnabled: source.parallaxEnabled !== false,
    horizonY: clamp(numberOr(source.horizonY, fallback.horizonY), 0, 100),
    cloudSkyClipY: clamp(numberOr(source.cloudSkyClipY, fallback.cloudSkyClipY), 0, 100),
    layers: (source.layers || fallback.layers).map((layer) => ({
      ...layer,
      enabled: layer.enabled !== false,
      speedMultiplier: clamp(numberOr(layer.speedMultiplier, 0.25), 0, 2),
      naturalSpeedPxPerSecond: clamp(numberOr(layer.naturalSpeedPxPerSecond, 10), 0, 120),
      parallaxMultiplier: clamp(numberOr(layer.parallaxMultiplier, 0.25), 0, 1),
      opacity: clamp(numberOr(layer.opacity, 0.5), 0, 1),
      skyBounds: {
        minY: clamp(numberOr(layer.skyBounds?.minY, layer.yRange?.[0] ?? 0), 0, 100),
        maxBottomY: clamp(numberOr(layer.skyBounds?.maxBottomY, layer.yRange?.[1] ?? source.cloudSkyClipY ?? fallback.cloudSkyClipY), 0, 100),
      },
      instances: (layer.instances || []).map((instance) => ({
        ...instance,
        x: numberOr(instance.x, 0),
        y: numberOr(instance.y, 12),
        width: clamp(numberOr(instance.width, 20), 1, 120),
        opacity: clamp(numberOr(instance.opacity, 0.5), 0, 1),
        speed: clamp(numberOr(instance.speed, 1), 0, 3),
        phase: numberOr(instance.phase, 0),
        verticalDrift: clamp(numberOr(instance.verticalDrift, 0), 0, 2),
      })),
    })),
  };
}

export function resolveCloudLayerEnabled(config, layerId) {
  const normalized = normalizeCloudSceneConfig(config);
  return Boolean(normalized.enabled && normalized.layers.find((layer) => layer.id === layerId)?.enabled);
}

export function resolveRenderableCloudInstances(config = OIL_RIG_DAY_CLOUD_PRESET, { reducedMotion = false, motionPreview = "NATURAL" } = {}) {
  const normalized = normalizeCloudSceneConfig(config);
  if (!normalized.enabled) return [];
  const previewMode = normalizeCloudMotionPreviewMode(motionPreview);
  const previewMultiplier = CLOUD_MOTION_PREVIEW_MULTIPLIERS[previewMode];
  const totalInstances = normalized.layers.reduce((sum, layer) => sum + (layer.enabled ? layer.instances.length : 0), 0);
  const maxDensityInstances = Math.max(0, Math.ceil(totalInstances * normalized.density));
  let count = 0;
  return normalized.layers.flatMap((layer) => {
    if (!layer.enabled) return [];
    return layer.instances.flatMap((instance) => {
      count += 1;
      if (count > maxDensityInstances) return [];
      return {
        ...instance,
        layerId: layer.id,
        depth: layer.depth,
        layerOpacity: layer.opacity,
        skyBounds: layer.skyBounds,
        effectiveOpacity: clamp(instance.opacity * layer.opacity * normalized.globalOpacity, 0, 1),
        speedPxPerSecond: reducedMotion ? 0 : layer.naturalSpeedPxPerSecond * instance.speed * normalized.windSpeed * normalized.globalSpeed * previewMultiplier,
        motionPreview: previewMode,
        parallaxMultiplier: normalized.parallaxEnabled ? layer.parallaxMultiplier : 1,
      };
    });
  });
}

export function resolveCloudLayerSkyBounds(config = OIL_RIG_DAY_CLOUD_PRESET) {
  const normalized = normalizeCloudSceneConfig(config);
  return normalized.layers.reduce((bounds, layer) => ({
    ...bounds,
    [layer.id]: layer.skyBounds,
  }), {});
}

export function validateCloudSceneConfig(config = OIL_RIG_DAY_CLOUD_PRESET) {
  const errors = [];
  const normalized = normalizeCloudSceneConfig(config);
  if (!normalized.id) errors.push("cloud config missing id");
  if (!normalized.layers.length) errors.push("cloud config must include layers");
  for (const layerId of REGIONAL_CLOUD_LAYER_IDS) {
    if (!normalized.layers.some((layer) => layer.id === layerId)) errors.push(`cloud config missing ${layerId} layer`);
  }
    for (const layer of normalized.layers) {
    if (!layer.instances.length) errors.push(`${layer.id} layer must include at least one cloud instance`);
    if (layer.naturalSpeedPxPerSecond <= 0) errors.push(`${layer.id} layer must include naturalSpeedPxPerSecond`);
    for (const asset of layer.assets || []) {
      if (!asset.startsWith(REGIONAL_CLOUD_ASSET_BASE)) errors.push(`${layer.id} references non-approved cloud asset ${asset}`);
    }
    for (const instance of layer.instances) {
      if (!instance.asset) errors.push(`${layer.id}/${instance.id} missing asset`);
      if (!instance.asset?.startsWith(REGIONAL_CLOUD_ASSET_BASE)) errors.push(`${layer.id}/${instance.id} references non-approved cloud asset ${instance.asset}`);
      if (instance.y > layer.skyBounds.maxBottomY) errors.push(`${layer.id}/${instance.id} anchor exceeds ${layer.id} sky bounds`);
      if (instance.width > 32 && instance.x > 34 && instance.x < 66 && instance.y > 12) {
        errors.push(`${layer.id}/${instance.id} risks obscuring the protected rig silhouette`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}
