import {
  CONFIDENCE_BANDS,
  CONTRADICTION_STATUSES,
  READINESS_STATUSES,
  TRUTH_STATUSES,
  VERIFICATION_STATUSES,
} from "./truthSpineTypes.js";

export function getConfidenceBand(score = 0) {
  const numeric = Number(score) || 0;
  if (numeric >= 80) return CONFIDENCE_BANDS.HIGH;
  if (numeric >= 55) return CONFIDENCE_BANDS.MEDIUM;
  return CONFIDENCE_BANDS.LOW;
}

export function calculateOracleTruth(record) {
  const evidenceCount = Number(record?.verification?.evidenceCount || 0);
  const verificationStatus = record?.verification?.verificationStatus;
  const contradictionStatus = record?.reconciliation?.contradictionStatus;
  const currentStatus = String(record?.currentStatus || "").toLowerCase();

  if (contradictionStatus === CONTRADICTION_STATUSES.ACTIVE) {
    return {
      truthStatus: TRUTH_STATUSES.CONFLICTED,
      confidenceScore: 25,
      confidenceBand: CONFIDENCE_BANDS.LOW,
      readinessStatus: READINESS_STATUSES.BLOCKED,
      recommendedNextAction: "Resolve contradiction before reporting or export.",
    };
  }

  if (verificationStatus === VERIFICATION_STATUSES.VERIFIED) {
    return {
      truthStatus: TRUTH_STATUSES.VERIFIED_TRUE,
      confidenceScore: 88,
      confidenceBand: CONFIDENCE_BANDS.HIGH,
      readinessStatus: READINESS_STATUSES.REPORT_READY,
      recommendedNextAction: "Generate report or audit packet.",
    };
  }

  if (evidenceCount > 0) {
    return {
      truthStatus: TRUTH_STATUSES.LIKELY_TRUE,
      confidenceScore: 68,
      confidenceBand: CONFIDENCE_BANDS.MEDIUM,
      readinessStatus: READINESS_STATUSES.REVIEW_REQUIRED,
      recommendedNextAction: "Review attached evidence and approve verification.",
    };
  }

  if (currentStatus.includes("resolved") || currentStatus.includes("closed")) {
    return {
      truthStatus: TRUTH_STATUSES.PENDING,
      confidenceScore: 50,
      confidenceBand: CONFIDENCE_BANDS.LOW,
      readinessStatus: READINESS_STATUSES.REVIEW_REQUIRED,
      recommendedNextAction: "Attach closure evidence before final reporting.",
    };
  }

  return {
    truthStatus: TRUTH_STATUSES.PENDING,
    confidenceScore: 35,
    confidenceBand: CONFIDENCE_BANDS.LOW,
    readinessStatus: READINESS_STATUSES.NOT_READY,
    recommendedNextAction: "Attach evidence before reporting.",
  };
}

export function calculateReportingReadiness(record) {
  const oracle = record?.oracle || calculateOracleTruth(record);
  const verificationStatus = record?.verification?.verificationStatus;
  const contradictionStatus = record?.reconciliation?.contradictionStatus;

  const reportingReady =
    oracle.readinessStatus === READINESS_STATUSES.REPORT_READY &&
    verificationStatus === VERIFICATION_STATUSES.VERIFIED &&
    contradictionStatus !== CONTRADICTION_STATUSES.ACTIVE;

  const auditReady =
    Boolean(record?.trustEnvelope?.traceId) &&
    contradictionStatus !== CONTRADICTION_STATUSES.ACTIVE;

  return {
    reportingReady,
    auditReady,
    readinessStatus: oracle.readinessStatus,
    confidenceScore: oracle.confidenceScore,
    confidenceBand: getConfidenceBand(oracle.confidenceScore),
  };
}
