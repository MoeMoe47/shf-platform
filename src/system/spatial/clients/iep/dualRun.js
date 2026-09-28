import { createIepCountyClientAdapter } from "./IepCountyClientAdapter.js";

function freeze(value) {
  return Object.freeze(value);
}

function legacyFips(feature) {
  const geoId = feature?.properties?.GEO_ID;
  if (typeof geoId === "string" && /^0500000US39\d{3}$/.test(geoId)) return geoId.slice(-5);
  return typeof feature?.id === "string" && /^39\d{3}$/.test(feature.id) ? feature.id : null;
}

function legacyLabel(feature) {
  return feature?.properties?.NAME || feature?.properties?.name || feature?.properties?.COUNTY || null;
}

export function isIepSpatialDualRunEnabled({ search = "", isDevelopment = Boolean(import.meta.env?.DEV) } = {}) {
  return isDevelopment === true && new URLSearchParams(search).get("iepSpatialDualRun") === "1";
}

export function compareIepCountySources({ legacyFeatures = [], spatialCountyViewModels = [] } = {}) {
  const legacyByFips = new Map(legacyFeatures.map((feature) => [legacyFips(feature), feature]).filter(([fips]) => fips));
  const spatialByFips = new Map(spatialCountyViewModels.map((county) => [county.countyFips, county]));
  const missingFips = [...legacyByFips.keys()].filter((fips) => !spatialByFips.has(fips)).sort();
  const extraFips = [...spatialByFips.keys()].filter((fips) => !legacyByFips.has(fips)).sort();
  const labelMismatches = [];
  const geometryMismatches = [];
  for (const [fips, legacy] of legacyByFips) {
    const spatial = spatialByFips.get(fips);
    if (!spatial) continue;
    if (legacyLabel(legacy) !== spatial.label) labelMismatches.push(fips);
    if (JSON.stringify(legacy.geometry) !== JSON.stringify(spatial.geometry)) geometryMismatches.push(fips);
  }
  return freeze({
    legacyCount: legacyByFips.size,
    spatialCount: spatialByFips.size,
    missingFips: freeze(missingFips),
    extraFips: freeze(extraFips),
    labelMismatches: freeze(labelMismatches.sort()),
    geometryMismatches: freeze(geometryMismatches.sort()),
    fipsParity: missingFips.length === 0 && extraFips.length === 0,
    labelParity: labelMismatches.length === 0,
    geometryParity: geometryMismatches.length === 0,
  });
}

export function runIepSpatialDualRun({ search = "", isDevelopment, legacyFeatures, clientProjectionResults } = {}) {
  if (!isIepSpatialDualRunEnabled({ search, isDevelopment })) return freeze({ enabled: false, comparison: null, countyViewModels: freeze([]) });
  const countyViewModels = createIepCountyClientAdapter().toCountyViewModels(clientProjectionResults);
  return freeze({
    enabled: true,
    countyViewModels,
    comparison: compareIepCountySources({ legacyFeatures, spatialCountyViewModels: countyViewModels }),
  });
}
