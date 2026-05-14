export function buildOracleAnalystView(oracleTruth) {
  if (!oracleTruth) {
    return {
      changedText: "No Oracle truth available",
      whyPoints: [],
      nextMoveText: "Await validation",
      confidence: null
    };
  }

  return {
    changedText:
      oracleTruth?.recommendedNextAction ||
      "No Oracle recommendation",

    whyPoints: [
      `Truth: ${oracleTruth?.truthStatus || "unknown"}`,
      `Verification: ${oracleTruth?.verificationStatus || "unknown"}`,
      `Confidence: ${oracleTruth?.confidenceScore ?? "—"}`
    ],

    nextMoveText:
      oracleTruth?.recommendedNextAction ||
      "Await further validation",

    confidence:
      oracleTruth?.confidenceScore != null
        ? String(oracleTruth.confidenceScore)
        : null
  };
}
