# Map Click Context Bridge V1 Lock

## Confirmed Working

- SHF Impact Command Center is visible.
- Ohio Impact map is visible.
- AI Analyst panel is visible.
- Agent Fabric Sync card is visible.
- Clicking a county on the map updates AgentSyncStatus.
- AgentSyncStatus displays the clicked county context.
- AgentSyncStatus displays the event source, such as statewide_county_click.
- Agent Fabric page-context dry-run returns COMPLETE_CONTEXT when backend is running.
- The sync bridge uses a safe browser event: shf:map-county-context.
- SHFImpactCommandCenter.jsx was not directly patched for this bridge.

## Locked Architecture

SHFImpactOhioMap.jsx
→ dispatches shf:map-county-context browser event
→ AgentSyncStatus.jsx listens for the event
→ AgentSyncStatus sends clicked county, map mode, entity, and Oracle truth context to Agent Fabric
→ AI Analyst panel displays sync state

## Safety Rule

Do not directly inject agent wiring into SHFImpactCommandCenter.jsx.

Future agent/context work should stay inside:
- AgentSyncStatus.jsx
- AIAnalystPanel.jsx
- SHFImpactOhioMap.jsx event bridge
- small hooks
- isolated adapters

## Next Safe Upgrade

Add drawer context bridge so opening county detail can also update AgentSyncStatus with drawer state.
