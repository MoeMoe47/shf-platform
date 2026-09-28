import { isQualifiedOhioCountyFips } from "../../../../shared/spatial/countyIdentity.js";

export const IEP_COUNTY_DOMAIN = "census-geography";
export const IEP_COUNTY_FEATURE_TYPE = "county";
export const IEP_COUNTY_COORDINATE_FAMILY = "REAL_WORLD";
export const IEP_COUNTY_COORDINATE_SPACE = "real-world.county-geojson";

const VISIBLE_STATUSES = new Set(["PROJECTED", "STALE", "UNAVAILABLE"]);
const SAFE_PRESENTATION_FIELDS = [
  "resolvedVisualState",
  "selectionState",
  "availabilityState",
  "availabilityReason",
  "freshnessState",
  "modifiers",
];
const SAFE_ACCESSIBILITY_FIELDS = [
  "label",
  "stateText",
  "selected",
  "highlighted",
  "freshnessText",
  "unavailableText",
];

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function finitePosition(position) {
  return Array.isArray(position)
    && position.length >= 2
    && Number.isFinite(position[0])
    && Number.isFinite(position[1])
    && position[0] >= -180
    && position[0] <= 180
    && position[1] >= -90
    && position[1] <= 90;
}

function validRing(ring) {
  return Array.isArray(ring) && ring.length >= 4 && ring.every(finitePosition);
}

function validGeometry(geometry) {
  if (!isRecord(geometry)) return false;
  if (geometry.type === "Polygon") {
    return Array.isArray(geometry.coordinates)
      && geometry.coordinates.length > 0
      && geometry.coordinates.every(validRing);
  }
  if (geometry.type === "MultiPolygon") {
    return Array.isArray(geometry.coordinates)
      && geometry.coordinates.length > 0
      && geometry.coordinates.every((polygon) => Array.isArray(polygon) && polygon.length > 0 && polygon.every(validRing));
  }
  return false;
}

function pick(source, fields) {
  const output = {};
  for (const field of fields) {
    if (source?.[field] !== undefined) output[field] = source[field];
  }
  return output;
}

function reject(message) {
  throw new TypeError(message);
}

function countyViewModelFromResult(result) {
  if (!isRecord(result) || result.kind !== "CLIENT") reject("IEP county client accepts sanitized ClientProjectionResult values only");
  if (!VISIBLE_STATUSES.has(result.status)) return null;

  const feature = result.feature;
  if (!isRecord(feature)) reject("IEP county results require a sanitized feature");
  if (feature.domain !== IEP_COUNTY_DOMAIN || feature.featureType !== IEP_COUNTY_FEATURE_TYPE) {
    reject("IEP county client accepts census-geography county results only");
  }
  if (feature.coordinateFamily !== IEP_COUNTY_COORDINATE_FAMILY || feature.coordinateSpaceId !== IEP_COUNTY_COORDINATE_SPACE) {
    reject("IEP county client accepts real-world.county-geojson results only");
  }
  if (typeof feature.featureId !== "string" || feature.featureId.length === 0) reject("IEP county results require a feature ID");
  if (!isQualifiedOhioCountyFips(feature.sourceRecordId)) reject("IEP county results require a qualified Ohio FIPS");
  if (typeof feature.label !== "string" || feature.label.trim().length === 0) reject("IEP county results require a safe label");
  if (!validGeometry(feature.geometry)) reject("IEP county results require Polygon or MultiPolygon geometry");

  const presentation = pick(result.presentation, SAFE_PRESENTATION_FIELDS);
  if (Array.isArray(presentation.modifiers)) presentation.modifiers = Object.freeze([...presentation.modifiers]);
  const accessibility = pick(result.accessibility, SAFE_ACCESSIBILITY_FIELDS);
  accessibility.label ??= `${feature.label} County`;
  accessibility.stateText ??= result.status === "STALE" ? "Stale" : result.status === "UNAVAILABLE" ? "Unavailable" : "Available";

  return Object.freeze({
    id: feature.featureId,
    countyFips: feature.sourceRecordId,
    label: feature.label,
    geometry: structuredClone(feature.geometry),
    presentation: Object.freeze(presentation),
    accessibility: Object.freeze(accessibility),
    interaction: Object.freeze({
      selectable: feature.allowedInteractions?.includes("SELECT") === true && result.status !== "UNAVAILABLE",
      focusable: true,
      interactionType: feature.allowedInteractions?.includes("SELECT") && result.status !== "UNAVAILABLE" ? "SELECT" : "FOCUS",
    }),
  });
}

export function toIepCountyViewModels(results) {
  if (!Array.isArray(results)) reject("IEP county client input must be an array");
  return Object.freeze(results.map(countyViewModelFromResult).filter(Boolean));
}

export function joinIepCountyViewModel(record, countyViewModel) {
  if (!isRecord(record) || !isRecord(countyViewModel) || !isQualifiedOhioCountyFips(record.countyFips)) return null;
  return record.countyFips === countyViewModel.countyFips ? countyViewModel : null;
}
