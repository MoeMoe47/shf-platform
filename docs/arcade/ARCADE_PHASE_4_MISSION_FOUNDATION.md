# Arcade Phase 4A: Mission Foundation

## Status

Phase 4A establishes a validated Mission Definition content contract only. It
does not create a persisted registry, authoring API, runtime evaluator, or
publishing workflow. The definition model currently lives in
`apps/shs-api/src/domain/mission-content/model/mission-definition.ts` and is
exercised by deterministic fixtures and domain tests.

> A Mission is a versioned content definition for an interactive scenario. It
> does not itself establish mastery, evidence, credentials, rewards, career
> readiness, or institutional truth.

## Authority Boundary

Mission owns reusable scenario structure: identity, version/status metadata,
family, audience, difficulty, role labels, objectives, optional stages,
declarative conditions, environment references, presentation/safety/accessibility
metadata, AI capability permission flags, and a non-authoritative runtime score
policy.

Mission does not own participant identity, execution state, official incident
facts, Curriculum linkage/completion, Career eligibility/readiness, Metaverse
maps or entry, Arcade Activity or Result semantics, mastery, Verified Evidence,
Truth Spine facts, Treasury/economic rewards, credentials, or AI execution
policy. Mission conditions describe possible runtime content rules; Phase 4A
does not evaluate them.

Curriculum, Career, Metaverse, Arcade Runtime, Verified Evidence, Truth Spine,
Treasury, Identity, and Agent Fabric remain separate authorities. No calls or
write integrations to those systems are introduced here.

## Existing Concepts and Non-Merges

- Metaverse City Missions are per-learner projections of Assignments,
  completion policy, access and location. They are not reusable content
  definitions.
- Metaverse Simulation Definitions are a static catalog bound to Metaverse
  Activity IDs and protected Metaverse runtime. They overlap structurally but
  keep their own location, entry, execution and catalog authority. Phase 4A
  neither replaces nor adapts them.
- Metaverse simulation sessions are execution state, not content definitions.
- Civic micro-lessons are local legacy content and their current completion
  helper writes local attestation/reward-shaped data. They are not used as
  Mission fixtures or authority.
- Agent Fabric Game Theory scenarios are strategic-analysis inputs, not
  playable mission content.
- IGLS-1 `MISSION_DEFINITION` release artifacts are governance/change-control
  records defining a package's purpose and authorization lifecycle, not
  interactive scenario content.
- Foundation pages use “mission” as organizational purpose text; those are not
  executable scenario definitions.
- Data Center curriculum content remains Curriculum content; the example
  Mission does not bind to a lesson or claim lesson completion.
- No separate canonical Fire/Public Safety or Healthcare incident-template
  registry was found in the inspected API domains.

These contracts must not be merged merely because they use words such as
mission, scenario, objective, stage, or simulation.

## Model

Mission identity is `missionId` plus positive integer `version`; `slug` is a
separate presentation identifier. Status values are `DRAFT`, `REVIEW`,
`PUBLISHED`, and `RETIRED`. The schema can represent a future immutable
published-version policy, but persistence and enforcement of that lifecycle are
deferred until a registry owner and publishing permission model are approved.

Families are `LEARNING`, `CLASSIC`, `WORKFORCE`, `CAREER_EXPLORATION`,
`SIMULATION`, `PUBLIC_SAFETY`, `HEALTHCARE`, `INFRASTRUCTURE`, `CREATOR_MEDIA`,
`LOGISTICS`, and `AUTONOMOUS_SYSTEMS`.

Objectives have stable IDs, one-based order, a bounded type, required flag,
description, scalar metadata, and one declarative completion condition. Stages
are optional; if present, their IDs/order and referenced objectives are
validated. Conditions use a closed operator vocabulary and typed operands.
Arbitrary JavaScript, expressions and code are not supported; no `eval` or
content-provided execution exists.

Success and failure conditions describe runtime scenario outcomes only. They
are not mastery or Curriculum completion rules. Difficulty is metadata, not a
learner competency judgment. Participant roles are scenario labels, not real
licenses or credentials.

Environment references are opaque references with a bounded system kind and
stable identifier. They do not carry map geometry or domain records. An
`arcadeActivityId` is optional and is never inferred; this contract validates
its identifier shape only and cannot prove that a referenced Activity exists.
Future integrations must resolve it through Arcade authority.

## Safety, Accessibility, AI, and Score

Accessibility fields describe support expectations and do not replace the
Accessibility Layer. Safety classification and sensitivity notes are content
metadata, not operational safety authority. AI flags declare whether a future
runtime may request a capability; they neither execute AI nor grant policy
permission. Any AI behavior must later pass Agent Fabric governance.

`runtimeScorePolicy` is limited to `NONE`, `POINTS`, `TIME`, or
`OBJECTIVE_WEIGHTED`. It is descriptive runtime metadata only. It does not
create canonical Arcade Result scores, leaderboard entries, reward values, or
Treasury transactions. No executable reward fields are permitted.

## Storage and API Decision

Phase 4A is schema/contract-first. No migration, database table, read/write
route, permission, CRUD API, or development inspector is added. Existing
Metaverse catalogs have their own domain-specific ownership and do not provide
a safe shared registry/publishing permission model. A persistent shared catalog
would therefore be a new authority decision, not a harmless storage detail.

There are no Mission API routes in 4A. A later registry proposal must specify
the owning domain, organization/publication scope, review permissions, immutable
published version behavior, retention, and adapters to other authorities before
adding persistence.

## Fixtures and Validation

The deterministic fixture set covers Learning, Classic, Public Safety,
Healthcare, and Infrastructure/Data Center families. They have no fabricated
Activity, Metaverse environment, Curriculum, Career, or incident identifiers.
They are draft contract examples, not published missions.

The validator fails closed for invalid enums, duplicate IDs, non-contiguous
ordering, missing/unknown objective and stage references, unsupported condition
types, negative time limits, malformed environment references, executable
content markers, oversized/non-scalar metadata, and fields explicitly outside
Mission authority (including mastery, evidence, credential, reward, identity,
Curriculum linkage, and map geometry).

Environment references use the closed field set `system`, `environmentId`,
`locationId`, and `sceneId`; unknown fields are rejected. Each condition type
also has a closed operand shape, and irrelevant operands fail validation.
`OBJECTIVE_COUNT` currently means a count threshold across completed objectives
and accepts only `count`; it does not identify a particular objective.

## Domain Boundaries

- **Curriculum:** owns lesson/course/unit relationships and completion. Mission
  has no lesson/course/unit fields.
- **Career:** owns pathways, readiness and eligibility. No Career score or
  eligibility is represented in Mission.
- **Metaverse:** owns maps, registry locations, entry and its City Mission and
  Simulation systems. Mission only allows opaque environment references.
- **Arcade:** owns Activities, Runtime Sessions, Attempts and Results. Mission
  may carry an explicitly resolved Activity reference, but does not create one.
- **Verified Evidence / Truth Spine:** own evidence interpretation and
  institutional truth. Mission has no evidence/truth claims or writes.
- **Treasury:** owns rewards and economy. Mission has no XP, money, token,
  wallet or reward entitlement fields.
- **Agent Fabric:** owns AI governance/execution. Mission flags are declarations
  only and no Agent Fabric call occurs.
- **Identity:** owns users and permissions. Mission roles are fictional
  participant roles, not identity roles.

## Phase 4B Mission Runtime

Mission Runtime is a separate execution authority for progress through one
Mission Definition version. It does not extend or replace Arcade Runtime
Session. A runtime may carry an explicit, owner/org/tenant-validated Arcade
Runtime Session reference; no relationship is inferred from learner, Activity,
or time. Arcade Runtime continues to own gameplay continuity, while Mission
Runtime owns content progression.

Phase 4A has no persisted Mission registry or authorized resolver. Accordingly,
the internal runtime service accepts only a server-supplied definition that
passes the Phase 4A validator and is marked `PUBLISHED`, then stores an exact
bounded snapshot with `missionId` and `missionVersion`. It never accepts a
client-supplied definition. There is no public start route or fixture-backed
registry in 4B. The internal `MissionRuntimeService.start(actor, definition, …)`
remains server-side only. A future HTTP start path must resolve
`missionId + version` to an authorized server-side published MissionDefinition,
validate and snapshot that exact definition, then start Mission Runtime. It
must never accept an arbitrary MissionDefinition from the browser. Exposing
that path requires an approved resolver and permission contract; a future
registry may supply the snapshot, but an existing runtime never follows a later
definition edit.

Runtime status is `ACTIVE`, `PAUSED`, `SUCCEEDED`, `FAILED`, `ABANDONED`, or
`EXPIRED`. Terminal states cannot resume; repeated ABANDON is idempotent.
Mutations use owner-scoped row locking plus `expectedRevision` compare-and-swap;
stale writes return `MISSION_RUNTIME_REVISION_CONFLICT` with `currentRevision`.
The persisted snapshot, objective/stage state, scalar runtime state, status,
revision, optional explicit Arcade Runtime Session reference, and timestamps
live in `mission_runtime_sessions`. Ordered declared runtime observations live
in `mission_runtime_events` with unique `(missionRuntimeId, sequence)`. Event
history is capped at 500 per runtime.

Objectives are `PENDING`, `ACTIVE`, or `COMPLETED`; their completion rules are
evaluated on the server. Stages are `LOCKED`, `ACTIVE`, or `COMPLETED`, retain
their declared optional flag, and advance in declared order only when required
objectives and exit conditions are satisfied. A stage made solely of optional
objectives must have an explicit exit condition to avoid a non-terminating
stage. `stage.optional` is preserved, but Phase 4B does not implement an
explicit `SKIPPED` transition. Later Mission authoring/runtime work must define
optional-stage bypass semantics before optional stages are used for branching
progression. The runtime state is a bounded (16 KiB), shallow JSON object limited to
scalar keys declared by the Mission's `STATE_EQUALS`/`STATE_THRESHOLD`
conditions. Sensitive keys and undeclared values fail closed.

The pure condition evaluator supports all seven Phase 4A condition types:
`OBJECTIVE_COMPLETE`, `OBJECTIVE_COUNT` (count across completed objectives),
`STAGE_COMPLETE`, `TIME_ELAPSED` (server `startedAt`), `STATE_EQUALS`,
`STATE_THRESHOLD`, and `EVENT_OCCURRED` (recorded Mission Runtime event only).
Only event types referenced by the validated snapshot are accepted; sequence
must be exactly next and events do not mutate Arcade Runtime lifecycle. Stage
time limits are evaluated against server timestamps when a mutation/read-path
evaluation occurs; there is no background expiration scheduler. If success and
failure conditions become true together, failure takes precedence.

Mission Runtime success is an operational execution state only. It does not
establish mastery, Evidence, credentials, rewards, Curriculum completion,
Career readiness, or institutional truth. The engine creates no Arcade
Attempt/Result, Evidence, Truth Spine fact, Treasury/reward, leaderboard score,
Metaverse state change, or Agent Fabric execution. Activity references and
environment references remain metadata only.

The internal service is owner-scoped by authenticated actor organization,
tenant, user, and existing `arcade.attempt` permission. There are no 4B HTTP
routes or frontend harness: without a canonical published-definition resolver,
a start API would either trust client content or invent a fixture registry.
The service is exercised by the Postgres-backed `mission-runtime.test.ts`.
Deferred work includes a publishing registry/workflow, development harness,
explicit Learning/Arcade outcome coordination, runtime telemetry bridges,
background expiry, and all 4C–4H capabilities. Arcade Runtime Session,
Curriculum, Career, Metaverse, Verified Evidence, Truth Spine, Treasury,
Identity, and Agent Fabric authorities remain separate and unchanged.

## Phase 4B.5 Published Mission Resolver / Start Authority

`POST /arcade/mission-runtimes` accepts only `missionId`, `missionVersion`, and
the optional `idempotencyKey` and `arcadeRuntimeSessionId` fields. Unknown body
fields fail validation, so Mission content such as definitions, objectives,
stages, conditions, status, scoring, AI policy, or environment references
cannot be injected by the caller. The route requires authenticated
`arcade.attempt` permission and delegates to a start orchestration service.

The start authority resolves the exact `missionId + missionVersion` through
the `PublishedMissionResolver` contract. There is no `latest` fallback. The
resolver validates catalog entries on registration and again on resolution,
returns only `PUBLISHED` entries, and returns an independent clone rather than
a mutable shared object. The runtime service validates the resolved definition
again and persists its exact snapshot. Unknown identity/version and DRAFT,
REVIEW, or RETIRED entries are unavailable (404); the client cannot override
status or publication state.

The current code-backed `ServerPublishedMissionCatalog` is intentionally
empty. Phase 4A fixtures remain DRAFT test fixtures and are not promoted to
production content. Tests inject explicitly published definitions through
the resolver abstraction and exercise the same route/start orchestration with
real Mission Runtime persistence. There is no registry table, publishing
workflow, or catalog read route in 4B.5. This temporary source may be replaced
in Phase 4D while preserving the resolver interface and exact-version
contract. Phase 4D owns publication, review, moderation, and immutable release
management.

Clients may request a published Mission by canonical identity and exact
version, but they may not submit or modify the MissionDefinition used to start
a Mission Runtime. The public start authority resolves
`missionId + version` to an authorized server-side published definition,
validates and snapshots it, and only then invokes Mission Runtime. The
optional Arcade Runtime Session reference is still checked against the same
authenticated owner and organization; it is never inferred or auto-created.
The start response omits the definition snapshot and internal user/tenant
scope. Starting a Mission still creates no Attempt, Result, mastery, Evidence,
Truth, reward, or leaderboard score; Learning outcome coordination remains
deferred to 4G.

## Deferred

Persistence and publishing, creator tooling, execution/evaluation, AI mission
directors, adaptive difficulty, multiplayer, seasons/leagues/tournaments,
reward/credential integrations, Metaverse orchestration, and adapters to
Curriculum/Career/Arcade are deferred. These require explicit owners and
authority-safe contracts in later phases.
