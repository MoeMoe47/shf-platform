# Regional Detail Side Rail Fix Lock

## Confirmed Working

- SHF Impact Command Center is visible.
- Regional zoom/glow layer works.
- Generated regional cluster fallback works for counties without custom cluster files.
- Selected county glows in regional layer.
- STATEWIDE button returns to statewide view without browser refresh.
- Agent Fabric Sync card updates with clicked county context.
- Regional county detail card no longer blocks the selected glowing county.
- County detail card is now a compact frosted side rail.
- County detail side rail expands on hover/focus.
- Build passes.

## Locked Map Behavior

Statewide View:
- Shows full Ohio county map.

County Click:
- Opens regional zoom/glow layer.
- Selected county glows.
- AI Agent Sync receives clicked county context.

STATEWIDE Button:
- Returns from regional/county view back to statewide view.

County Detail Card:
- Stays compact by default.
- Moves to the side.
- Expands only when needed.

## Safety Rule

Do not directly rewrite the large SHFImpactCommandCenter.jsx render tree for map/agent behavior unless there is no safer option.

Future map/AI sync work should stay inside:
- SHFImpactOhioMap.jsx
- SHFRegionalCountyCluster.jsx
- AgentSyncStatus.jsx
- AIAnalystPanel.jsx
- small hooks
- isolated event bridges
