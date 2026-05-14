export function buildActiveAgentContext({
  liveAgentContext,
  computedAgentContext,
}) {
  return liveAgentContext || computedAgentContext;
}
