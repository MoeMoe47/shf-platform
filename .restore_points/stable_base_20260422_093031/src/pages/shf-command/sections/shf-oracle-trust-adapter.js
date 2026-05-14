export function buildOracleTrustView(oracleTruth) {
  if (!oracleTruth) {
    return {
      status: "unknown",
      verification: "unknown",
      readiness: "unknown",
      confidence: "—"
    };
  }

  return {
    status: oracleTruth.truthStatus || "unknown",
    verification: oracleTruth.verificationStatus || "unknown",
    readiness: oracleTruth.readinessStatus || "unknown",
    confidence:
      oracleTruth.confidenceScore != null
        ? String(oracleTruth.confidenceScore)
        : "—"
  };
}
