# Regional Simulation Authority (Phase 9)

The Regional Simulation Authority owns simulated regional world state. It does not establish real-world civic truth.

Code: `src/system/metaverse/regional/` (`regionalSimulation.js`, `regionalScenarios.js`, `regionalReplay.js`).
MOL registration: system `regional-simulation`, authority domain `REGIONAL_SIMULATION`, mode `SIMULATED`, maturity `SIMULATED`.

## What it owns, and what it does not

| Owns | Does not own |
| --- | --- |
| Simulated regional state: active systems, simulated incidents, mobility/infrastructure/environment summaries, active scenarios, world flags | Real-world civic state, traffic, water, power, incident or any other domain authority's truth |
| The deterministic simulation clock | Mission execution (Mission Runtime), Arcade results, Evidence, Truth Spine, credentials, careers, funding |
| `REGIONAL_IMPACT_PROJECTED` and `SIMULATION_STATE_CHANGED` events | Any other event type (each MOL event type keeps one owning system) |
| The `regionalImpacts` world-state category | Workforce program activation |

Every state snapshot carries `realWorld: false`, `truthPolicy: NOT_INSTITUTIONAL_TRUTH` and `evidencePolicy: NOT_EVIDENCE`.

## Modes and honesty

- Supported modes are `TEST`, `SIMULATED` and `HYBRID`.
- `LIVE` is refused with `REGIONAL_LIVE_REQUIRES_LIVE_PROVIDER_AUTHORITY`.
- `HYBRID` is refused with `HYBRID_REQUIRES_LIVE_WORLD_PROVIDER` until a registered world provider is actually `LIVE`.
- Every event the authority publishes has `providerMode` `SIMULATED` or `TEST`.

## Clock

The clock has three states: `STOPPED`, `RUNNING` and `PAUSED`.

| Control | Valid from | Effect |
| --- | --- | --- |
| `start()` | `STOPPED` | Sets the clock to `RUNNING` |
| `pause()` | `RUNNING` | Sets the clock to `PAUSED` |
| `resume()` | `PAUSED` | Sets the clock to `RUNNING` |
| `reset()` | any state | Clears scenarios, impacts and the log back to `startAt`; ends `STOPPED` |
| `advance(ms)` | `RUNNING` only | Advances simulation time; publishes due scenario steps in order |

- Any other transition is rejected with `INVALID_TRANSITION`.
- Time never moves while the clock is paused. There is no wall clock and no randomness.
- A given simulation id and set of inputs always produces the same event ids and order.
- `advance(ms)` is bounded at 24 h per call and 200 events per call; anything outside that is rejected with `ADVANCE_OUT_OF_BOUNDS`.

## Scenarios

The authority reuses the approved 4F.5 MOL scenario engine (`molScenarios.js`) and does not add a second one. A regional scenario is the approved MOL scenario plus a list of declared participants.

| Regional scenario | MOL scenario | Required participants | Optional participants | Reported absent (no registered system) |
| --- | --- | --- | --- | --- |
| `REGIONAL_POWER_DISRUPTION` | `INFRASTRUCTURE_FAILURE` | power-grid | data-center, incident | telecom, traffic-signals, port-operations, hospital-backup-power, public-works |
| `STORM_FLOOD_RESPONSE` | `WATER_RESTRICTION` | ocean-environment, water-mobility | road-traffic | fire-ems, public-works, hospital |

How participant availability affects a scenario:

- **Required participant unavailable:** the scenario is blocked, with reason `REQUIRED_PARTICIPANT_UNAVAILABLE`.
- **Optional participant unavailable:** the scenario runs in a degraded state.
- **Absent participant:** reported as `UNAVAILABLE` with reason `NO_REGISTERED_SYSTEM`. It is never simulated by invention.

At most four scenarios can be active at once.

## Propagation and dependencies

Impact spreads only along edges declared in the existing regional twin graph (`DEPENDS_ON`, `LOCATED_IN`), using the existing `downstreamImpact` function:

- Each impact is published as `REGIONAL_IMPACT_PROJECTED`.
- Its `causationId` is the source event and its `correlationId` is the scenario's correlation id.
- The source system is not listed as its own dependent.
- Resolution events (`POWER_RESTORED`, `INCIDENT_CLOSED`) mark the impact `CLEARED`.

`getDependencyProjection()` is read-only and tags each edge:

| Tag | Meaning |
| --- | --- |
| `DECLARED` | The edge comes from the graph |
| `SIMULATED` | The impact was observed in this run |
| `VERIFIED` | Reserved. There are no verified edges yet, so `verifiedEdges` is 0 |

## Replay and What-If

`createReplaySession(events, range)` re-applies a logged range on its own bus. The session is labeled `REPLAY` and has `mutatesAuthorities: false`, and it supports step, pause, resume, inspect and compare. Replay re-applies logged impacts; it does not derive new ones.

`runWhatIf` runs on a `TEST` clone:

- It is labeled `WHAT_IF` and has `writesCanonical: false`.
- The source simulation is never touched.
- It returns the baseline, the outcome and the changed flags only.

This is not a complete What-If engine.

## Mission context

`getMissionWorldContext()` uses the existing `projectMolMissionWorldContext`. The result is read-only, `simulated: true` and `missionAuthority: false`. Mission Runtime remains the only authority over mission execution.

## Persistence

No migration is required. Simulation sessions are ephemeral (in memory, one per organization through the API). Operator actions persist to the existing `audit_events` table.
