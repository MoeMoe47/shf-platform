const ID_SEGMENT_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;

export function normalizeSpatialIdSegment(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized && ID_SEGMENT_PATTERN.test(normalized) ? normalized : null;
}

export function createSpatialFeatureId({ domain, featureType, sourceAuthority, sourceRecordId }) {
  const normalized = {
    domain: normalizeSpatialIdSegment(domain),
    featureType: normalizeSpatialIdSegment(featureType),
    sourceAuthority: normalizeSpatialIdSegment(sourceAuthority),
    sourceRecordId: normalizeSpatialIdSegment(sourceRecordId),
  };

  const missing = Object.entries(normalized)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Cannot create spatial feature id; missing or invalid: ${missing.join(", ")}`);
  }

  return `spatial:${normalized.domain}:${normalized.featureType}:${normalized.sourceAuthority}:${normalized.sourceRecordId}`;
}

export function isSpatialFeatureId(value) {
  return typeof value === "string" && /^spatial:[a-z0-9._-]+:[a-z0-9._-]+:[a-z0-9._-]+:[a-z0-9._-]+$/.test(value);
}
