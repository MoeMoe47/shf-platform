export function buildDecisionSignal({
  predictive,
  liveRecommendation,
  recommendation,
  liveTimelineStep,
  systemStatus,
  narrative,
}) {
  return {
    label:
      predictive?.recommendedAction ||
      liveRecommendation?.action ||
      recommendation?.action ||
      "assign_verifier",

    stateLabel:
      predictive?.predictedNextStage ||
      liveTimelineStep ||
      "risk_signal",

    tone:
      systemStatus === "on_hold"
        ? "risk"
        : systemStatus === "manual_review_required"
        ? "warn"
        : predictive?.riskBand === "High"
        ? "risk"
        : predictive?.riskBand === "Moderate" || predictive?.riskBand === "Medium"
        ? "warn"
        : "ok",

    confidence:
      predictive?.confidence ||
      liveRecommendation?.confidence ||
      recommendation?.confidence ||
      0,

    recommendation:
      narrative?.recommendationReason ||
      liveRecommendation?.reason ||
      recommendation?.reason ||
      "No recommendation reasoning available.",
  };
}
