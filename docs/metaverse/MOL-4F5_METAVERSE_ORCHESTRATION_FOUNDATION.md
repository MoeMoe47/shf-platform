# Phase 4F.5 — Metaverse Orchestration Layer (MOL) Foundation

**Separate authorities. Shared coordination. One living city.**

MOL coordinates. Domain systems remain authoritative.

MOL World State is a projection, not universal source of truth.

Simulation events are not institutional truth.

Mission participation is not automatically evidence.

Agent Fabric remains AI governance authority.

Arcade Integration Fabric remains Arcade interoperability and does not replace MOL.

System events are versioned, attributable, replayable, and correlation-aware.

Unavailable systems must fail visibly and safely.

Code: `src/system/metaverse/mol/` · Command center: `/metaverse/dev/orchestration` (`src/pages/metaverse/MolCommandCenterPage.jsx`) · Tests: `tests/metaverseMol*.test.mjs`.

## 1. Audit summary

The build document is not checked into this repository. This phase implements it from the Phase 4F.5 brief and the code audit below.

### Engines and systems found

| System | Location | Reality today | MOL classification |
|---|---|---|---|
| Road Traffic | `src/system/metaverse/traffic/*` (MET-16A/B), `metaverseTrafficRoutes.json` (5 APPROVED routes) | Pure presentation and authoring models for vehicle motion on authored corridors. No closures, collisions, events or server state. `LIVING_CITY_AUTHORITY_BOUNDARY.trafficTriggersBusinessLogic = false`. | **CONNECT** by reference (route IDs); SIMULATED provider |
| Water / rivers / cargo ships | `metaverseRiverFlowRegistry.js` (water zones), `cargoShipRegistry.js`, river motion | Geometry and visual registries (`stateClassification: DECORATIVE`). **No Water Mobility / vessel routing engine.** | **CONNECT** by reference (zone IDs); SIMULATED provider; Water Mobility engine **HOLD** |
| Ocean / weather | `oceanMotionEngine.js` (editor, localStorage), `metaverseEnvironmentRuntime.js` (weather presets), `/metaverse/dev/ocean` | Presentation configuration | **CONNECT** by preset reference; SIMULATED provider |
| Incident / Dispatch / Fire / EMS / Hospital | — | **Absent.** `PRODUCTION_EMERGENCY_AUTHORITIES` is `[]`; the spatial command center prohibits `dispatch` authority. | **HOLD**; contract-defined SIMULATED provider for education only |
| Rail / Sky Bridge, Port, Public Works, Aviation, Broadband | Registry references only (`skyBridgeStopRefs`, canonical destinations) | No engines | **HOLD** |
| Power / Data Center | Canonical destinations (`power-electrical-facility`, `main-data-center`, …); data-center curriculum map | No engines | Power: SIMULATED provider. Data Center: registered `UNAVAILABLE` / `PLANNED` |
| Mission Runtime / Director / Characters | `apps/shs-api/src/domain/mission-runtime`, `mission-director` | Production, server-side, per-learner | **DO NOT REBUILD**; **CONNECT** via a read-only contract (4G) |
| Agent Fabric | `services/shf-agent-fabric`, read-only SHS bridge | AI governance | **DO NOT REBUILD**; context contract only |
| Spatial Intelligence | `src/system/spatial/*`, `src/shared/spatial/*` (Waves 1–8) | Projection pipeline, freshness/stale policy, coordinate spaces, interaction bus, command center, geometric relationships | **DO NOT REBUILD**; **REUSE** vocabularies (`COORDINATE_FAMILIES`, `SPATIAL_LAYER_STALE_POLICIES.MARK_STALE`) and the bus pattern |
| MET-11 City Economy Orchestration | `apps/shs-api/src/domain/metaverse/orchestration` | Learner-facing next-action / briefing projection | **DO NOT REBUILD**; separate concern (experience orchestration) |
| SHS System Orchestrator V1 | `src/data/orchestrator`, admin page | Operator workflow/agent control plane | Separate concern |
| BOS Conductor (migration 092) | shs-api | Per-org business planning | Separate concern |
| Integration outbox (migration 007) | shs-api | Org-scoped durable delivery to external integrations | **HOLD** for MOL; not reused (requires org and actor, semantics differ) |

### Duplication risks and resolutions

- **Event bus.** `createSpatialInteractionBus` is a UI interaction bus (select, focus, request route). MOL mirrors its pattern (validation, ID dedupe, failure capture) but carries world events, so it is a separate bus with no shared types. Realtime infrastructure is absent by recorded decision (`METAVERSE_REALTIME_REPOSITORY_AUDIT`), so MOL v1 is in-process.
- **Command center.** The spatial command center (Wave 8B–8E) composes map projections and forbids traffic, water, transit and dispatch authority. The MOL command center is a separate diagnostic route with the same prohibitions.
- **Graph.** Spatial `RELATIONSHIP_TYPES` are geometric (CONTAINS, WITHIN, …). The MOL graph is a dependency/coordination graph (`LOCATED_IN`, `DEPENDS_ON`) over canonical IDs. There is no overlap.
- **Freshness.** MOL reuses the spatial `MARK_STALE` policy rather than defining a new one.
- **Naming.** The "city orchestration" name is already taken by MET-11, the SHS Orchestrator, and BOS Conductor. This layer is always called **MOL** in code.
- **Vocabularies.** No existing LIVE/SIMULATED/HYBRID provider-mode or PLANNED…PRODUCTION maturity vocabulary was found, so MOL defines them once in `molSystemRegistry.js`.

### Authority matrix

`MOL_AUTHORITY_MATRIX` in `molSystemRegistry.js` (also rendered in the command center):

| System | Owns | MOL may read | MOL may request | MOL may not control |
|---|---|---|---|---|
| road-traffic | Vehicle movement, corridors, closures | Closure events, approved route IDs | `CONSIDER_CLOSURE` (record only) | Vehicle movement, geometry, signals |
| water-mobility | Vessel movement, waterway routing | Restriction events, water zone IDs | `CONSIDER_RESTRICTION` (record only) | Vessel routes, harbor control |
| ocean-environment | Ocean, weather presentation | Storm events, preset names | — | Wave/weather parameters |
| incident | Incident lifecycle | Incident events | — | Creation, dispatch, closure |
| power-grid | Power state | Power events | — | Switching |
| data-center | Data center operations | Declared dependency only | — | Any state |
| mission-runtime | Mission state/revision/events | — (contract only) | — (4G) | Start, state, completion |
| agent-fabric | AI governance/execution | — | — | Model execution, policy |
| evidence · truth-spine · identity · curriculum/career | Their records | — | — | Everything |
| mol | Orchestration operational state | Accepted MOL events | Record-only requests | Domain facts |

## 2. What was built

- **Event Contract v1** (`molEventContract.js`). The envelope fields are:
  - `eventId`, `eventVersion`, `eventType`, `occurredAt`
  - `sourceSystem`, `authority`, `providerMode`
  - `location` (coordinate family plus `destinationId` / `featureId` / `layerId` references)
  - `severity`, `entities`, `correlationId`, `causationId`, `status`
  - optional `requiredCapabilities` and `relatedMission` (a reference only)
  - `evidencePolicy` fixed to `NOT_EVIDENCE` and `truthPolicy` fixed to `NOT_INSTITUTIONAL_TRUTH`
  - a bounded flat scalar `payload`

  Validation is closed-shape. It rejects executable text, nested payloads, authority-bearing keys, and events over 4 KB (payloads over 1 KB). Unsupported versions are rejected to dead-letter and never processed.
- **Naming.** UPPER_SNAKE `<SUBJECT>_<PAST_TENSE_VERB>`. Each type has exactly one owning system. The v1 proof set is ROAD_CLOSED/REOPENED, VEHICLE_COLLISION, WATERWAY_RESTRICTED/_LIFTED, STORM_STARTED/ENDED, POWER_FAILURE/RESTORED, INCIDENT_OPENED/CLOSED, and SYSTEM_HEALTH_CHANGED.
- **System Registry** (`molSystemRegistry.js`). Nine systems, each with mode (`LIVE | SIMULATED | HYBRID | TEST | UNAVAILABLE`), maturity (`PLANNED … PRODUCTION`), integration mode, published and consumed types, accepted requests, world-state contributions, dependencies and interface references. Authority checks enforce:
  - the source system is known
  - the event's authority matches the source
  - the type is owned by that source
  - the source is available
  - the provider mode matches, so SIMULATED cannot pose as LIVE
- **Event bus** (`molEventBus.js`). In-process and deterministic, with:
  - an immutable ordered log
  - idempotent re-publish (an ID conflict is rejected)
  - at-most-once delivery per subscriber
  - handler-failure isolation
  - a bounded dead-letter list (`REJECTED`, `FAILED_PROCESSING`) where drops are counted
  - explicit retries capped at 3 attempts, never automatic
  - replay mode that skips side-effecting subscribers
  - metrics and per-subscriber latency
  - health derived from logged `SYSTEM_HEALTH_CHANGED` events, so replay reconstructs it. Systems with no provider can never be marked healthy.
- **World State** (`molWorldState.js`). A pure projection of the accepted log with categories traffic, water, environment, infrastructure and incidents, each owned by a single authority. Every value carries its source, authority, provider mode, last event and update time. When a source is unavailable or degraded, the last-known value is kept and marked `SOURCE_UNAVAILABLE` / `STALE`. Nothing is reopened, refreshed or invented.
- **Regional Digital Twin Graph and Dependency Graph** (`molRegionalGraph.js`). Reference-only nodes: the city, 9 districts, 36 canonical facilities, 9 systems, the approved traffic corridors and the water zones. Relationships are `LOCATED_IN` (from the destination relationship registry) and a declared `DEPENDS_ON` infrastructure topology. Downstream impact is bounded (depth 4, 50 nodes), cycle-safe, and reports truncation.
- **Coordination** (`molCoordination.js`). Bounded routing: an incident's affected corridors and waterways become record-only `CONSIDER_*` requests to the owning authority (`executes: false`), and power failures produce dependency-impact assessments. Prohibited targets can never be addressed. This is the foundation only, not the City Event Director.
- **Scenario runner and replay** (`molScenarios.js`). Approved scenarios: `TRAFFIC_COLLISION`, `WATER_RESTRICTION`, `INFRASTRUCTURE_FAILURE`, `BRIDGE_INCIDENT`.
  - Every reference resolves against the real registry before anything is published.
  - IDs and timestamps derive from scenario, seed and step.
  - Supports step, pause and resume.
  - If a cause is rejected, its dependent steps are skipped while unrelated steps continue.
  - Replay preserves order, IDs, correlation, causation, attribution and timestamps, and re-issues no requests.
- **Contract update (Phase 4G).** `MOL_MISSION_WORLD_CONTEXT_CONTRACT` is now v2. It adds `infrastructure` conditions and per-system `systems` health so infrastructure Missions can consume power context. It is still read-only, carries no learner data, and has `missionAuthority: false` and `startsMissions: false`. Mission Runtime consumes it through `apps/shs-api/src/domain/mission-runtime/world/mol-bridge.ts`.
- **Contracts.**
  - `MOL_MISSION_WORLD_CONTEXT_CONTRACT`: read-only, no learner data, `missionAuthority: false`, `startsMissions: false`.
  - `MOL_WORLD_EVENT_CONTEXT_CONTRACT`: `executesModels: false`.
- **Command center** (`/metaverse/dev/orchestration`). Sections: world status, system registry and authority matrix, live event stream, dependency list and impact, world state, scenario and replay, diagnostics.
  - Uses native controls, tables with captions and `scope`, and a polite live region.
  - Statuses show a symbol plus text, never color alone.
  - No graph-only views and no motion; `prefers-reduced-motion` is honored.
  - An in-memory session with no production-admin powers, gated like the existing `/metaverse/dev/ocean`.

## 3. Persistence decision

**No migration.** Every 4F.5 producer is a client-side simulated provider, and the bus, log, projection and replay are deterministic and in-memory. Migration 155 is unchanged and 156 was not created.

A durable MOL log becomes necessary when the first **server-side** producer exists (for example a real Incident engine, or Mission Runtime publishing world-relevant events). The proposed minimum at that point:

- `mol_events`: append-only, mirroring the v1 envelope, unique `event_id`, with a `UPDATE`/`DELETE` trigger like migration 155.
- `mol_dead_letters`: bounded, with an attempts cap.

World state stays a projection computed from `mol_events`, not a table. The existing `integration_outbox` is not reused: it is org-scoped, requires an originating actor, and models external delivery rather than world events.

## 4. Known limitations

- Traffic, Ocean/Weather and Water are presentation models. Their MOL providers are deterministic simulations that reference real IDs but do not observe live engine state.
- Water Mobility, Incident and Power have no engines (`CONTRACT_DEFINED`). Data Center is `PLANNED` / `UNAVAILABLE`.
- Command-center sessions are per-browser and in-memory; nothing persists.
- The command center is not gated beyond the existing dev-route pattern, because it has no powers beyond its own in-memory session.
- The `DEPENDS_ON` infrastructure topology is declared by MOL for coordination; no facility engine confirms it yet.
- Mission Runtime and Agent Fabric integrations are contracts only. Missions are not observed or started.
