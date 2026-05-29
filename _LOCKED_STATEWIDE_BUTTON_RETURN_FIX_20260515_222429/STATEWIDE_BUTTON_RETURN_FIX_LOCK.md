# Statewide Button Return Fix Lock

## Confirmed Working

- SHF Impact Command Center is visible.
- Regional zoom/glow layer works.
- Selected county glows in the regional layer.
- Generated regional cluster fallback works for counties without custom cluster files.
- Agent Fabric Sync card updates with clicked county context.
- STATEWIDE button now returns from regional/county view back to statewide view without refreshing the browser.
- Build passes.

## Important Fix

The visible STATEWIDE button lives outside the internal map reset button flow, so SHFImpactOhioMap.jsx now listens safely for the static STATEWIDE button click and runs the map reset state.

## Safety Rule

Do not directly rewrite the large SHFImpactCommandCenter.jsx render tree for map/agent behavior unless there is no safer option.

Future map/AI sync work should stay inside:
- SHFImpactOhioMap.jsx
- SHFRegionalCountyCluster.jsx
- AgentSyncStatus.jsx
- AIAnalystPanel.jsx
- small hooks
- isolated event bridges
