const EXPORT_AUDIT_STORAGE_KEY = "shs_reporting_export_audit_trail_v1";

function nowIso() {
  return new Date().toISOString();
}

function normalize(value, fallback = "unknown") {
  return String(value || fallback).toLowerCase().trim();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function buildExportAuditTrailRecord({
  exportKind = "unknown_export",
  artifactId = "unknown_artifact",
  publicationMode = "admin_internal",
  requestedBy = "user_admin_001",
  readiness = null,
  traceRecord = null,
  oracleTruth = null,
  oracleGate = null,
  canGenerateExport = false,
  result = null,
  status = "attempted",
  source = "reporting_export_panel",
} = {}) {
  const readinessReasons = safeArray(readiness?.reasons);
  const missingFields = safeArray(readiness?.missingFields);
  const traceCoverageStatus =
    traceRecord?.traceCoverageStatus ||
    (readiness?.sourceToReportTraceCoverage ? "complete" : "unknown");

  const trustEnvelopePresent = Boolean(
    oracleTruth?.trustEnvelope ||
      traceRecord?.trustEnvelopeTraceId ||
      readiness?.trustEnvelopePresent
  );

  const oracleGateAllowed =
    oracleGate?.allowExport ??
    oracleGate?.allowed ??
    (oracleTruth ? oracleTruth.truthStatus === "certified" : false);

  const allowed = Boolean(
    canGenerateExport &&
      readiness?.allowedActions?.generate !== false &&
      (oracleGate ? oracleGateAllowed : true)
  );

  return {
    id: `export_audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    source,
    exportKind,
    artifactId,
    publicationMode,
    requestedBy,
    status,
    allowed,
    blocked: !allowed,
    createdAt: nowIso(),

    result: result
      ? {
          exportId: result.exportId || result.id || null,
          reportArtifactId: result.reportArtifactId || artifactId,
          status: result.status || status,
          message: result.message || "",
          createdAt: result.createdAt || null,
        }
      : null,

    readiness: {
      ready: Boolean(readiness?.ready),
      status: readiness?.status || "unknown",
      reasons: readinessReasons,
      missingFields,
      allowedActions: readiness?.allowedActions || {},
    },

    trace: {
      traceCoverageStatus,
      sourceObjectId: traceRecord?.sourceObjectId || null,
      bridgeTraceId: traceRecord?.bridgeTraceId || null,
      verificationRecordId: traceRecord?.verificationRecordId || null,
      reportArtifactId: traceRecord?.reportArtifactId || artifactId,
      canonicalEntityId: traceRecord?.canonicalEntityId || null,
      lineageId: traceRecord?.lineageId || null,
      oracleTraceId: traceRecord?.oracleTraceId || oracleTruth?.traceId || null,
      trustEnvelopeTraceId:
        traceRecord?.trustEnvelopeTraceId ||
        oracleTruth?.trustEnvelope?.traceId ||
        oracleTruth?.traceId ||
        null,
    },

    oracle: {
      loaded: Boolean(oracleTruth),
      truthStatus: normalize(oracleTruth?.truthStatus, "not_loaded"),
      verificationStatus: normalize(oracleTruth?.verificationStatus, "unknown"),
      contradictionStatus: normalize(oracleTruth?.contradictionStatus, "unknown"),
      readinessStatus: normalize(oracleTruth?.readinessStatus, "not_ready"),
      confidenceScore: Number(oracleTruth?.confidenceScore || 0),
      confidenceBand: oracleTruth?.confidenceBand || "unknown",
      trustEnvelopePresent,
      gateAllowed: Boolean(oracleGateAllowed),
      gateReasons: safeArray(oracleGate?.reasons),
      gateLabel: oracleGate?.label || "unknown",
    },

    security: {
      canGenerateExport: Boolean(canGenerateExport),
      requiredPermission: "reports.export",
    },
  };
}

export function readExportAuditTrail() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(EXPORT_AUDIT_STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeExportAuditTrailRecord(record) {
  if (!record) return null;

  if (typeof window !== "undefined") {
    const current = readExportAuditTrail();
    const next = [record, ...current].slice(0, 50);
    window.localStorage.setItem(EXPORT_AUDIT_STORAGE_KEY, JSON.stringify(next));

    window.dispatchEvent(
      new CustomEvent("shs:reporting-export-audit-recorded", {
        detail: record,
      })
    );
  }

  return record;
}

export function recordExportAuditTrail(input = {}) {
  const record = buildExportAuditTrailRecord(input);
  return writeExportAuditTrailRecord(record);
}
