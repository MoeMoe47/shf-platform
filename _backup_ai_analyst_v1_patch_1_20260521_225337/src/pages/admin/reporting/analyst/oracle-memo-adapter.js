import { buildAIAnalystTruthContext } from "@/shared/ai-analyst/aiAnalystTruthContext";

export function getOracleMemoRecommendation(oracleTruth, options = {}) {
  const context = buildAIAnalystTruthContext({
    oracleTruth,
    surface: options.surface || "oracle_memo_adapter",
    traceCoverageStatus: options.traceCoverageStatus,
    reportingReadiness: options.reportingReadiness,
    permissions: options.permissions || [],
  });

  return context.recommendation || "No Oracle recommendation available.";
}

export function buildOracleMemoSummary(oracleTruth, options = {}) {
  const context = buildAIAnalystTruthContext({
    oracleTruth,
    surface: options.surface || "oracle_memo_adapter",
    traceCoverageStatus: options.traceCoverageStatus,
    reportingReadiness: options.reportingReadiness,
    permissions: options.permissions || [],
  });

  if (!oracleTruth) {
    return "No certified truth available.";
  }

  return [
    `Truth Status: ${context.truthStatus}`,
    `Confidence: ${context.confidenceScore ?? "—"} (${context.confidenceBand})`,
    `Verification: ${context.verificationStatus}`,
    `Contradictions: ${context.contradictionStatus}`,
    `Readiness: ${context.readinessStatus}`,
    `Trace Coverage: ${context.traceCoverageStatus}`,
    `Trust Envelope: ${context.trustEnvelopePresent ? "present" : "missing"}`,
  ].join(" • ");
}
