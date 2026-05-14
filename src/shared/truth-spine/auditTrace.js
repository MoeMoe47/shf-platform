import { makeTraceId, nowIso } from "./truthSpineTypes.js";

export function buildTrustEnvelope(record, overrides = {}) {
  const traceId = overrides.traceId || record?.trustEnvelope?.traceId || makeTraceId();

  return {
    traceId,
    entityId: record?.entityId || overrides.entityId || "unknown_entity",
    entityType: record?.entityType || overrides.entityType || "unknown",
    sourceSystem: record?.sourceSystem || overrides.sourceSystem || "manual",
    sourceSurface: record?.sourceSurface || overrides.sourceSurface || "unknown_surface",
    verificationStatus: record?.verification?.verificationStatus || "pending",
    contradictionStatus: record?.reconciliation?.contradictionStatus || "none",
    confidenceScore: Number(record?.oracle?.confidenceScore || 0),
    reportingReady: Boolean(overrides.reportingReady ?? record?.trustEnvelope?.reportingReady),
    auditReady: Boolean(overrides.auditReady ?? record?.trustEnvelope?.auditReady),
    sourceCoverage: overrides.sourceCoverage || record?.trustEnvelope?.sourceCoverage || "partial",
    publicationMode: overrides.publicationMode || record?.trustEnvelope?.publicationMode || "internal",
    generatedAt: nowIso(),
  };
}
