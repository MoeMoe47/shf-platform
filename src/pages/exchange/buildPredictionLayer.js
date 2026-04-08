export function buildPredictionLayer(agentContext = {}, agentAudience = "executive") {
  const safe = agentContext || {};

  const step = safe?.timelineStep || "risk_signal";
  const systemStatus = safe?.systemStatus || "";
  const recommendation = safe?.recommendation || {};

  const prerequisites = Array.isArray(recommendation?.prerequisites)
    ? recommendation.prerequisites
    : [];

  const blockers = Array.isArray(recommendation?.blockers)
    ? recommendation.blockers
    : [];

  let predictedNextStage = "verification_inquiry";
  let riskScore = 18;
  let riskLabel = "Low";
  let riskReason = "System is progressing normally.";

  const addRisk = (points) => {
    riskScore += points;
  };

  if (step === "risk_signal") {
    predictedNextStage = "verification_inquiry";
    riskScore = 24;
    riskReason = "System is moving from risk detection into verification.";
  } else if (step === "verification_inquiry") {
    predictedNextStage = "verification_passed";
    riskScore = 32;
    riskReason = "Awaiting verification confirmation.";
  } else if (step === "queue_operator_review") {
    predictedNextStage = "action_queued";
    riskScore = 22;
    riskReason = "Verification cleared. Preparing action queue.";
  } else if (step === "action_queued") {
    predictedNextStage = "outcome_pending";
    riskScore = 20;
  } else if (step === "outcome_pending") {
    predictedNextStage = "payment_pending";
    riskScore = 26;
  }

  if (!prerequisites.includes("funding_pool_ready")) addRisk(12);
  if (!prerequisites.includes("contract_present")) addRisk(10);
  if (!prerequisites.includes("verifier_assigned")) addRisk(8);
  if (blockers.includes("manual_review_pending")) addRisk(18);

  if (systemStatus === "on_hold") addRisk(20);
  if (systemStatus === "manual_review_required") addRisk(16);

  riskScore = Math.max(5, Math.min(95, riskScore));

  if (riskScore >= 60) riskLabel = "High";
  else if (riskScore >= 30) riskLabel = "Moderate";

  const confidenceRaw = recommendation?.confidence || 0;
  const confidence =
    confidenceRaw <= 1
      ? Math.round(confidenceRaw * 100)
      : Math.round(confidenceRaw);

  const recommendedAction = recommendation?.action || "no_action";

  const alternativeAction =
    riskScore >= 60
      ? "hold"
      : riskScore >= 30
      ? "review"
      : "execute";

  const summaryNarrative =
    riskScore >= 60
      ? `Elevated risk detected before ${predictedNextStage.replace(/_/g, " ")}.`
      : `System likely moving toward ${predictedNextStage.replace(/_/g, " ")}.`;

  return {
    caseLabel: safe?.activeCase?.label || "Unknown Case",
    systemStatus,
    timelineStep: step,
    riskScore,
    riskBand: riskLabel,
    confidence,
    recommendedAction,
    alternativeAction,
    predictedNextStage,
    aging: 0,
    summaryNarrative,
  };
}
