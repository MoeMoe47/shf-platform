export type ReportingTraceKind =
  | "briefing_export"
  | "action_log_export"
  | "analyst_memo_export"
  | "audit_pack_export";

export type ReportingTraceCoverageStatus =
  | "complete"
  | "partial"
  | "missing";

export interface ReportingTraceRecord {
  exportKind: ReportingTraceKind;

  sourceObjectId: string;
  bridgeTraceId: string;
  canonicalEntityId: string;
  verificationRecordId: string;
  reportArtifactId: string;
  lineageId: string;

  oracleTraceId: string;
  trustEnvelopeTraceId: string;
  publicationMode: string;

  traceCoverageStatus: ReportingTraceCoverageStatus;
  missingTraceFields: string[];
}

function valueOrFallback(value: unknown, fallback: string) {
  const next = String(value || "").trim();
  return next || fallback;
}

function getMissingTraceFields(trace: Partial<ReportingTraceRecord>) {
  const required: Array<keyof ReportingTraceRecord> = [
    "sourceObjectId",
    "bridgeTraceId",
    "canonicalEntityId",
    "verificationRecordId",
    "reportArtifactId",
    "lineageId",
    "oracleTraceId",
    "trustEnvelopeTraceId",
    "publicationMode",
  ];

  return required.filter((key) => !String(trace[key] || "").trim()).map(String);
}

function getCoverageStatus(missingTraceFields: string[]): ReportingTraceCoverageStatus {
  if (missingTraceFields.length === 0) return "complete";
  if (missingTraceFields.length >= 6) return "missing";
  return "partial";
}

export function buildReportingTraceRecord(
  exportKind: ReportingTraceKind,
  overrides: Partial<ReportingTraceRecord> = {}
): ReportingTraceRecord {
  const entityId =
    overrides.canonicalEntityId ||
    overrides.sourceObjectId ||
    "hub_case_demo_001";

  const oracleTraceId =
    overrides.oracleTraceId ||
    overrides.trustEnvelopeTraceId ||
    `trace_${entityId}`;

  const draft: Partial<ReportingTraceRecord> = {
    exportKind,
    sourceObjectId: valueOrFallback(overrides.sourceObjectId, entityId),
    bridgeTraceId: valueOrFallback(overrides.bridgeTraceId, `bridge_${entityId}`),
    canonicalEntityId: valueOrFallback(overrides.canonicalEntityId, entityId),
    verificationRecordId: valueOrFallback(overrides.verificationRecordId, `ver_${entityId}`),
    reportArtifactId: valueOrFallback(overrides.reportArtifactId, `rep_${entityId}`),
    lineageId: valueOrFallback(overrides.lineageId, `lineage_${entityId}_v1`),
    oracleTraceId,
    trustEnvelopeTraceId: valueOrFallback(overrides.trustEnvelopeTraceId, oracleTraceId),
    publicationMode: valueOrFallback(overrides.publicationMode, "internal"),
  };

  const missingTraceFields = getMissingTraceFields(draft);
  const traceCoverageStatus = getCoverageStatus(missingTraceFields);

  return {
    exportKind,
    sourceObjectId: draft.sourceObjectId!,
    bridgeTraceId: draft.bridgeTraceId!,
    canonicalEntityId: draft.canonicalEntityId!,
    verificationRecordId: draft.verificationRecordId!,
    reportArtifactId: draft.reportArtifactId!,
    lineageId: draft.lineageId!,
    oracleTraceId: draft.oracleTraceId!,
    trustEnvelopeTraceId: draft.trustEnvelopeTraceId!,
    publicationMode: draft.publicationMode!,
    traceCoverageStatus,
    missingTraceFields,
  };
}

export function buildReportingTraceFromOracle(
  exportKind: ReportingTraceKind,
  oracleTruth: any,
  overrides: Partial<ReportingTraceRecord> = {}
): ReportingTraceRecord {
  const entityId =
    overrides.canonicalEntityId ||
    oracleTruth?.entityId ||
    oracleTruth?.trustEnvelope?.entityId ||
    overrides.sourceObjectId ||
    "unknown_entity";

  const oracleTraceId =
    oracleTruth?.traceId ||
    oracleTruth?.trustEnvelope?.traceId ||
    overrides.oracleTraceId ||
    `trace_${entityId}`;

  return buildReportingTraceRecord(exportKind, {
    ...overrides,
    sourceObjectId: overrides.sourceObjectId || entityId,
    canonicalEntityId: entityId,
    oracleTraceId,
    trustEnvelopeTraceId:
      overrides.trustEnvelopeTraceId ||
      oracleTruth?.trustEnvelope?.traceId ||
      oracleTraceId,
    publicationMode:
      overrides.publicationMode ||
      oracleTruth?.trustEnvelope?.publicationMode ||
      oracleTruth?.publicationMode ||
      "internal",
  });
}

export function hasCompleteReportingTrace(trace: ReportingTraceRecord) {
  return trace.traceCoverageStatus === "complete";
}

export function getReportingTraceRows(
  exportKind: ReportingTraceKind,
  overrides: Partial<ReportingTraceRecord> = {}
) {
  const trace = buildReportingTraceRecord(exportKind, overrides);

  return [
    { label: "Source Object", value: trace.sourceObjectId },
    { label: "Bridge Trace", value: trace.bridgeTraceId },
    { label: "Canonical Entity", value: trace.canonicalEntityId },
    { label: "Verification Record", value: trace.verificationRecordId },
    { label: "Report Artifact", value: trace.reportArtifactId },
    { label: "Lineage ID", value: trace.lineageId },
    { label: "Oracle Trace ID", value: trace.oracleTraceId },
    { label: "Trust Envelope Trace ID", value: trace.trustEnvelopeTraceId },
    { label: "Publication Mode", value: trace.publicationMode },
    { label: "Trace Coverage", value: trace.traceCoverageStatus },
  ];
}
