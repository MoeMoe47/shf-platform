export function buildSimulationViewData({
  simulationFrame,
  simAnalyst,
}) {
  const safeFrame = simulationFrame || {};
  const safeAnalyst = simAnalyst || {};
  const safeRecommendation = safeFrame?.recommendation || {};

  return {
    hasSimulation: Boolean(simulationFrame || simAnalyst),
    summary:
      safeAnalyst?.summary ||
      safeFrame?.note ||
      "Simulation active.",
    action: safeRecommendation?.action || "",
    timelineStep: safeFrame?.timelineStep || "",
    recommendation: safeRecommendation,
    frame: safeFrame,
    analyst: safeAnalyst,
  };
}
