export type ReportingExportKind =
  | "briefing_export"
  | "action_log_export"
  | "analyst_memo_export"
  | "audit_pack_export";

export type ReportingPublicationMode =
  | "internal"
  | "leadership"
  | "partner_scoped"
  | "deidentified_funder"
  | "public_safe";

export type ReportingTraceCoverageStatus =
  | "complete"
  | "partial"
  | "missing";

export type ReportingVerificationState =
  | "unreviewed"
  | "in_review"
  | "verified"
  | "insufficient_evidence"
  | "rejected"
  | "pending"
  | "blocked"
  | "ready";

export interface OracleTruthReadinessInput {
  entityId?: string;
  truthStatus?: string;
  verificationStatus?: string;
  contradictionStatus?: string;
  readinessStatus?: string;
  confidenceScore?: number;
  trustEnvelope?: any;
  traceId?: string;
}

export interface ReportingReadinessInput {
  exportKind: ReportingExportKind;
  bridgeReadiness?: {
    aggregationReady?: boolean;
    verificationReady?: boolean;
    reportingReady?: boolean;
    missingFields?: string[];
  };
  oracleTruth?: OracleTruthReadinessInput | null;
  verificationState?: ReportingVerificationState;
  missingFields?: string[];
  sourceToReportTraceCoverage?: boolean;
  traceCoverageStatus?: ReportingTraceCoverageStatus;
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

export function normalizePublicationMode(mode?: string): ReportingPublicationMode | null {
  const next = String(mode || "").toLowerCase();

  if (next === "admin_internal" || next === "operator") return "internal";

  if (
    next === "internal" ||
    next === "leadership" ||
    next === "partner_scoped" ||
    next === "deidentified_funder" ||
    next === "public_safe"
  ) {
    return next;
  }

  return null;
}

function hasTrustEnvelope(input: ReportingReadinessInput): boolean {
  return Boolean(
    input.trustEnvelopePresent ||
      input.oracleTruth?.trustEnvelope ||
      input.oracleTruth?.traceId
  );
}

function computeOracleReasons(input: ReportingReadinessInput): string[] {
  const reasons: string[] = [];
  const oracle = input.oracleTruth;

  if (!oracle) return reasons;

  const truthStatus = String(oracle.truthStatus || "unknown").toLowerCase();
  const verificationStatus = String(oracle.verificationStatus || "unknown").toLowerCase();
  const contradictionStatus = String(oracle.contradictionStatus || "none").toLowerCase();
  const readinessStatus = String(oracle.readinessStatus || "unknown").toLowerCase();
  const confidenceScore = Number(oracle.confidenceScore || 0);

  if (truthStatus !== "certified") {
    reasons.push(`oracle_truth_${truthStatus}`);
  }

  if (verificationStatus !== "verified") {
    reasons.push(`oracle_verification_${verificationStatus}`);
  }

  if (contradictionStatus !== "none" && contradictionStatus !== "resolved") {
    reasons.push(`oracle_contradiction_${contradictionStatus}`);
  }

  if (readinessStatus === "blocked" || readinessStatus === "not_ready" || readinessStatus === "unknown") {
    reasons.push(`oracle_readiness_${readinessStatus}`);
  }

  // Confidence rules should be tied to publication mode, not one universal threshold.
  const publicationMode = normalizePublicationMode(input.publicationMode);

  if (publicationMode === "public_safe" && confidenceScore < 90) {
    reasons.push(`oracle_confidence_public_${confidenceScore}`);
  }

  if (publicationMode === "deidentified_funder" && confidenceScore < 75) {
    reasons.push(`oracle_confidence_funder_${confidenceScore}`);
  }

  if (
    (publicationMode === "leadership" || publicationMode === "partner_scoped") &&
    confidenceScore < 55
  ) {
    reasons.push(`oracle_confidence_leadership_${confidenceScore}`);
  }

  return reasons;
}


function normalizeTraceCoverageStatus(input: ReportingReadinessInput): ReportingTraceCoverageStatus {
  if (input.traceCoverageStatus === "complete") return "complete";
  if (input.traceCoverageStatus === "partial") return "partial";
  if (input.traceCoverageStatus === "missing") return "missing";

  // Backward compatibility for existing panels still passing a boolean.
  if (input.sourceToReportTraceCoverage === true) return "complete";
  if (input.sourceToReportTraceCoverage === false) return "missing";

  return "missing";
}

function applyTraceCoverageReasons(
  input: ReportingReadinessInput,
  reasons: string[]
) {
  const traceCoverageStatus = normalizeTraceCoverageStatus(input);
  const publicationMode = normalizePublicationMode(input.publicationMode);

  if (traceCoverageStatus === "complete") return;

  if (traceCoverageStatus === "missing") {
    reasons.push("source_to_report_trace_missing");
    return;
  }

  if (traceCoverageStatus === "partial") {
    if (
      publicationMode === "public_safe" ||
      publicationMode === "deidentified_funder"
    ) {
      reasons.push("source_to_report_trace_partial_publication_block");
      return;
    }

    reasons.push("source_to_report_trace_partial");
  }
}

function computeBaseReasons(input: ReportingReadinessInput): {
  reasons: string[];
  missingFields: string[];
} {
  const reasons: string[] = [];
  const missingFields = normalizeMissingFields(input);
  const publicationMode = normalizePublicationMode(input.publicationMode);

  if (!hasTrustEnvelope(input)) {
    reasons.push("trust_envelope_missing");
  }

  if (!publicationMode) {
    reasons.push("publication_mode_invalid");
  }

  applyTraceCoverageReasons(input, reasons);

  if (missingFields.length > 0) {
    reasons.push("required_fields_missing");
  }

  reasons.push(...computeOracleReasons(input));

  return {
    reasons: Array.from(new Set(reasons)),
    missingFields,
  };
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
    reasons: Array.from(new Set(reasons)),
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
    reasons: Array.from(new Set(reasons)),
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
    reasons: Array.from(new Set(reasons)),
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

  const verificationState =
    input.oracleTruth?.verificationStatus ||
    input.verificationState ||
    "pending";

  if (verificationState !== "verified" && verificationState !== "ready") {
    reasons.push("verification_state_not_cleared");
  }

  const ready = reasons.length === 0;

  return {
    exportKind: "audit_pack_export",
    ready,
    status: ready ? "ready" : "pending",
    reasons: Array.from(new Set(reasons)),
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
