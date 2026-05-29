import { buildDecisionUpdate } from "./decisionHandler.js";

export function initDecisionListener(getState) {
  if (typeof window !== "undefined") {
    if (window.__SHF_DECISION_LISTENER__) {
      console.log("LISTENER_ALREADY_ATTACHED");
      return;
    }
    window.__SHF_DECISION_LISTENER__ = true;
  }
  if (typeof window === "undefined") return;

  const handler = (e) => {
    const payload = e.detail || {};
    const state = typeof getState === "function" ? getState() : {};

    const result = buildDecisionUpdate(
      payload,
      state.currentRecommendation,
      state.currentTimelineStep
    );

    console.log("DECISION LISTENER RECEIVED:", payload);
    console.log("DECISION UPDATE RESULT:", result);
  };

  window.addEventListener("shf:ai_action", handler);

  return () => {
    window.removeEventListener("shf:ai_action", handler);
  };
}
