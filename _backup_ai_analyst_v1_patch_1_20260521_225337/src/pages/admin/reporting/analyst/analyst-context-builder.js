import { buildAIAnalystTruthContext } from "@/shared/ai-analyst/aiAnalystTruthContext";

export function buildAnalystContext(oracleTruth, options = {}) {
  const context = buildAIAnalystTruthContext({
    oracleTruth,
    surface: options.surface || "reporting_analyst_memo",
    traceCoverageStatus: options.traceCoverageStatus,
    reportingReadiness: options.reportingReadiness,
    permissions: options.permissions || [],
    selectedEntityId: options.selectedEntityId,
  });

  return {
    ...context,
    summary: context.summary,
    riskLevel: context.riskLevel,
    recommendation: context.recommendation,
  };
}
