# Core MOCC — Metaverse Operations & Orchestration Command Center (Phase 9)

The MOCC coordinates authorities; it does not replace them.

Workforce program activation remains a workforce/program authority and is not owned by MOCC.

## Where the code lives

| Area | Location |
| --- | --- |
| Shared pure layer | `src/system/metaverse/mocc/` (`moccViewModel.js`, `moccOperatorActions.js`) |
| API service | `apps/shs-api/src/domain/metaverse/operations/` (`MoccOperationsService`) |
| API routes | `GET /metaverse/operations`, `POST /metaverse/operations/actions/:controlId` |
| Dev/test UI | `/metaverse/dev/mocc` (`src/pages/metaverse/MoccCommandCenterPage.jsx`) — in-browser `TEST` simulation, no production authority |

## Ownership

The MOCC owns only two things:

- presentation state (which overlays are visible);
- operator audit records.

It reads, and never writes, the following:

| Source | What the MOCC reads |
| --- | --- |
| Regional Simulation Authority | State, log, dependencies |
| MOL | System registry, event registry, health |
| Workforce ProgramPackage registry | Phase 8 `moccProgramPackets`: aggregate, learner-agnostic |
| Mission Runtime | Session counts by status |
| Arcade Integration Fabric | `operationalProjection` team aggregates |

## Sections (progressive disclosure)

The sections are:

1. Digital twin
2. System health
3. Event timeline
4. Active scenarios
5. Incidents
6. Dependencies
7. Program / Mission impact
8. Replay
9. Operator actions
10. Audit

Only the first three are expanded by default.

## System health

System health is one of `HEALTHY`, `DEGRADED`, `UNAVAILABLE`, `PAUSED` or `UNKNOWN`. It is derived from two sources only:

- the MOL log (`SYSTEM_HEALTH_CHANGED`);
- registered provider modes.

A provider-less system (for example `data-center`) shows as `UNAVAILABLE`. Health never comes from whether a frontend is rendering.

## Timeline

Every entry is labeled `CURRENT`, `SIMULATION`, `REPLAY`, `TEST` or `WHAT_IF`. `CURRENT` is used only for `LIVE` provider events.

The timeline can be filtered by:

- system;
- category (from the event registry);
- severity;
- scenario;
- correlation id;
- time range;
- region (canonical destination id).

## Operator actions (allow-list, no `executeCommand`)

There is no generic `executeCommand(system, payload)`. Every control declares these fields:

- `controlId`
- `targetSystem`
- `requiredPermission`
- `owningAuthority`
- `simulationOnly`
- `liveAllowed` (always `false`)
- `auditRequired` (always `true`)
- `confirmationRequired`

| Control | Permission | Effect |
| --- | --- | --- |
| START / PAUSE / RESUME / ADVANCE_SIMULATION | `metaverse.operations.operate` | Simulated clock only |
| RESET_SIMULATION | operate | Requires confirmation and a reason |
| START / PAUSE / RESUME_SCENARIO | operate | Hosted regional scenarios |
| STOP_SCENARIO | operate | Requires confirmation and a reason |
| REPLAY_EVENT_RANGE | `metaverse.operations.view` | Read-only range over the simulation's own log |
| TOGGLE_OVERLAY | view | The operator's own presentation |
| REQUEST_DOMAIN_ACTION | operate | Always `REQUEST_ONLY`: a recorded MOL action request, never executed |

Decision rules:

| Situation | Decision | Reason |
| --- | --- | --- |
| Anonymous operator | `NOT_AUTHORIZED` | `ANONYMOUS_OPERATOR` |
| Control not in the allow-list | `NOT_ALLOWED` | — |
| Operator lacks the control's permission | `NOT_AUTHORIZED` | — |
| Request targets a never-controlled domain (workforce activation, curriculum, careers, evidence, truth spine, credentials, identity, funding, treasury, mission/arcade runtime) | `NOT_AUTHORIZED` | `WORKFORCE_ACTIVATION_OWNED_BY_WORKFORCE_AUTHORITY` for workforce activation; `TARGET_OUTSIDE_MOCC_AUTHORITY` for the others |

## Audit and the fail-closed invariant

No durable audit record, no MOCC-owned simulation mutation.

Every attempt is audited: executed, rejected and unauthorized alike. The API persists each record to the existing `audit_events` table; no new table or migration is used.

| Column | Value |
| --- | --- |
| `target_object_type` | `mocc_operator_action` |
| `action_type` | `MOCC_<decision>` (`MOCC_AUTHORIZED` for an intent record) |
| `new_state_json.phase` | `INTENT` or `RESULT` |
| `source_channel` | `mocc` |

Each record also stores the operator's user id, the control, the simulation id, mode and time, the result, and the action's correlation id.

### How a mutating control runs

The mutating controls are START / PAUSE / RESUME / RESET / ADVANCE_SIMULATION and START / PAUSE / RESUME / STOP_SCENARIO. `executeMoccOperatorActionDurable` runs them in this order:

1. **Plan.** `planMoccOperatorAction` validates the operator, the control, the permission, and the confirmation and reason. It decides the action without mutating anything; the mutation is held back as a deferred step.
2. **Persist intent.** It writes a durable `AUTHORIZED` / `INTENT` record to `audit_events` and waits for the write to finish.
3. **Apply.** The simulation mutation runs only after that write has succeeded. If the write fails, the mutation is never applied: the simulation state is unchanged, the decision is `AUDIT_FAILED`, and the API answers `503 AUDIT_PERSISTENCE_FAILED`.
4. **Persist result.** It writes the `RESULT` record (`EXECUTED` or `REJECTED`) with the post-action simulation time. If only this write fails, the mutation is still covered by its durable intent record, and the response reports `resultAuditPersisted: false`.

Two further guarantees:

- **Serialized per organization.** Actions on one organization's session run one at a time, so an intent and its mutation are never interleaved with another action.
- **Every committed mutation is covered.** Each one has a durable `AUTHORIZED` record with the same correlation id, written before the change.

### Other controls

- **Read-only and presentation controls** (`REPLAY_EVENT_RANGE`, `TOGGLE_OVERLAY`), denials and `REQUEST_DOMAIN_ACTION` write a single `RESULT` record. They change no simulation state.
- **`REQUEST_DOMAIN_ACTION`** stays `REQUEST_ONLY` with `executed: false`, and workforce activation stays `NOT_AUTHORIZED`.
- **The in-browser dev page** uses the synchronous executor with an in-memory log. It applies the same order: the intent is appended before the mutation, so a throwing audit sink prevents the mutation.

## Security and privacy

- Both routes require `metaverse.operations.view`. Simulation controls additionally require `metaverse.operations.operate`, which the executor enforces.
- Neither permission is granted to any role by default.
- The organization and the operator come from the authenticated user, never the request body. Sessions are keyed per organization.
- MOCC output contains no learner names, accommodations, medical data, credentials, financial data, identity tokens or sensitive partner records:
  - program impact is the Phase 8 aggregate packet, with mission references reduced to `id@version`;
  - Mission/Arcade observability is counts only.

## Not built (out of scope)

The following are not part of the Core MOCC:

- an unrestricted AI operator;
- autonomous civic control;
- a complete What-If engine;
- After-Action intelligence;
- City Memory;
- every overlay (14 overlays are declared `PLANNED` with no layer).
