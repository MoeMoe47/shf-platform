export const METAVERSE_WEATHER_MODES = [
  "CLEAR", "PARTLY_CLOUDY", "CLOUDY", "OVERCAST", "LIGHT_RAIN", "RAIN", "HEAVY_RAIN",
  "THUNDERSTORM", "LIGHT_SNOW", "SNOW", "HEAVY_SNOW", "FOG", "MIST", "WINDY", "CUSTOM",
];
export const METAVERSE_PRECIPITATION_TYPES = ["NONE", "RAIN", "SNOW"];

const PRESETS = {
  CLEAR: { precipitationType: "NONE", precipitationIntensity: 0, cloudCoverage: 0.18, visibility: 1, fogDensity: 0, atmosphericMoisture: 0.18, surfaceWetness: 0, stormIntensity: 0 },
  PARTLY_CLOUDY: { precipitationType: "NONE", precipitationIntensity: 0, cloudCoverage: 0.42, visibility: 0.96, fogDensity: 0.02, atmosphericMoisture: 0.28, surfaceWetness: 0 },
  CLOUDY: { precipitationType: "NONE", precipitationIntensity: 0, cloudCoverage: 0.68, visibility: 0.88, fogDensity: 0.04, atmosphericMoisture: 0.4, surfaceWetness: 0 },
  OVERCAST: { precipitationType: "NONE", precipitationIntensity: 0, cloudCoverage: 0.9, visibility: 0.78, fogDensity: 0.08, atmosphericMoisture: 0.58, surfaceWetness: 0.08 },
  LIGHT_RAIN: { precipitationType: "RAIN", precipitationIntensity: 0.24, cloudCoverage: 0.88, visibility: 0.74, fogDensity: 0.1, atmosphericMoisture: 0.72, surfaceWetness: 0.22 },
  RAIN: { precipitationType: "RAIN", precipitationIntensity: 0.54, cloudCoverage: 0.94, visibility: 0.58, fogDensity: 0.16, atmosphericMoisture: 0.84, surfaceWetness: 0.5 },
  HEAVY_RAIN: { precipitationType: "RAIN", precipitationIntensity: 0.82, cloudCoverage: 1, visibility: 0.4, fogDensity: 0.24, atmosphericMoisture: 0.94, surfaceWetness: 0.78 },
  THUNDERSTORM: { precipitationType: "RAIN", precipitationIntensity: 0.94, cloudCoverage: 1, visibility: 0.32, fogDensity: 0.3, atmosphericMoisture: 1, surfaceWetness: 0.92, stormIntensity: 0.92, lightningEnabled: true },
  LIGHT_SNOW: { precipitationType: "SNOW", precipitationIntensity: 0.22, cloudCoverage: 0.82, visibility: 0.72, fogDensity: 0.1, atmosphericMoisture: 0.76 },
  SNOW: { precipitationType: "SNOW", precipitationIntensity: 0.52, cloudCoverage: 0.94, visibility: 0.52, fogDensity: 0.2, atmosphericMoisture: 0.9 },
  HEAVY_SNOW: { precipitationType: "SNOW", precipitationIntensity: 0.82, cloudCoverage: 1, visibility: 0.36, fogDensity: 0.3, atmosphericMoisture: 1, snowAccumulation: 0.72 },
  FOG: { precipitationType: "NONE", precipitationIntensity: 0, cloudCoverage: 0.58, visibility: 0.28, fogDensity: 0.72, atmosphericMoisture: 0.92 },
  MIST: { precipitationType: "NONE", precipitationIntensity: 0, cloudCoverage: 0.44, visibility: 0.62, fogDensity: 0.38, atmosphericMoisture: 0.78 },
  WINDY: { precipitationType: "NONE", precipitationIntensity: 0, cloudCoverage: 0.52, visibility: 0.84, fogDensity: 0.04, atmosphericMoisture: 0.42, windSpeed: 1.8, gustStrength: 0.5 },
};

export const METAVERSE_WEATHER_PRESETS = PRESETS;

export function createMetaverseEnvironmentConfig(overrides = {}) {
  const preset = PRESETS[overrides.weatherMode] || PRESETS.CLEAR;
  return normalizeMetaverseEnvironmentConfig({
    weatherMode: "CLEAR",
    precipitationType: "NONE",
    precipitationEnabled: false,
    precipitationIntensity: 0,
    particleDensity: 0.55,
    fallSpeed: 1,
    windInfluence: 0.72,
    precipitationDirection: 0,
    nearFarDepth: 0.72,
    precipitationOpacity: 0.64,
    windDirection: 268,
    windSpeed: 1,
    gustStrength: 0.18,
    gustFrequency: 0.25,
    cloudCoverage: 0.18,
    cloudSpeed: 1,
    visibility: 1,
    fogDensity: 0,
    atmosphericMoisture: 0.18,
    horizonHaze: 0.08,
    cloudLightReduction: 0.12,
    ambientBrightness: 1,
    surfaceWetness: 0,
    snowAccumulation: 0,
    accumulationRate: 0.2,
    meltRate: 0.1,
    lightningEnabled: false,
    lightningFrequency: 0.08,
    stormIntensity: 0,
    transitionDuration: 8,
    instantTransition: false,
    ...preset,
    ...overrides,
  });
}

export function normalizeMetaverseEnvironmentConfig(source = {}) {
  const number = (value, fallback, min = 0, max = 1) => Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Number(value))) : fallback;
  const mode = METAVERSE_WEATHER_MODES.includes(source.weatherMode) ? source.weatherMode : "CUSTOM";
  return {
    ...createBase(source),
    weatherMode: mode,
    precipitationType: METAVERSE_PRECIPITATION_TYPES.includes(source.precipitationType) ? source.precipitationType : "NONE",
    precipitationEnabled: source.precipitationEnabled === true,
    precipitationIntensity: number(source.precipitationIntensity, 0),
    particleDensity: number(source.particleDensity, 0.55),
    fallSpeed: number(source.fallSpeed, 1, 0, 3),
    windInfluence: number(source.windInfluence, 0.72),
    precipitationDirection: number(source.precipitationDirection, 0, -80, 80),
    nearFarDepth: number(source.nearFarDepth, 0.72),
    precipitationOpacity: number(source.precipitationOpacity, 0.64, 0, 1.2),
    windDirection: number(source.windDirection, 268, 0, 359),
    windSpeed: number(source.windSpeed, 1, 0, 4),
    gustStrength: number(source.gustStrength, 0.18, 0, 2),
    gustFrequency: number(source.gustFrequency, 0.25, 0, 2),
    cloudCoverage: number(source.cloudCoverage, 0.18),
    cloudSpeed: number(source.cloudSpeed, 1, 0, 4),
    visibility: number(source.visibility, 1),
    fogDensity: number(source.fogDensity, 0),
    atmosphericMoisture: number(source.atmosphericMoisture, 0.18),
    horizonHaze: number(source.horizonHaze, 0.08),
    cloudLightReduction: number(source.cloudLightReduction, 0.12),
    ambientBrightness: number(source.ambientBrightness, 1, 0.2, 1.4),
    surfaceWetness: number(source.surfaceWetness, 0),
    snowAccumulation: number(source.snowAccumulation, 0),
    accumulationRate: number(source.accumulationRate, 0.2),
    meltRate: number(source.meltRate, 0.1),
    lightningEnabled: source.lightningEnabled === true,
    lightningFrequency: number(source.lightningFrequency, 0.08, 0, 1),
    stormIntensity: number(source.stormIntensity, 0),
    transitionDuration: number(source.transitionDuration, 8, 0, 120),
    instantTransition: source.instantTransition === true,
  };
}

function createBase(source) {
  return { ...source };
}

export function applyMetaverseWeatherPreset(config, mode) {
  const preset = PRESETS[mode];
  if (!preset) return normalizeMetaverseEnvironmentConfig({ ...config, weatherMode: "CUSTOM" });
  return normalizeMetaverseEnvironmentConfig({ ...config, ...preset, weatherMode: mode, precipitationEnabled: preset.precipitationType !== "NONE" });
}

export function getWeatherModesForCapabilities(capabilities = {}) {
  const allowed = capabilities.weather?.precipitation || [];
  return METAVERSE_WEATHER_MODES.filter((mode) => {
    if (mode.includes("RAIN") || mode === "THUNDERSTORM") return allowed.includes("rain");
    if (mode.includes("SNOW")) return allowed.includes("snow");
    return true;
  });
}
