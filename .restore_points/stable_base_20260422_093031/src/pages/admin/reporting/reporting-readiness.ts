export type ReportingExportKind =
  | "briefing_export"
  | "action_log_export"
  | "analyst_memo_export"
  | "audit_pack_export";

export interface ReportingReadinessInput {
  exportKind: ReportingExportKind;
  bridgeReadiness?: {
    aggregationReady?: boolean;
    verificationReady?: boolean;
    reportingReady?: boolean;
    missingFields?: string[];
  };
  verificationState?: "verified" | "pending" | "blocked" | "rejected" | "ready";
  missingFields?: string[];
  sourceToReportTraceCoverage?: boolean;
  publicationMode?: string;
  trustEnvelopePresent?: boolean;
}

export interface ReportingReadinessResult {
  exportKind: ReportingExportKind;
  ready: boolean;
  status: "ready" | "pending";
  reasons: string[];
  missingFields: string[];
  allowedActions: {
    preview: boolean;
    generate: boolean;
  };
}

function normalizeMissingFields(input: ReportingReadinessInput): string[] {
  const bridgeMissing = input.bridgeReadiness?.missingFields || [];
  const localMissing = input.missingFields || [];
  return Array.from(new Set([...bridgeMissing, ...localMissing]));
}

function hasValidPublicationMode(mode?: string): boolean {
  return Boolean(
    mode &&
      [
        "admin_internal",
        "operator",
        "leadership",
        "partner_scoped",
        "public_safe",
      ].includes(String(mode))
  );
}

function computeBaseReasons(input: ReportingReadinessInput): {
  reasons: string[];
  missingFields: string[];
} {
  const reasons: string[] = [];
  const missingFields = normalizeMissingFields(input);

  if (!input.trustEnvelopePresent) {
    reasons.push("trust_envelope_missing");
  }

  if (!hasValidPublicationMode(input.publicationMode)) {
    reasons.push("publication_mode_invalid");
  }

  if (!input.sourceToReportTraceCoverage) {
    reasons.push("source_to_report_trace_incomplete");
  }

  if (missingFields.length > 0) {
    reasons.push("required_fields_missing");
  }

  return { reasons, missingFields };
}

export function evaluateBriefingExportReadiness(
  input: ReportingReadinessInput
): ReportingReadinessResult {
  const { reasons, missingFields } = computeBaseReasons(input);

  if (!input.bridgeReadiness?.aggregationReady) {
    reasons.push("aggregation_not_ready");
  }

  const ready = reasons.length === 0;

  return {
    exportKind: "briefing_export",
    ready,
    status: ready ? "ready" : "pending",
    reasons,
    missingFields,
    allowedActions: {
      preview: true,
      generate: ready,
    },
  };
}

export function evaluateActionLogExportReadiness(
  input: ReportingReadinessInput
): ReportingReadinessResult {
  const { reasons, missingFields } = computeBaseReasons(input);

  if (!input.bridgeReadiness?.aggregationReady) {
    reasons.push("aggregation_not_ready");
  }

  const ready = reasons.length === 0;

  return {
    exportKind: "action_log_export",
    ready,
    status: ready ? "ready" : "pending",
    reasons,
    missingFields,
    allowedActions: {
      preview: true,
      generate: ready,
    },
  };
}

export function evaluateAnalystMemoExportReadiness(
  input: ReportingReadinessInput
): ReportingReadinessResult {
  const { reasons, missingFields } = computeBaseReasons(input);

  if (!input.bridgeReadiness?.aggregationReady) {
    reasons.push("aggregation_not_ready");
  }

  if (!input.bridgeReadiness?.verificationReady) {
    reasons.push("verification_not_ready");
  }

  const ready = reasons.length === 0;

  return {
    exportKind: "analyst_memo_export",
    ready,
    status: ready ? "ready" : "pending",
    reasons,
    missingFields,
    allowedActions: {
      preview: true,
      generate: ready,
    },
  };
}

export function evaluateAuditPackExportReadiness(
  input: ReportingReadinessInput
): ReportingReadinessResult {
  const { reasons, missingFields } = computeBaseReasons(input);

  if (!input.bridgeReadiness?.aggregationReady) {
    reasons.push("aggregation_not_ready");
  }

  if (!input.bridgeReadiness?.verificationReady) {
    reasons.push("verification_not_ready");
  }

  if (!input.bridgeReadiness?.reportingReady) {
    reasons.push("reporting_not_ready");
  }

  if (input.verificationState !== "verified" && input.verificationState !== "ready") {
    reasons.push("verification_state_not_cleared");
  }

  const ready = reasons.length === 0;

  return {
    exportKind: "audit_pack_export",
    ready,
    status: ready ? "ready" : "pending",
    reasons,
    missingFields,
    allowedActions: {
      preview: true,
      generate: ready,
    },
  };
}

export function evaluateReportingExportReadiness(
  input: ReportingReadinessInput
): ReportingReadinessResult {
  switch (input.exportKind) {
    case "briefing_export":
      return evaluateBriefingExportReadiness(input);
    case "action_log_export":
      return evaluateActionLogExportReadiness(input);
    case "analyst_memo_export":
      return evaluateAnalystMemoExportReadiness(input);
    case "audit_pack_export":
      return evaluateAuditPackExportReadiness(input);
    default:
      return {
        exportKind: input.exportKind,
        ready: false,
        status: "pending",
        reasons: ["unknown_export_kind"],
        missingFields: normalizeMissingFields(input),
        allowedActions: {
          preview: false,
          generate: false,
        },
      };
  }
}
