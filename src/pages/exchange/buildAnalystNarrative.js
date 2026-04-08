export function buildAnalystNarrative({
  predictionLayer = {},
  activeCase,
  systemStatus,
  timelineStep,
  recommendation = {},
  agentContext = {},
}) {
  const caseLabel = activeCase?.label || "Unknown Case";

  const riskScore = predictionLayer?.riskScore || 0;
  const riskBand = predictionLayer?.riskBand || "Low";
  const nextStage = predictionLayer?.predictedNextStage || "unknown";

  const confidence = predictionLayer?.confidence || 0;

  const prerequisites = recommendation?.prerequisites || [];
  const blockers = recommendation?.blockers || [];

  const headline =
    riskScore >= 60
      ? `High risk detected in ${caseLabel}`
      : `System progressing for ${caseLabel}`;

  const summary =
    riskScore >= 60
      ? `Elevated execution risk detected before ${nextStage.replace(/_/g, " ")}.`
      : `System likely moving toward ${nextStage.replace(/_/g, " ")}.`;

  const recommendationReason =
    recommendation?.reason ||
    "System recommends this action based on current state alignment.";

  const nextMove =
    riskScore >= 60
      ? "Recommend holding execution until risk conditions are resolved."
      : `Proceed toward ${nextStage.replace(/_/g, " ")}.`;

  let riskNarrative = "System operating within acceptable risk range.";

  if (blockers.length > 0) {
    riskNarrative = "Active blockers detected: " + blockers.join(", ");
  } else if (riskScore >= 60) {
    riskNarrative = "High risk environment detected. Execution caution required.";
  } else if (riskScore >= 30) {
    riskNarrative = "Moderate risk. Monitoring recommended.";
  }

  return {
    headline,
    summary,
    recommendationReason,
    nextMove,
    riskNarrative,
    confidence,
    prerequisites,
    blockers,
  };
}
