export function buildDecisionUpdate(payload, currentRecommendation, currentTimelineStep) {
  const actionType = String(payload?.type || "").toLowerCase();

  const safeRecommendation = currentRecommendation || {};
  const safeTimelineStep = currentTimelineStep || "risk_signal";

  if (actionType === "hold") {
    return {
      nextTimelineStep: "verification_inquiry",
      nextRecommendation: {
        ...safeRecommendation,
        action: "hold_for_verification",
        nextAction: "queue_operator_review",
        type: "hold",
        reason: "Analyst requested verification before progression."
      }
    };
  }

  if (actionType === "review") {
    return {
      nextTimelineStep: "action_queued",
      nextRecommendation: {
        ...safeRecommendation,
        action: "queue_operator_review",
        nextAction: "confirm_funding_pool",
        type: "review",
        reason: "Analyst requested operator review before execution."
      }
    };
  }

  if (actionType === "execute") {
    return {
      nextTimelineStep: "outcome_pending",
      nextRecommendation: {
        ...safeRecommendation,
        action: "confirm_funding_pool",
        nextAction: "release_funding",
        type: "release",
        reason: "Analyst approved monitored progression."
      }
    };
  }

  return {
    nextTimelineStep: safeTimelineStep,
    nextRecommendation: safeRecommendation
  };
}
