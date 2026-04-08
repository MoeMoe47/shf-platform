import { runGTSE } from "../index";

export function runGTSERawTest() {
  const result = runGTSE({
    candidate_actions: [
      "release_now",
      "hold_for_verification",
      "partial_release",
      "reassign_tasks"
    ],
    metrics: {
      success_rate: 0.82,
      funding_confidence: 0.78
    },
    costs: {
      delay_cost: 0.15,
      release_risk_cost: 0.22
    }
  });

  console.log("🔥 GTSE TEST RESULT:", result);

  return result;
}
