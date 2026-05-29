import {
  makeTraceId,
  nowIso,
  normalizeContradictionStatus,
  normalizeReadinessStatus,
  normalizeVerificationStatus,
  normalizeTruthStatus,
  getConfidenceBand,
  PUBLICATION_MODES,
} from "./truthSpineTypes.js";

export function buildTrustEnvelope(record = {}, overrides = {}) {
  const oracle = record?.oracle || {};
  const traceId =
    overrides.traceId ||
    record?.trustEnvelope?.traceId ||
    oracle?.traceId ||
    makeTraceId();

  const truthStatus = normalizeTruthStatus(
    overrides.truthStatus || oracle?.truthStatus || record?.truthStatus
  );

  const verificationStatus = normalizeVerificationStatus(
    overrides.verificationStatus ||
      oracle?.verificationStatus ||
      record?.verification?.verificationStatus
  );

  const contradictionStatus = normalizeContradictionStatus(
    overrides.contradictionStatus ||
      oracle?.contradictionStatus ||
      record?.reconciliation?.contradictionStatus
  );

  const readinessStatus = normalizeReadinessStatus(
    overrides.readinessStatus || oracle?.readinessStatus || record?.readinessStatus
  );

  const confidenceScore = Number(
    overrides.confidenceScore ?? oracle?.confidenceScore ?? record?.confidenceScore ?? 0
  );

  return {
    traceId,
    oracleVersion: overrides.oracleVersion || "frontend-0.1.0",
    lastUpdatedAt: nowIso(),

    entityId: record?.entityId || overrides.entityId || "unknown_entity",
    entityType: record?.entityType || overrides.entityType || "unknown",

    sourceSystem: record?.sourceSystem || overrides.sourceSystem || "manual",
    sourceSurface: record?.sourceSurface || overrides.sourceSurface || "unknown_surface",

    truthStatus,
    confidenceScore,
    confidenceBand: overrides.confidenceBand || getConfidenceBand(confidenceScore),

    verificationStatus,
    contradictionStatus,
    readinessStatus,

    publicationMode:
      overrides.publicationMode ||
      record?.trustEnvelope?.publicationMode ||
      PUBLICATION_MODES.INTERNAL,

    unresolvedItemsCount: Number(
      overrides.unresolvedItemsCount ??
        oracle?.unresolvedItems?.length ??
        record?.reconciliation?.unresolvedItems?.length ??
        0
    ),

    warnings: overrides.warnings || oracle?.warnings || [],
    reportingReady: Boolean(overrides.reportingReady ?? record?.trustEnvelope?.reportingReady),
    auditReady: Boolean(overrides.auditReady ?? record?.trustEnvelope?.auditReady),
    sourceCoverage: overrides.sourceCoverage || record?.trustEnvelope?.sourceCoverage || "partial",
    generatedAt: nowIso(),
  };
}
