export function buildSimulationEngineContext({
  enabled = true,
  tickMs = 5000,
  stepNonce = 0,
  agentContext,
  recommendation,
  timelineStep,
  systemStatus,
}) {
  return {
    enabled,
    tickMs,
    stepNonce,
    agentContext: agentContext || null,
    recommendation: recommendation || null,
    timelineStep: timelineStep || "risk_signal",
    systemStatus: systemStatus || "",
  };
}
