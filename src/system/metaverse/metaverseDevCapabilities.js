export const METAVERSE_DEV_CAPABILITY_IDS = [
  "scene",
  "clouds",
  "ocean",
  "foamTurbulence",
  "weather",
  "cargoShips",
  "wildlife",
  "depthMask",
  "traffic",
  "riverFlow",
  "rail",
  "lighting",
  "emergency",
  "debug",
  "performance",
];

const CAPABILITY_SET = new Set(METAVERSE_DEV_CAPABILITY_IDS);

export const METAVERSE_DEV_CAPABILITIES = {
  "oil-rig": {
    scene: true,
    clouds: true,
    ocean: true,
    foamTurbulence: true,
    weather: { enabled: true, precipitation: ["rain"], fog: true, lightning: true, wetSurface: false, snowAccumulation: false },
    cargoShips: true,
    wildlife: true,
    depthMask: true,
    debug: true,
    performance: true,
  },
  "open-sea": {
    scene: true,
    clouds: true,
    ocean: false,
    foamTurbulence: false,
    weather: { enabled: true, precipitation: ["rain"], fog: true, lightning: true, wetSurface: false, snowAccumulation: false },
    cargoShips: false,
    wildlife: true,
    debug: true,
    performance: true,
  },
  city: {
    scene: true,
    clouds: true,
    weather: { enabled: true, precipitation: ["rain", "snow"], fog: true, lightning: true, wetSurface: false, snowAccumulation: false },
    debug: true,
    performance: true,
  },
};

export function getMetaverseDevCapabilities(sceneId) {
  return METAVERSE_DEV_CAPABILITIES[sceneId] || { scene: true, debug: true, performance: true };
}

export function getEnabledMetaverseDevSections(capabilities = {}) {
  return METAVERSE_DEV_CAPABILITY_IDS.filter((id) => {
    const value = capabilities[id];
    return value === true || (value && typeof value === "object" && value.enabled !== false);
  });
}

export function validateMetaverseDevCapabilities(capabilities = {}) {
  const errors = [];
  for (const key of Object.keys(capabilities)) if (!CAPABILITY_SET.has(key)) errors.push(`Unknown dev capability: ${key}`);
  if (capabilities.weather && typeof capabilities.weather === "object") {
    const supported = ["rain", "snow"];
    for (const type of capabilities.weather.precipitation || []) if (!supported.includes(type)) errors.push(`Unknown precipitation type: ${type}`);
  }
  return { valid: errors.length === 0, errors };
}
