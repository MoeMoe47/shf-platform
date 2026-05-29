function normalizeStatus(value, fallback = "unknown") {
  return String(value || fallback).trim() || fallback;
}

function normalizeConfidenceScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return null;
  return Math.max(0, Math.min(100, score));
}

function getTrustEnvelope(oracleTruth) {
  return oracleTruth?.trustEnvelope || oracleTruth?.trust_envelope || null;
}

function getTraceId(oracleTruth) {
  const trustEnvelope = getTrustEnvelope(oracleTruth);
  return (
    oracleTruth?.traceId ||
    oracleTruth?.trace_id ||
    trustEnvelope?.traceId ||
    trustEnvelope?.trace_id ||
    null
  );
}

function computeRiskLevel({
  truthStatus,
  verificationStatus,
  contradictionStatus,
  readinessStatus,
  confidenceScore,
  traceCoverageStatus,
  trustEnvelopePresent,
}) {
  if (!oracleTruthPresentStatus(truthStatus)) return "unknown";

  if (
    truthStatus === "blocked" ||
    truthStatus === "disputed" ||
    readinessStatus === "blocked" ||
    contradictionStatus === "escalated" ||
    contradictionStatus === "active" ||
    contradictionStatus === "unresolved_conflict"
  ) {
    return "high";
  }

  if (
    verificationStatus === "rejected" ||
    verificationStatus === "insufficient_evidence" ||
    traceCoverageStatus === "missing" ||
    !trustEnvelopePresent
  ) {
    return "high";
  }

  if (
    confidenceScore == null ||
    confidenceScore < 70 ||
    readinessStatus === "not_ready" ||
    traceCoverageStatus === "partial"
  ) {
    return "medium";
  }

  if (confidenceScore < 85 || verificationStatus === "in_review") {
    return "medium";
  }

  return "low";
}

function oracleTruthPresentStatus(truthStatus) {
  return truthStatus && truthStatus !== "unknown";
}

function computeDecisionPosture({ truthStatus, readinessStatus, riskLevel }) {
  if (!oracleTruthPresentStatus(truthStatus)) return "awaiting_truth";
  if (riskLevel === "high") return "hold_or_escalate";

  if (
    readinessStatus === "public_ready" ||
    readinessStatus === "funder_ready" ||
    readinessStatus === "leadership_ready"
  ) {
    return "ready_for_authorized_use";
  }

  if (readinessStatus === "internally_ready") {
    return "ready_for_internal_review";
  }

  return "continue_review";
}

function buildSummary({
  truthStatus,
  verificationStatus,
  contradictionStatus,
  readinessStatus,
  confidenceScore,
  confidenceBand,
  trustEnvelopePresent,
  traceCoverageStatus,
}) {
  if (!oracleTruthPresentStatus(truthStatus)) {
    return "No certified Truth Spine context is available yet.";
  }

  const confidenceText =
    confidenceScore == null
      ? "unknown confidence"
      : `${confidenceScore} (${confidenceBand}) confidence`;

  return [
    `Truth is ${truthStatus}`,
    `verification is ${verificationStatus}`,
    `readiness is ${readinessStatus}`,
    `contradiction state is ${contradictionStatus}`,
    confidenceText,
    trustEnvelopePresent ? "trust envelope present" : "trust envelope missing",
    `trace coverage is ${traceCoverageStatus}`,
  ].join(" • ");
}

function buildWhyPoints(context) {
  return [
    `Truth status: ${context.truthStatus}`,
    `Verification status: ${context.verificationStatus}`,
    `Readiness status: ${context.readinessStatus}`,
    `Contradiction status: ${context.contradictionStatus}`,
    `Confidence: ${context.confidenceScore ?? "—"} (${context.confidenceBand})`,
    `Trust envelope: ${context.trustEnvelopePresent ? "present" : "missing"}`,
    `Trace coverage: ${context.traceCoverageStatus}`,
  ];
}

function buildRecommendation({
  oracleTruth,
  readinessStatus,
  riskLevel,
  decisionPosture,
  trustEnvelopePresent,
  traceCoverageStatus,
}) {
  if (oracleTruth?.recommendedNextAction) {
    return oracleTruth.recommendedNextAction;
  }

  if (!oracleTruth) {
    return "Load Oracle truth before making a recommendation.";
  }

  if (!trustEnvelopePresent) {
    return "Do not publish or export until a trust envelope is attached.";
  }

  if (traceCoverageStatus !== "complete") {
    return "Complete source-to-report trace coverage before publication-grade use.";
  }

  if (riskLevel === "high") {
    return "Hold action and resolve blockers before downstream use.";
  }

  if (decisionPosture === "ready_for_authorized_use") {
    return "Proceed with authorized reporting or institutional review.";
  }

  if (readinessStatus === "internally_ready") {
    return "Proceed with internal review before external use.";
  }

  return "Continue verification review before advancing.";
}

export function buildAIAnalystTruthContext({
  oracleTruth = null,
  traceCoverageStatus = null,
  reportingReadiness = null,
  permissions = [],
  surface = "unknown_surface",
  selectedEntityId = null,
  selectedCounty = null,
  selectedRegion = null,
  mapContext = null,
  drawerContext = null,
} = {}) {
  const trustEnvelope = getTrustEnvelope(oracleTruth);

  const truthStatus = normalizeStatus(oracleTruth?.truthStatus);
  const verificationStatus = normalizeStatus(oracleTruth?.verificationStatus);
  const contradictionStatus = normalizeStatus(oracleTruth?.contradictionStatus, "none");
  const readinessStatus = normalizeStatus(oracleTruth?.readinessStatus, "not_ready");
  const confidenceScore = normalizeConfidenceScore(oracleTruth?.confidenceScore);
  const confidenceBand = normalizeStatus(oracleTruth?.confidenceBand);
  const trustEnvelopePresent = Boolean(trustEnvelope);
  const normalizedTraceCoverageStatus =
    traceCoverageStatus ||
    reportingReadiness?.traceCoverageStatus ||
    (reportingReadiness?.sourceToReportTraceCoverage === true ? "complete" : null) ||
    "missing";

  const riskLevel = computeRiskLevel({
    truthStatus,
    verificationStatus,
    contradictionStatus,
    readinessStatus,
    confidenceScore,
    traceCoverageStatus: normalizedTraceCoverageStatus,
    trustEnvelopePresent,
  });

  const decisionPosture = computeDecisionPosture({
    truthStatus,
    readinessStatus,
    riskLevel,
  });

  const context = {
    surface,
    selectedEntityId:
      selectedEntityId ||
      oracleTruth?.entityId ||
      oracleTruth?.entity_id ||
      mapContext?.selected_entity_id ||
      null,
    selectedCounty: selectedCounty || mapContext?.selected_county || drawerContext?.county || null,
    selectedRegion: selectedRegion || mapContext?.selected_region || null,

    truthStatus,
    verificationStatus,
    contradictionStatus,
    readinessStatus,
    confidenceScore,
    confidenceBand,

    traceId: getTraceId(oracleTruth),
    trustEnvelope,
    trustEnvelopePresent,
    publicationMode:
      trustEnvelope?.publicationMode ||
      trustEnvelope?.publication_mode ||
      reportingReadiness?.publicationMode ||
      "internal",
    traceCoverageStatus: normalizedTraceCoverageStatus,

    reportingReady: Boolean(reportingReadiness?.ready),
    reportingStatus: reportingReadiness?.status || "unknown",
    reportingReasons: reportingReadiness?.reasons || [],

    permissions,
    canViewTruth: permissions.includes("truth.view"),
    canViewOracle: permissions.includes("oracle.view"),
    canExportReports: permissions.includes("reports.export"),
    canViewAudit: permissions.includes("audit.view"),

    riskLevel,
    decisionPosture,
    summary: "",
    whyPoints: [],
    recommendation: "",
    mapContext,
    drawerContext,
  };

  context.summary = buildSummary(context);
  context.whyPoints = buildWhyPoints(context);
  context.recommendation = buildRecommendation({
    oracleTruth,
    readinessStatus,
    riskLevel,
    decisionPosture,
    trustEnvelopePresent,
    traceCoverageStatus: normalizedTraceCoverageStatus,
  });

  return context;
}

export function buildAIAnalystNoTruthContext(surface = "unknown_surface") {
  return buildAIAnalystTruthContext({ surface });
}
