import {
  clampProgress,
  clampSceneCoordinate,
  nearestProgressOnRoute,
  sampleRouteAtProgress,
  sampleRouteSpline,
} from "./traffic/metaverseTrafficAuthoringModel.js";

export const OCEAN_ENGINE_SCHEMA_VERSION = 1;
export const OCEAN_ENGINE_STORAGE_KEY = "met-ocean-motion-engine-dev-v1";

export const OCEAN_EDITOR_TOOLS = [
  "SELECT",
  "DRAW_FLOW",
  "EDIT_FLOW",
  "DRAW_TURBULENCE",
  "DRAW_FOAM",
  "DRAW_WAKE",
  "ADD_POINT",
  "DELETE",
];

export const OCEAN_WEATHER_PRESETS = ["Calm", "Light Breeze", "Moderate Sea", "Windy", "Rough", "Storm", "Custom"];
export const OCEAN_QUALITY_MODES = ["Low", "Medium", "High", "Ultra"];

const DEFAULT_BACKGROUND = "public/assets/metaverse/regional/oil-rig/oil-rig-background-day.png";

export function createOceanId(prefix = "ocean") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function clamp01(value, fallback = 0) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}

export function clampNumber(value, min, max, fallback = min) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function normalizeAngle(value, fallback = 0) {
  if (!Number.isFinite(value)) return fallback;
  const angle = value % 360;
  return angle < 0 ? angle + 360 : angle;
}

export function createWaveLayerConfig(kind, overrides = {}) {
  const defaults = {
    swell: { amplitude: 0.56, speed: 0.13, direction: 258, scale: 0.44, opacity: 0.42, noise: 0.12, parallaxFactor: 0.35, enabled: true },
    medium: { amplitude: 0.42, speed: 0.31, direction: 242, scale: 1.34, opacity: 0.34, noise: 0.22, parallaxFactor: 0.58, enabled: true },
    ripple: { amplitude: 0.16, speed: 0.68, direction: 226, scale: 3.35, opacity: 0.28, noise: 0.34, parallaxFactor: 0.96, enabled: true },
  }[kind] || {};
  return {
    id: kind,
    kind,
    label: kind === "swell" ? "Large Swell" : kind === "medium" ? "Medium Waves" : "Small Ripples",
    ...defaults,
    ...overrides,
  };
}

export function createFlowPath(overrides = {}) {
  const label = overrides.label || "Ocean Current";
  return {
    id: overrides.id || createOceanId("flow"),
    label,
    points: Array.isArray(overrides.points) ? overrides.points.map(normalizePoint) : [],
    speed: clampNumber(overrides.speed ?? 0.34, 0, 4, 0.34),
    direction: normalizeAngle(overrides.direction ?? 250),
    strength: clampNumber(overrides.strength ?? 0.55, 0, 2, 0.55),
    width: clampNumber(overrides.width ?? 8, 0.5, 40, 8),
    feather: clampNumber(overrides.feather ?? 0.42, 0, 1, 0.42),
    layer: overrides.layer || "surface-current",
    enabled: overrides.enabled !== false,
    color: overrides.color || "#38bdf8",
  };
}

export function createFoamZone(overrides = {}) {
  return {
    id: overrides.id || createOceanId("foam"),
    label: overrides.label || "Foam Zone",
    shape: overrides.shape || "ellipse",
    center: normalizePoint(overrides.center || { x: 50, y: 60 }),
    radiusX: clampNumber(overrides.radiusX ?? 10, 1, 60, 10),
    radiusY: clampNumber(overrides.radiusY ?? 5, 1, 60, 5),
    driftDirection: normalizeAngle(overrides.driftDirection ?? 250),
    density: clampNumber(overrides.density ?? 0.55, 0, 1.5, 0.55),
    opacity: clamp01(overrides.opacity ?? 0.42, 0.42),
    lifetime: clampNumber(overrides.lifetime ?? 8, 0.5, 60, 8),
    fadeIn: clampNumber(overrides.fadeIn ?? 0.2, 0, 1, 0.2),
    fadeOut: clampNumber(overrides.fadeOut ?? 0.55, 0, 1, 0.55),
    scale: clampNumber(overrides.scale ?? 1, 0.1, 5, 1),
    regeneration: clampNumber(overrides.regeneration ?? 0.55, 0, 1, 0.55),
    distortion: clampNumber(overrides.distortion ?? 0.36, 0, 2, 0.36),
    stretch: clampNumber(overrides.stretch ?? 0.48, 0, 2, 0.48),
    flowFollowing: clampNumber(overrides.flowFollowing ?? 0.7, 0, 1, 0.7),
    enabled: overrides.enabled !== false,
  };
}

export function createTurbulenceZone(overrides = {}) {
  return {
    id: overrides.id || createOceanId("turbulence"),
    label: overrides.label || "Turbulence Zone",
    shape: overrides.shape || "ellipse",
    center: normalizePoint(overrides.center || { x: 50, y: 58 }),
    radius: clampNumber(overrides.radius ?? 7, 1, 50, 7),
    radiusX: clampNumber(overrides.radiusX ?? overrides.radius ?? 7, 1, 50, 7),
    radiusY: clampNumber(overrides.radiusY ?? 5, 1, 50, 5),
    points: Array.isArray(overrides.points) ? overrides.points.map(normalizePoint) : [],
    intensity: clampNumber(overrides.intensity ?? 0.62, 0, 2, 0.62),
    swirlAmount: clampNumber(overrides.swirlAmount ?? 0.34, -2, 2, 0.34),
    randomness: clampNumber(overrides.randomness ?? 0.28, 0, 2, 0.28),
    foamBoost: clampNumber(overrides.foamBoost ?? 0.4, 0, 2, 0.4),
    waveDistortionMultiplier: clampNumber(overrides.waveDistortionMultiplier ?? 1.25, 0, 4, 1.25),
    localSpeedMultiplier: clampNumber(overrides.localSpeedMultiplier ?? 1.18, 0, 4, 1.18),
    edgeFeather: clampNumber(overrides.edgeFeather ?? 0.45, 0, 1, 0.45),
    enabled: overrides.enabled !== false,
  };
}

export function createWakeZone(overrides = {}) {
  return {
    id: overrides.id || createOceanId("wake"),
    label: overrides.label || "Wake / Disturbance",
    sourceType: overrides.sourceType || "static",
    sourcePosition: normalizePoint(overrides.sourcePosition || { x: 45, y: 65 }),
    path: Array.isArray(overrides.path) ? overrides.path.map(normalizePoint) : [],
    direction: normalizeAngle(overrides.direction ?? 250),
    width: clampNumber(overrides.width ?? 7, 0.5, 40, 7),
    taper: clampNumber(overrides.taper ?? 0.7, 0, 1, 0.7),
    amplitude: clampNumber(overrides.amplitude ?? 0.35, 0, 2, 0.35),
    foamAmount: clampNumber(overrides.foamAmount ?? 0.5, 0, 2, 0.5),
    duration: clampNumber(overrides.duration ?? 16, 0.5, 120, 16),
    persistence: clampNumber(overrides.persistence ?? 0.62, 0, 1, 0.62),
    fade: clampNumber(overrides.fade ?? 0.55, 0, 1, 0.55),
    enabled: overrides.enabled !== false,
  };
}

export const OCEAN_WEATHER_PRESET_CONFIGS = {
  Calm: { globalSpeed: 0.55, globalIntensity: 0.38, foam: 0.2, shimmer: 0.38, turbulence: 0.42, swell: 0.36, waves: 0.22, ripples: 0.2 },
  "Light Breeze": { globalSpeed: 0.78, globalIntensity: 0.55, foam: 0.32, shimmer: 0.52, turbulence: 0.55, swell: 0.5, waves: 0.42, ripples: 0.42 },
  "Moderate Sea": { globalSpeed: 1, globalIntensity: 0.76, foam: 0.5, shimmer: 0.46, turbulence: 0.72, swell: 0.72, waves: 0.7, ripples: 0.64 },
  Windy: { globalSpeed: 1.24, globalIntensity: 0.94, foam: 0.68, shimmer: 0.36, turbulence: 0.9, swell: 0.88, waves: 0.92, ripples: 0.8 },
  Rough: { globalSpeed: 1.45, globalIntensity: 1.12, foam: 0.86, shimmer: 0.28, turbulence: 1.1, swell: 1.05, waves: 1.12, ripples: 0.9 },
  Storm: { globalSpeed: 1.82, globalIntensity: 1.42, foam: 1.12, shimmer: 0.16, turbulence: 1.5, swell: 1.36, waves: 1.46, ripples: 0.96 },
  Custom: null,
};

export function createDefaultPlaybackState(overrides = {}) {
  return {
    playing: overrides.playing ?? true,
    time: clampNumber(overrides.time ?? 0, 0, Number.MAX_SAFE_INTEGER, 0),
    duration: clampNumber(overrides.duration ?? 60, 1, 600, 60),
    timeScale: clampNumber(overrides.timeScale ?? 1, 0.01, 8, 1),
    loop: overrides.loop !== false,
    fps: clampNumber(overrides.fps ?? 0, 0, 240, 0),
    frame: Math.max(0, Math.round(overrides.frame || 0)),
    restartKey: Math.max(0, Math.round(overrides.restartKey || 0)),
    quality: OCEAN_QUALITY_MODES.includes(overrides.quality) ? overrides.quality : "High",
    reducedEffects: overrides.reducedEffects === true,
    adaptivePerformance: overrides.adaptivePerformance === true,
    freezeRenderer: overrides.freezeRenderer === true,
    motionPreview: ["NATURAL", "VISIBLE", "EXAGGERATED"].includes(overrides.motionPreview) ? overrides.motionPreview : "NATURAL",
  };
}

export function createDefaultDebugState(overrides = {}) {
  return {
    enabled: overrides.enabled ?? true,
    showFlow: overrides.showFlow ?? true,
    showArrows: overrides.showArrows ?? true,
    showZones: overrides.showZones ?? true,
    showInfluence: overrides.showInfluence ?? true,
    showLabels: overrides.showLabels ?? true,
    showVectors: overrides.showVectors ?? true,
    showLayerDebug: overrides.showLayerDebug ?? false,
    showOceanMask: overrides.showOceanMask ?? false,
    showVideoBounds: overrides.showVideoBounds ?? false,
    showDepthBands: overrides.showDepthBands ?? false,
  };
}

export const OIL_RIG_DAY_OCEAN_PRESET = {
  id: "oil-rig-ocean-motion-dev",
  name: "Oil Rig DAY Production Ocean Surface",
  backgroundImageUrl: DEFAULT_BACKGROUND,
  dimensions: { width: 1536, height: 1024 },
  weatherPreset: "Moderate Sea",
  global: {
    speed: 1,
    intensity: 0.82,
    flowDirection: 250,
    flowSpeed: 0.46,
    displacementStrength: 1,
    horizonSuppression: 0.94,
    horizonY: 21.1,
    foregroundY: 96,
    depthPerspective: 0.82,
  },
  surface: { enabled: true },
  effects: { foamEnabled: true, turbulenceEnabled: true, globalTurbulence: 0.72 },
  waves: {
    swell: createWaveLayerConfig("swell"),
    medium: createWaveLayerConfig("medium"),
    ripple: createWaveLayerConfig("ripple"),
  },
  shimmer: { enabled: true, brightness: 0.34, flickerAmount: 0.16, drift: 0.42, density: 0.36, patchSize: 0.22, motionSpeed: 0.34, angleBias: 248 },
  flowPaths: [
    createFlowPath({ id: "flow-east-surface-band", label: "Surface Current East Band", points: [{ x: 6, y: 42 }, { x: 26, y: 39 }, { x: 53, y: 43 }, { x: 78, y: 40 }, { x: 96, y: 45 }], speed: 0.32, width: 11, strength: 0.54, color: "#38bdf8" }),
    createFlowPath({ id: "flow-rig-shear-band", label: "Rig Shear Current", points: [{ x: 3, y: 63 }, { x: 24, y: 61 }, { x: 45, y: 66 }, { x: 66, y: 62 }, { x: 98, y: 68 }], speed: 0.42, width: 13, strength: 0.68, color: "#22d3ee" }),
    createFlowPath({ id: "flow-foreground-return", label: "Foreground Return Flow", points: [{ x: 0, y: 82 }, { x: 24, y: 78 }, { x: 54, y: 84 }, { x: 100, y: 79 }], speed: 0.28, width: 16, strength: 0.5, color: "#60a5fa" }),
  ],
  foamZones: [
    createFoamZone({ id: "foam-rig-supports", label: "Rig Support Foam", center: { x: 50, y: 63 }, radiusX: 14, radiusY: 6, density: 0.78, opacity: 0.5, stretch: 0.72 }),
    createFoamZone({ id: "foam-open-ocean-streaks", label: "Open Ocean Foam Streaks", center: { x: 35, y: 75 }, radiusX: 26, radiusY: 8, density: 0.34, opacity: 0.26, driftDirection: 252 }),
  ],
  turbulenceZones: [
    createTurbulenceZone({ id: "turbulence-main-rig-base", label: "Main Rig Base Turbulence", center: { x: 50, y: 62 }, radiusX: 12, radiusY: 7, intensity: 0.92, swirlAmount: 0.44, foamBoost: 0.66 }),
    createTurbulenceZone({ id: "turbulence-left-column", label: "Left Support Eddy", center: { x: 43, y: 64 }, radiusX: 7, radiusY: 5, intensity: 0.58, swirlAmount: -0.32, foamBoost: 0.35 }),
    createTurbulenceZone({ id: "turbulence-right-column", label: "Right Support Eddy", center: { x: 57, y: 64 }, radiusX: 7, radiusY: 5, intensity: 0.6, swirlAmount: 0.38, foamBoost: 0.38 }),
  ],
  wakeZones: [
    createWakeZone({ id: "wake-service-disturbance", label: "Service Zone Disturbance", sourcePosition: { x: 37, y: 68 }, direction: 250, width: 12, taper: 0.8, amplitude: 0.32, foamAmount: 0.48 }),
  ],
  playbackDefaults: createDefaultPlaybackState({ playing: true }),
  debug: createDefaultDebugState({ enabled: true }),
  metadata: {
    version: OCEAN_ENGINE_SCHEMA_VERSION,
    sceneType: "offshore-oil-rig",
    lockedMasterScene: true,
    createdBy: "Silicon Heartland Ocean Motion Engine",
    updatedAt: "2026-09-23",
  },
};

export function createOilRigOceanSceneConfig(overrides = {}) {
  return normalizeOceanSceneConfig({
    ...OIL_RIG_DAY_OCEAN_PRESET,
    ...overrides,
  });
}

export function normalizePoint(point) {
  return {
    x: clampSceneCoordinate(Number(point?.x)),
    y: clampSceneCoordinate(Number(point?.y)),
  };
}

export function normalizeOceanSceneConfig(value) {
  const source = value || {};
  const waveSource = source.waves || {};
  const global = source.global || {};
  return {
    id: source.id || createOceanId("scene"),
    name: source.name || "Untitled Ocean Scene",
    backgroundImageUrl: source.backgroundImageUrl || DEFAULT_BACKGROUND,
    dimensions: {
      width: Math.max(1, Math.round(source.dimensions?.width || 1536)),
      height: Math.max(1, Math.round(source.dimensions?.height || 1024)),
    },
    global: {
      speed: clampNumber(global.speed ?? 1, 0, 5, 1),
      intensity: clampNumber(global.intensity ?? 0.75, 0, 3, 0.75),
      flowDirection: normalizeAngle(global.flowDirection ?? 250, 250),
      flowSpeed: clampNumber(global.flowSpeed ?? 0.52, 0, 3, 0.52),
      displacementStrength: clampNumber(global.displacementStrength ?? 0.82, 0, 2, 0.82),
      horizonSuppression: clampNumber(global.horizonSuppression ?? 0.86, 0, 1, 0.86),
      horizonY: clampSceneCoordinate(global.horizonY ?? 30),
      foregroundY: clampSceneCoordinate(global.foregroundY ?? 92),
      depthPerspective: clampNumber(global.depthPerspective ?? 0.72, 0, 1, 0.72),
    },
    weatherPreset: OCEAN_WEATHER_PRESETS.includes(source.weatherPreset) ? source.weatherPreset : "Custom",
    surface: { enabled: source.surface?.enabled !== false },
    effects: {
      foamEnabled: source.effects?.foamEnabled !== false,
      turbulenceEnabled: source.effects?.turbulenceEnabled !== false,
      globalTurbulence: clampNumber(source.effects?.globalTurbulence ?? 0.72, 0, 2, 0.72),
    },
    waves: {
      swell: normalizeWaveLayer(waveSource.swell || source.waveLayers?.swell, "swell"),
      medium: normalizeWaveLayer(waveSource.medium || source.waveLayers?.medium, "medium"),
      ripple: normalizeWaveLayer(waveSource.ripple || source.waveLayers?.ripple, "ripple"),
    },
    shimmer: normalizeShimmer(source.shimmer),
    flowPaths: Array.isArray(source.flowPaths) ? source.flowPaths.map(createFlowPath) : [],
    foamZones: Array.isArray(source.foamZones) ? source.foamZones.map(createFoamZone) : [],
    turbulenceZones: Array.isArray(source.turbulenceZones) ? source.turbulenceZones.map(createTurbulenceZone) : [],
    wakeZones: Array.isArray(source.wakeZones) ? source.wakeZones.map(createWakeZone) : [],
    playbackDefaults: createDefaultPlaybackState(source.playbackDefaults),
    debug: createDefaultDebugState(source.debug),
    metadata: {
      version: OCEAN_ENGINE_SCHEMA_VERSION,
      lockedMasterScene: true,
      ...(source.metadata || {}),
    },
  };
}

export function normalizeWaveLayer(layer, kind) {
  const merged = createWaveLayerConfig(kind, layer || {});
  return {
    ...merged,
    amplitude: clampNumber(merged.amplitude, 0, 3, 0),
    speed: clampNumber(merged.speed, 0, 5, 0),
    direction: normalizeAngle(merged.direction, 0),
    scale: clampNumber(merged.scale, 0.05, 10, 1),
    opacity: clamp01(merged.opacity, 0.3),
    noise: clampNumber(merged.noise, 0, 2, 0),
    parallaxFactor: clampNumber(merged.parallaxFactor, 0, 2, 1),
    enabled: merged.enabled !== false,
  };
}

export function normalizeShimmer(shimmer = {}) {
  return {
    enabled: shimmer.enabled !== false,
    brightness: clampNumber(shimmer.brightness ?? 0.32, 0, 1.5, 0.32),
    flickerAmount: clampNumber(shimmer.flickerAmount ?? 0.16, 0, 1, 0.16),
    drift: clampNumber(shimmer.drift ?? 0.4, 0, 2, 0.4),
    density: clampNumber(shimmer.density ?? 0.36, 0, 1, 0.36),
    patchSize: clampNumber(shimmer.patchSize ?? 0.22, 0.02, 2, 0.22),
    motionSpeed: clampNumber(shimmer.motionSpeed ?? 0.34, 0, 3, 0.34),
    angleBias: normalizeAngle(shimmer.angleBias ?? 248),
  };
}

export function applyOceanWeatherPreset(config, presetName) {
  const preset = OCEAN_WEATHER_PRESET_CONFIGS[presetName];
  if (!preset) return normalizeOceanSceneConfig({ ...config, weatherPreset: "Custom" });
  const next = normalizeOceanSceneConfig(config);
  next.weatherPreset = presetName;
  next.global.speed = preset.globalSpeed;
  next.global.intensity = preset.globalIntensity;
  next.waves.swell.amplitude = preset.swell;
  next.waves.medium.amplitude = preset.waves;
  next.waves.ripple.amplitude = preset.ripples;
  next.foamZones = next.foamZones.map((zone) => ({ ...zone, density: clampNumber(zone.density * (0.6 + preset.foam), 0, 1.5, zone.density) }));
  next.turbulenceZones = next.turbulenceZones.map((zone) => ({ ...zone, intensity: clampNumber(zone.intensity * preset.turbulence, 0, 2, zone.intensity) }));
  next.shimmer.brightness = preset.shimmer;
  return next;
}

export function addOceanFlowPoint(path, point, { insertAfter = null } = {}) {
  const points = path.points.slice();
  const normalized = normalizePoint(point);
  if (insertAfter === null || insertAfter === undefined) points.push(normalized);
  else points.splice(Math.min(points.length, Math.max(0, insertAfter + 1)), 0, normalized);
  return { ...path, points };
}

export function moveOceanFlowPoint(path, index, point) {
  if (index < 0 || index >= path.points.length) return path;
  const points = path.points.slice();
  points[index] = normalizePoint(point);
  return { ...path, points };
}

export function deleteOceanFlowPoint(path, index) {
  if (index < 0 || index >= path.points.length) return path;
  return { ...path, points: path.points.filter((_, itemIndex) => itemIndex !== index) };
}

export function duplicateOceanEntity(entity, prefix = "copy") {
  return {
    ...structuredCloneSafe(entity),
    id: createOceanId(prefix),
    label: `${entity.label || entity.name || "Object"} Copy`,
    enabled: entity.enabled !== false,
  };
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

export function exportOceanSceneConfig(config) {
  return normalizeOceanSceneConfig(config);
}

export function parseOceanSceneConfigJson(json) {
  try {
    const parsed = typeof json === "string" ? JSON.parse(json) : json;
    return { config: normalizeOceanSceneConfig(parsed), errors: [] };
  } catch (error) {
    return { config: null, errors: [error instanceof Error ? error.message : "Invalid JSON"] };
  }
}

export function validateOceanSceneConfig(config) {
  const normalized = normalizeOceanSceneConfig(config);
  const errors = [];
  if (!normalized.backgroundImageUrl) errors.push("backgroundImageUrl is required");
  if (!normalized.flowPaths.length) errors.push("at least one flow path is recommended");
  normalized.flowPaths.forEach((path) => {
    if (path.points.length < 2) errors.push(`${path.label} needs at least 2 points`);
  });
  if (!normalized.turbulenceZones.length) errors.push("at least one turbulence zone is recommended for the oil-rig sample");
  return { valid: errors.length === 0, errors, config: normalized };
}

export function advanceOceanPlayback(playback, deltaSeconds) {
  const state = createDefaultPlaybackState(playback);
  if (!state.playing) return state;
  const nextTime = state.time + Math.max(0, deltaSeconds) * state.timeScale;
  const duration = state.duration || 60;
  const loopedTime = state.loop ? nextTime % duration : Math.min(duration, nextTime);
  return {
    ...state,
    playing: state.loop ? true : loopedTime < duration,
    time: loopedTime,
    frame: state.frame + 1,
    fps: deltaSeconds > 0 ? Math.round(1 / deltaSeconds) : state.fps,
  };
}

export function stepOceanPlayback(playback, frameDelta = 1) {
  const state = createDefaultPlaybackState(playback);
  const seconds = frameDelta / 60;
  return { ...advanceOceanPlayback({ ...state, playing: true }, seconds), playing: false };
}

export function resolveOceanDepthFactor(y, global = {}) {
  const horizon = clampSceneCoordinate(global.horizonY ?? 30);
  const foreground = Math.max(horizon + 1, clampSceneCoordinate(global.foregroundY ?? 92));
  return clamp01((clampSceneCoordinate(y) - horizon) / (foreground - horizon), 0);
}

export function resolveWaveSample(layer, point, time, global = {}) {
  if (!layer?.enabled) return { offsetX: 0, offsetY: 0, opacity: 0 };
  const depth = resolveOceanDepthFactor(point.y, global);
  const perspective = 0.25 + depth * (0.75 + (layer.parallaxFactor || 0) * 0.35);
  const radians = (normalizeAngle(layer.direction) * Math.PI) / 180;
  const phase = (point.x * Math.cos(radians) + point.y * Math.sin(radians)) * layer.scale * 0.1 + time * layer.speed;
  const wave = Math.sin(phase) + Math.sin(phase * 0.47 + layer.noise * 4) * layer.noise;
  const amplitude = wave * layer.amplitude * perspective * (global.intensity ?? 1);
  return {
    offsetX: Math.cos(radians) * amplitude,
    offsetY: Math.sin(radians) * amplitude,
    opacity: layer.opacity * perspective,
  };
}

export function resolveCombinedOceanMotion(config, point, time) {
  const scene = normalizeOceanSceneConfig(config);
  const layers = [scene.waves.swell, scene.waves.medium, scene.waves.ripple];
  const wave = layers.reduce((acc, layer) => {
    const sample = resolveWaveSample(layer, point, time * scene.global.speed, scene.global);
    return {
      offsetX: acc.offsetX + sample.offsetX,
      offsetY: acc.offsetY + sample.offsetY,
      opacity: Math.max(acc.opacity, sample.opacity),
    };
  }, { offsetX: 0, offsetY: 0, opacity: 0 });
  const turbulence = scene.turbulenceZones.filter((zone) => zone.enabled).reduce((amount, zone) => {
    const dx = point.x - zone.center.x;
    const dy = point.y - zone.center.y;
    const nx = dx / Math.max(1, zone.radiusX || zone.radius || 1);
    const ny = dy / Math.max(1, zone.radiusY || zone.radius || 1);
    const distance = Math.sqrt(nx * nx + ny * ny);
    const influence = distance >= 1 ? 0 : Math.pow(1 - distance, 1 + zone.edgeFeather);
    return amount + influence * zone.intensity;
  }, 0);
  return {
    ...wave,
    turbulence,
    offsetX: wave.offsetX * (1 + turbulence * 0.22),
    offsetY: wave.offsetY * (1 + turbulence * 0.22),
  };
}

export function getOceanFlowRenderSamples(path) {
  return sampleRouteSpline(path.points, 18);
}

export function sampleOceanFlowAtProgress(path, progress) {
  return sampleRouteAtProgress(path.points, clampProgress(progress));
}

export function nearestProgressOnOceanFlow(path, point) {
  return nearestProgressOnRoute(path.points, point.x, point.y);
}
