export function buildComputedAgentContext({
  agentContext,
  liveRecommendation,
  recommendation,
  simAnalyst,
  liveTimelineStep,
}) {
  return {
    ...agentContext,
    recommendation: liveRecommendation || recommendation,
    simulationAnalyst: simAnalyst,
    timelineStep: liveTimelineStep,
  };
}
