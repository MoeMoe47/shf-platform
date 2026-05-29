function normalize(value, fallback = "unknown") {
  return String(value || fallback).toLowerCase().trim();
}

function titleize(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function unique(values = []) {
  return Array.from(new Set(values.filter(Boolean)));
}

export const REPORTING_COMMAND_EXPORT_ORDER = Object.freeze([
  "briefing_export",
  "action_log_export",
  "analyst_memo_export",
  "audit_pack_export",
]);

export const REPORTING_COMMAND_EXPORT_LABELS = Object.freeze({
  briefing_export: "Briefing Export",
  action_log_export: "Action Log Export",
  analyst_memo_export: "Analyst Memo Export",
  audit_pack_export: "Audit Pack",
});

export function buildReportingCommandModel({
  cards = [],
  bridgeState = {},
  bridgeReadiness = {},
  oracleTruth = null,
  oracleGate = null,
  canExportReports = false,
  recentExports = [],
} = {}) {
  const exportRows = cards.map((card) => {
    const readiness = card.readiness || {};
    const reasons = readiness.reasons || [];
    const missingFields = readiness.missingFields || [];
    const allowedActions = readiness.allowedActions || {};

    const ready = Boolean(readiness.ready);
    const blockedByPermission = !canExportReports;
    const blockedByOracle = oracleGate ? !oracleGate.allowExport : false;
    const blockedByReadiness = !ready;

    let status = "ready";
    let operatorMeaning = "This export is ready for authorized generation.";
    let nextAction = "Generate the export or preview the report package.";

    if (blockedByPermission) {
      status = "blocked";
      operatorMeaning = "The current user does not have report export permission.";
      nextAction = "Grant reports.export permission or have an authorized operator generate this export.";
    } else if (blockedByOracle) {
      status = "blocked";
      operatorMeaning = "Oracle is blocking this export from downstream use.";
      nextAction = "Resolve Oracle truth, contradiction, readiness, or trust-envelope blockers first.";
    } else if (blockedByReadiness) {
      status = "review";
      operatorMeaning = "This export still has readiness blockers.";
      nextAction = "Clear bridge readiness, verification, trace, publication, or trust-envelope blockers.";
    }

    return {
      exportKind: card.exportKind,
      title: card.title || REPORTING_COMMAND_EXPORT_LABELS[card.exportKind] || titleize(card.exportKind),
      format: card.format || "Unknown",
      audience: card.audience || "Unknown",
      artifactId: card.artifactId || "unknown_artifact",
      ready,
      status,
      reasons,
      missingFields,
      allowedActions,
      blockedByPermission,
      blockedByOracle,
      blockedByReadiness,
      operatorMeaning,
      nextAction,
    };
  });

  const readyExports = exportRows.filter((row) => row.status === "ready");
  const reviewExports = exportRows.filter((row) => row.status === "review");
  const blockedExports = exportRows.filter((row) => row.status === "blocked");

  const oracleTruthStatus = normalize(oracleTruth?.truthStatus, "not_loaded");
  const oracleReadinessStatus = normalize(oracleTruth?.readinessStatus, "not_ready");
  const oracleConfidenceScore = Number(oracleTruth?.confidenceScore || 0);
  const oracleConfidenceBand = oracleTruth?.confidenceBand || "unknown";
  const contradictionStatus = normalize(oracleTruth?.contradictionStatus, "unknown");
  const trustEnvelopePresent = Boolean(oracleTruth?.trustEnvelope);
  const traceCoverageComplete = Boolean(bridgeState?.sourceToReportTraceCoverage);

  const allReasons = unique(
    exportRows.flatMap((row) => [
      ...row.reasons,
      ...row.missingFields.map((field) => `missing_${field}`),
      row.blockedByPermission ? "permission_reports_export_missing" : "",
      row.blockedByOracle ? "oracle_gate_blocked" : "",
    ])
  );

  const readinessPercent =
    exportRows.length > 0
      ? Math.round((readyExports.length / exportRows.length) * 100)
      : 0;

  let commandStatus = "ready";
  let commandLabel = "Reporting Ready";
  let commandMeaning = "All export surfaces are ready for authorized generation.";
  let recommendedNextAction = "Generate the needed export package and preserve the audit trail.";

  if (blockedExports.length > 0) {
    commandStatus = "blocked";
    commandLabel = "Reporting Blocked";
    commandMeaning = "One or more export surfaces are blocked by permission, Oracle, or readiness conditions.";
    recommendedNextAction = "Resolve blocked exports before external or funder-facing publication.";
  } else if (reviewExports.length > 0) {
    commandStatus = "review";
    commandLabel = "Reporting Review Needed";
    commandMeaning = "One or more export surfaces need review before full V1 reporting use.";
    recommendedNextAction = "Clear readiness blockers, verify trace coverage, then refresh the reporting surface.";
  } else if (!exportRows.length) {
    commandStatus = "not_started";
    commandLabel = "Reporting Not Loaded";
    commandMeaning = "No export cards are loaded into the command model.";
    recommendedNextAction = "Refresh the reporting command surface.";
  }

  return {
    commandStatus,
    commandLabel,
    commandMeaning,
    recommendedNextAction,
    readinessPercent,
    exportRows,
    readyCount: readyExports.length,
    reviewCount: reviewExports.length,
    blockedCount: blockedExports.length,
    totalCount: exportRows.length,
    allReasons,
    oracle: {
      loaded: Boolean(oracleTruth),
      truthStatus: oracleTruthStatus,
      readinessStatus: oracleReadinessStatus,
      confidenceScore: oracleConfidenceScore,
      confidenceBand: oracleConfidenceBand,
      contradictionStatus,
      trustEnvelopePresent,
      gateAllowed: oracleGate ? Boolean(oracleGate.allowExport) : false,
      gateReasons: oracleGate?.reasons || [],
      gateLabel: oracleGate?.label || "unknown",
    },
    bridge: {
      aggregationReady: Boolean(bridgeReadiness?.aggregationReady),
      verificationReady: Boolean(bridgeReadiness?.verificationReady),
      reportingReady: Boolean(bridgeReadiness?.reportingReady),
      missingFields: bridgeReadiness?.missingFields || [],
      verificationState: bridgeState?.verificationState || "unknown",
      publicationMode: bridgeState?.publicationMode || "admin_internal",
      traceCoverageComplete,
    },
    security: {
      canExportReports,
    },
    recentExportCount: recentExports.length,
  };
}

export function reportingCommandStatusClass(status) {
  const normalized = normalize(status);
  if (normalized === "ready") return "reporting-command-model--ready";
  if (normalized === "review") return "reporting-command-model--review";
  if (normalized === "blocked") return "reporting-command-model--blocked";
  return "reporting-command-model--pending";
}
