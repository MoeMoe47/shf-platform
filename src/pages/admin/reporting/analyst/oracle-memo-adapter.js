export function getOracleMemoRecommendation(oracleTruth) {
  return oracleTruth?.recommendedNextAction || "No Oracle recommendation available.";
}

export function buildOracleMemoSummary(oracleTruth) {
  if (!oracleTruth) {
    return "No certified truth available.";
  }

  const truthStatus = oracleTruth?.truthStatus || "unknown";
  const confidenceScore = oracleTruth?.confidenceScore ?? "—";
  const confidenceBand = oracleTruth?.confidenceBand || "unknown";
  const contradictionStatus = oracleTruth?.contradictionStatus || "unknown";
  const readinessStatus = oracleTruth?.readinessStatus || "unknown";
  const verificationStatus = oracleTruth?.verificationStatus || "unknown";

  return [
    `Truth Status: ${truthStatus}`,
    `Confidence: ${confidenceScore} (${confidenceBand})`,
    `Verification: ${verificationStatus}`,
    `Contradictions: ${contradictionStatus}`,
    `Readiness: ${readinessStatus}`,
  ].join(" • ");
}
