export function initAnalystBridge({ setRecommendation, setTimelineStep }) {
  if (typeof window === "undefined") return;

  window.addEventListener("shf:ai_action", (e) => {
    const payload = e.detail || {};
    const actionType = String(payload.type || "").toLowerCase();

    let nextTimelineStep = "risk_signal";
    let nextRecommendation = {};

    if (actionType === "hold") {
      nextTimelineStep = "verification_inquiry";
      nextRecommendation = {
        action: "hold_for_verification",
        nextAction: "queue_operator_review",
        type: "hold",
      };
    }

    if (actionType === "review") {
      nextTimelineStep = "action_queued";
      nextRecommendation = {
        action: "queue_operator_review",
        nextAction: "confirm_funding_pool",
        type: "review",
      };
    }

    if (actionType === "execute") {
      nextTimelineStep = "outcome_pending";
      nextRecommendation = {
        action: "confirm_funding_pool",
        nextAction: "release_funding",
        type: "release",
      };
    }

    setTimelineStep(nextTimelineStep);
    setRecommendation(nextRecommendation);

    console.log("AI ACTION APPLIED:", payload);
  });
}
