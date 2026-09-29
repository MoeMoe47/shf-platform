const EVIDENCE_REFERENCE_FIELDS = Object.freeze([
  "sourceAuthority",
  "sourceRecordId",
  "projectionAdapter",
  "projectionVersion",
  "geometryProvenanceRef",
  "sourceObservedAt",
  "sourceRetrievedAt",
  "sourceEffectiveFrom",
  "sourceEffectiveTo",
  "sourceApprovalState",
  "sourcePublicationState",
  "evidenceHash",
  "evidenceVersion",
  "truthReference",
  "metricRegistryReference",
]);

export const FRESHNESS_STATES = Object.freeze({
  CURRENT: "CURRENT",
  STALE: "STALE",
  EXPIRED: "EXPIRED",
  HISTORICAL: "HISTORICAL",
  UNKNOWN: "UNKNOWN",
});

const TEMPORAL_FIELDS = Object.freeze([
  "observedAt",
  "effectiveFrom",
  "effectiveTo",
  "retrievedAt",
  "supersededAt",
]);

const SOURCE_TEMPORAL_AUTHORITIES = Object.freeze({
  observedAtAuthority: "SOURCE",
  effectiveFromAuthority: "SOURCE",
  effectiveToAuthority: "SOURCE",
  retrievedAtAuthority: "EVIDENCE",
  supersededAtAuthority: "SOURCE_OR_EVIDENCE",
});

function nullable(value) {
  return value === undefined ? null : value;
}

function copyGeometryProvenance(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) return null;
  return Object.freeze({
    geometryHash: nullable(value.geometryHash),
    coordinateSpace: nullable(value.coordinateSpace),
  });
}

export function createEvidenceReference(input = {}) {
  const evidence = {};
  for (const field of EVIDENCE_REFERENCE_FIELDS) {
    if (field === "geometryProvenanceRef") {
      evidence[field] = copyGeometryProvenance(input[field]);
    } else if (Object.prototype.hasOwnProperty.call(input, field)) {
      evidence[field] = nullable(input[field]);
    } else {
      evidence[field] = null;
    }
  }
  return Object.freeze(evidence);
}

export function sanitizeEvidenceForClient(input = {}) {
  if (input.visibility === "RESTRICTED" || input.visibility === "HIDDEN" || input.sourcePublicationState === "NOT_PUBLISHED") {
    return Object.freeze({ restricted: true });
  }

  const geometryHash = input.geometryHash ?? input.geometryProvenanceRef?.geometryHash ?? null;
  return Object.freeze({
    sourceAuthority: nullable(input.sourceAuthority),
    sourceRecordId: nullable(input.sourceRecordId),
    projectionVersion: nullable(input.projectionVersion),
    geometryHash,
  });
}

export function createIntelligenceEvidenceReferences(references = []) {
  return Object.freeze(references.map((reference) => reference));
}

function parseTimestamp(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) return undefined;
  return value;
}

export function createTemporalContext(input = {}) {
  const temporal = {};
  for (const field of TEMPORAL_FIELDS) temporal[field] = nullable(input[field]);
  temporal.projectedAt = nullable(input.projectedAt);
  return Object.freeze({
    ...temporal,
    ...SOURCE_TEMPORAL_AUTHORITIES,
    projectedAtAuthority: "SPATIAL",
  });
}

export function validateTemporalContext(input = {}) {
  const parsed = {};
  for (const field of [...TEMPORAL_FIELDS, "projectedAt"]) {
    parsed[field] = parseTimestamp(input[field]);
    if (parsed[field] === undefined) {
      return { ok: false, error: `invalid timestamp: ${field}` };
    }
  }

  if (parsed.effectiveFrom && parsed.effectiveTo && Date.parse(parsed.effectiveFrom) > Date.parse(parsed.effectiveTo)) {
    return { ok: false, error: "effectiveFrom must not be after effectiveTo" };
  }
  return { ok: true };
}

export function resolveTemporalContext(input = {}, projectedAt) {
  const temporal = createTemporalContext({ ...input, projectedAt: projectedAt ?? input.projectedAt });
  const validation = validateTemporalContext(temporal);
  if (!validation.ok) return { ...temporal, ok: false, error: validation.error };
  return { ...temporal, ok: true };
}

function validTimestamp(value) {
  return parseTimestamp(value) !== undefined;
}

export function resolveFreshness(input = {}, options = {}) {
  const now = options.now ?? null;
  const timestampFields = ["observedAt", "retrievedAt", "effectiveFrom", "effectiveTo"];
  if (timestampFields.some((field) => !validTimestamp(input[field]))) {
    return { state: FRESHNESS_STATES.UNKNOWN, reason: "invalid timestamp" };
  }
  if (now !== null && !validTimestamp(now)) {
    return { state: FRESHNESS_STATES.UNKNOWN, reason: "invalid clock timestamp" };
  }

  const result = {};
  if (Object.prototype.hasOwnProperty.call(input, "geometryValid")) result.geometryValid = input.geometryValid;
  if (input.historical === true) return { ...result, state: FRESHNESS_STATES.HISTORICAL };

  if (input.effectiveTo && now && Date.parse(input.effectiveTo) <= Date.parse(now)) {
    return { ...result, state: FRESHNESS_STATES.EXPIRED };
  }
  if (input.supersededAt && now && Date.parse(input.supersededAt) <= Date.parse(now)) {
    return { ...result, state: FRESHNESS_STATES.EXPIRED };
  }
  if (input.freshness === FRESHNESS_STATES.STALE || input.freshness === "stale") {
    return { ...result, state: FRESHNESS_STATES.STALE };
  }
  if (input.freshness === FRESHNESS_STATES.CURRENT || input.freshness === "current") {
    return { ...result, state: FRESHNESS_STATES.CURRENT };
  }

  const threshold = options.maxSourceAgeMs ?? options.freshnessPolicy?.maxSourceAgeMs;
  const sourceTimestamp = input.retrievedAt ?? input.observedAt;
  if (sourceTimestamp && now && Number.isFinite(threshold) && threshold >= 0) {
    const age = Date.parse(now) - Date.parse(sourceTimestamp);
    return {
      ...result,
      state: age > threshold ? FRESHNESS_STATES.STALE : FRESHNESS_STATES.CURRENT,
    };
  }

  return { ...result, state: FRESHNESS_STATES.UNKNOWN, reason: "explicit freshness threshold or source state is required" };
}
