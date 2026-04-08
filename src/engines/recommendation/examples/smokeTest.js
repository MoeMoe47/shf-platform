import { buildGTSERecommendation } from "../index.js";

export function runRecommendationAdapterTest() {
  const result = buildGTSERecommendation(
    {
      title: "Legacy recommendation",
      reason: "Legacy fallback reason",
      confidenceScore: 0.82,
    },
    {
      page: "command",
      timelineStep: "payment_pending",
      systemStatus: "review",
      activeCase: {
        jurisdiction: "Franklin County, OH",
      },
      metrics: {
        success_rate: 0.82,
        funding_confidence: 0.78,
      },
      costs: {
        delay_cost: 0.16,
        release_risk_cost: 0.22,
      },
    }
  );

  console.log("🔥 RECOMMENDATION ADAPTER TEST:", result);
  return result;
}
