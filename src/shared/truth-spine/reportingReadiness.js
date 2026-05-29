import {
  CONFIDENCE_BANDS,
  CONTRADICTION_STATUSES,
  READINESS_STATUSES,
  TRUTH_STATUSES,
  VERIFICATION_STATUSES,
  getConfidenceBand,
  normalizeContradictionStatus,
  normalizeReadinessStatus,
  normalizeTruthStatus,
  normalizeVerificationStatus,
} from "./truthSpineTypes.js";

export { getConfidenceBand };

export function calculateOracleTruth(record = {}) {
  const evidenceCount = Number(record?.verification?.evidenceCount || 0);
  const verificationStatus = normalizeVerificationStatus(
    record?.verification?.verificationStatus
  );
  const contradictionStatus = normalizeContradictionStatus(
    record?.reconciliation?.contradictionStatus
  );
  const currentStatus = String(record?.currentStatus || "").toLowerCase();

  if (
    contradictionStatus === CONTRADICTION_STATUSES.UNRESOLVED_CONFLICT ||
    contradictionStatus === CONTRADICTION_STATUSES.ESCALATED
  ) {
    return {
      truthStatus: TRUTH_STATUSES.DISPUTED,
      confidenceScore: 25,
      confidenceBand: CONFIDENCE_BANDS.LOW,
      verificationStatus,
      contradictionStatus,
      readinessStatus: READINESS_STATUSES.BLOCKED,
      sourceSummary: record?.sourceSummary || ["frontend_truth_spine"],
      unresolvedItems: record?.reconciliation?.unresolvedItems || ["contradiction_unresolved"],
      recommendedNextAction: "Resolve contradiction before reporting or export.",
    };
  }

  if (verificationStatus === VERIFICATION_STATUSES.VERIFIED) {
    const confidenceScore = Number(record?.oracle?.confidenceScore || 88);
    return {
      truthStatus: TRUTH_STATUSES.CERTIFIED,
      confidenceScore,
      confidenceBand: getConfidenceBand(confidenceScore),
      verificationStatus,
      contradictionStatus,
      readinessStatus:
        confidenceScore >= 90
          ? READINESS_STATUSES.FUNDER_READY
          : READINESS_STATUSES.LEADERSHIP_READY,
      sourceSummary: record?.sourceSummary || ["frontend_truth_spine"],
      unresolvedItems: [],
      recommendedNextAction: "Generate report, audit packet, or leadership review.",
    };
  }

  if (evidenceCount > 0) {
    const confidenceScore = 68;
    return {
      truthStatus: TRUTH_STATUSES.CANDIDATE,
      confidenceScore,
      confidenceBand: getConfidenceBand(confidenceScore),
      verificationStatus: VERIFICATION_STATUSES.IN_REVIEW,
      contradictionStatus,
      readinessStatus: READINESS_STATUSES.NOT_READY,
      sourceSummary: record?.sourceSummary || ["frontend_truth_spine"],
      unresolvedItems: record?.verification?.missingEvidence || ["verification_review_required"],
      recommendedNextAction: "Review attached evidence and approve verification.",
    };
  }

  if (currentStatus.includes("resolved") || currentStatus.includes("closed")) {
    const confidenceScore = 50;
    return {
      truthStatus: TRUTH_STATUSES.CANDIDATE,
      confidenceScore,
      confidenceBand: getConfidenceBand(confidenceScore),
      verificationStatus: VERIFICATION_STATUSES.IN_REVIEW,
      contradictionStatus,
      readinessStatus: READINESS_STATUSES.NOT_READY,
      sourceSummary: record?.sourceSummary || ["frontend_truth_spine"],
      unresolvedItems: ["closure_evidence_missing"],
      recommendedNextAction: "Attach closure evidence before final reporting.",
    };
  }

  const confidenceScore = 35;
  return {
    truthStatus: TRUTH_STATUSES.CANDIDATE,
    confidenceScore,
    confidenceBand: getConfidenceBand(confidenceScore),
    verificationStatus,
    contradictionStatus,
    readinessStatus: READINESS_STATUSES.NOT_READY,
    sourceSummary: record?.sourceSummary || ["frontend_truth_spine"],
    unresolvedItems: ["evidence_missing"],
    recommendedNextAction: "Attach evidence before reporting.",
  };
}

export function calculateReportingReadiness(record = {}) {
  const oracle = record?.oracle || calculateOracleTruth(record);
  const verificationStatus = normalizeVerificationStatus(
    oracle?.verificationStatus || record?.verification?.verificationStatus
  );
  const contradictionStatus = normalizeContradictionStatus(
    oracle?.contradictionStatus || record?.reconciliation?.contradictionStatus
  );
  const readinessStatus = normalizeReadinessStatus(oracle?.readinessStatus);
  const truthStatus = normalizeTruthStatus(oracle?.truthStatus);

  const reportingReady =
    truthStatus === TRUTH_STATUSES.CERTIFIED &&
    verificationStatus === VERIFICATION_STATUSES.VERIFIED &&
    contradictionStatus !== CONTRADICTION_STATUSES.UNRESOLVED_CONFLICT &&
    contradictionStatus !== CONTRADICTION_STATUSES.ESCALATED &&
    readinessStatus !== READINESS_STATUSES.BLOCKED &&
    readinessStatus !== READINESS_STATUSES.NOT_READY;

  const auditReady =
    Boolean(record?.trustEnvelope?.traceId || oracle?.traceId || oracle?.trustEnvelope?.traceId) &&
    contradictionStatus !== CONTRADICTION_STATUSES.UNRESOLVED_CONFLICT &&
    contradictionStatus !== CONTRADICTION_STATUSES.ESCALATED;

  return {
    reportingReady,
    auditReady,
    readinessStatus,
    confidenceScore: Number(oracle?.confidenceScore || 0),
    confidenceBand: getConfidenceBand(oracle?.confidenceScore || 0),
    truthStatus,
    verificationStatus,
    contradictionStatus,
  };
}
