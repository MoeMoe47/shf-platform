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

## Phase 4C Mission Builder / Creator Studio

The Mission Builder at `/studio/missions` is an authoring surface inside the
existing Studio shell. It edits full 4A `MissionDefinition` drafts using
structured controls and server validation. Drafts are stored separately from
the Studio Website/AI Agent project workspaces and from the read-only
`PublishedMissionResolver` catalog. The draft table is
`mission_definition_drafts` (migration 153), scoped by organization, tenant,
and author. List responses are bounded to the author's 100 most recently
updated drafts; read and update are owner-scoped. There is no delete route.

The API uses existing Studio project create/view/update permissions plus the
`project_studio` organization entitlement. Because those existing permissions
also support student-owned Studio projects, the Mission draft service explicitly
rejects the `student` role. The UI applies the same check; API authorization is
the enforcement boundary. Author/update user IDs and timestamps are retained,
without exposing email addresses.

Draft status is server-forced to `DRAFT`, including when a submitted definition
claims another status. The complete definition is validated by the canonical
4A validator at every create/update and is bounded to 128 KiB serialized JSON.
Mission `version` identifies intended content; draft `revision` is a separate
database CAS counter beginning at 1. Updates require `expectedRevision`; stale
writes return HTTP 409 `MISSION_DRAFT_REVISION_CONFLICT` with
`currentRevision`. Mission identity and content version cannot be changed by
updating an existing draft. The UI offers an explicit reload after a conflict
and never silently merges or retries.

The Builder covers identity and basics, audience/roles, canonical Activity
reference, objective types and ordering, stage ordering and objective
membership, type-specific condition operands, score metadata, environment
references, declarative AI flags, and accessibility/safety metadata. Objective
and stage order can be changed with keyboard-operable Move Up/Move Down
controls. Optional stages are represented but bypass execution is not
implemented. The Activity selector reads existing canonical active Activities;
choosing one only stores a reference and does not create or change an Activity.
Environment references are entered as references only.

Client validation is not authoritative: server validation errors are surfaced
by field/path text. The preview is labeled `DRAFT PREVIEW`; there is no Play or
Launch action. Runtime score metadata does not create Result or leaderboard
authority. AI flags are declarations only; governed AI execution is not enabled
in 4C. The screen uses labeled controls, visible focus, 44px minimum control
targets, reduced-motion handling, and keyboard reorder controls.

There is no draft autosave, local-storage draft cache, publication control,
or direct Mission Runtime call. Phase 4D provides the review and release
handoff. The published resolver remains unchanged by draft operations. A
saved draft is not runtime-authorized, even if its identity/version matches a
published Mission.

**A saved Mission draft is validated authoring content only. It is not
published, approved, runtime-authorized, or institutional truth.**

## Phase 4D Mission Publishing, Versioning & Moderation

4D provides an organization/tenant-scoped lifecycle over Phase 4C drafts:
`DRAFT → SUBMITTED → APPROVED → PUBLISHED → RETIRED`. Rejection marks the
immutable review submission `REJECTED`; the associated draft remains editable.
Authoring uses existing `studio.project.update/view` permissions, reviewer
actions use `studio.review.queue.view` and `project.submission.review`, and
publication/retirement use the existing `curriculum.catalog.publish` and
`curriculum.catalog.retire` authorities. An author cannot approve their own
submission, including when permissions overlap. Publication is separate from
approval.

Submission snapshots the exact validated Mission Definition at the requested
draft revision. The review queue displays that frozen content, not a later
draft edit. `draftRevision` remains distinct from Mission `version`. Submitting
the same revision is idempotent; a newer edit requires a new submission.
Approval and rejection record actor/time/note and append operational
`mission_publication_events`. Rejection requires a bounded plain-text note.

Publishing revalidates the frozen snapshot and creates a distinct immutable
release with a server-owned `PUBLISHED` status. Unique organization/tenant,
Mission ID/version and source-submission constraints prevent replacement or
duplicate release creation. Publish retry returns the same release. The
`PublishedMissionResolver` abstraction is preserved and now reads only an
exact, validated, non-retired release scoped to the authenticated active
organization and tenant. Draft, submitted, approved-only, rejected, retired,
unknown, and wrong-version content remain unavailable to new runtime starts.

**A Mission becomes runtime-authorized only when an immutable published
release exists in the authorized Published Mission Resolver.** Approval alone
does not make a Mission runtime-authorized.

Retirement requires a plain-text note and separate publisher permission. It
changes only release availability/status; the definition snapshot and audit
history remain retained. New starts stop resolving a retired release. Existing
Mission Runtime sessions keep their original definition snapshot and status;
retirement does not terminate or rewrite runtime history. Changes require a
new Mission version rather than editing a release. Publication lifecycle audit
is operational governance history and does not write Truth Spine facts.

The author Builder exposes `Submit for Review` only for a saved current draft
revision and shows submitted revision/status separately from the current draft
revision. Reviewer routes are `/studio/missions/review`; release management is
`/studio/missions/releases`, whose publisher-only queue lists approved
submissions awaiting release. The review view renders frozen content as text,
with separate Approve, Reject, and permission-gated Publish actions. Retirement
requires a note and explicit confirmation. These screens do not expose draft
launch, Runtime mutation, Result/mastery, Evidence, Truth, rewards, or
Metaverse/Agent Fabric authority.

Migration 154 adds the review-submission, published-release, and publication
event records. Releases are organization/tenant scoped, not globally reusable.
The migration guard allows only migration 154 as an uncommitted migration and
continues to pass after it is committed; migrations 151–153 remain frozen.

**Approval alone does not make a Mission runtime-authorized. Retirement
prevents new starts but does not rewrite historical runtime state.**

## Phase 4E — Governed AI Mission Director

The Mission Director proposes bounded scenario actions. It does not directly mutate Mission Runtime state. All Mission Director proposals are deterministically validated before application. The Mission Director uses the frozen Mission Runtime definition snapshot.

Phase 4E uses a provider-neutral executor seam and deterministic executor. Live Agent Fabric execution remains deferred. Agent Fabric remains the AI governance boundary. Mission Runtime remains the operational Mission state authority.

An applied Director action and its `APPLIED` decision row are written in the same Mission Runtime transaction; if either fails, both roll back. `NO_OP`, `REJECTED`, and `FAILED` decisions do not mutate runtime state or revision and are recorded as standalone append-only rows. Idempotency keys are scoped to organization/tenant; reusing a key for a different runtime or expected revision is rejected with `MISSION_DIRECTOR_IDEMPOTENCY_KEY_REUSED` rather than reinterpreted. Decision rows (migration 155) reject `UPDATE` and `DELETE` and intentionally have no cascading link to runtime sessions so operational history outlives runtime cleanup.

The Phase 4E action vocabulary is limited to `NO_OP`, `EMIT_DECLARED_EVENT`, `SET_DECLARED_RUNTIME_STATE`, and `ESCALATE`. Runtime state keys and event types must already be declared by the frozen Mission Definition. Event injection additionally requires the existing `scenarioVariation` capability. Director execution requires `missionDirector`; other existing capability flags do not grant additional actions in this phase.

Mission Director provenance is operational audit data, not verified evidence or Truth Spine truth. Director orchestration does not create Results, evidence, credentials, mastery, career eligibility, rewards, Treasury changes, or institutional truth. Deterministic Mission Runtime operation does not require an AI provider.

## Phase 4F — Adaptive Scenario / Governed AI Characters

Phase 4F extends the Phase 4E pipeline; it is not a second AI system. Proposals still flow executor → deterministic Mission Director policy → Mission Runtime transaction → append-only `mission_director_decisions` provenance (policy version `mission-director-policy.v2`). No migration was added.

**Declarative envelope.** `MissionDefinition` gains three optional, closed, validated fields that freeze into `mission_runtime_sessions.definition_snapshot` like every other field. Definitions without them behave exactly as before.

- `difficultyProfile.tiers` — 2–5 tiers from the existing `MISSION_DIFFICULTIES` vocabulary; must include the Mission's catalog `difficulty`, which is the default tier.
- `characters[]` — `characterId`, `displayName`, `characterType` (`INSTRUCTOR`, `SUPERVISOR`, `TEAMMATE`, `CUSTOMER`, `PATIENT`, `WITNESS`, `DISPATCHER`), `simulatedRole`, `allowedBehaviors` (`SPEAK`, `OBSERVE`, `REQUEST_ACTION`), `knowledgeScope` (`CURRENT_STAGE`, `MISSION_ONLY`), `dialogueMode` (`NONE`, `SCRIPTED_ONLY`, `BOUNDED`), authored `scriptedLines`, authored `scenarioFacts`, `availableStageIds`, optional `environmentId`.
- `scenarioBranching` — `defaultBranchId` plus 2–8 `branches` with `availableDuringStageIds`.

**Actions.** `ADAPT_DIFFICULTY` (requires `adaptiveDifficulty`), `SELECT_SCENARIO_BRANCH` (requires `scenarioVariation`), and `CHARACTER_SPEAK` / `CHARACTER_OBSERVE` / `CHARACTER_REQUEST_ACTION` (require `npcDialogue` plus the character's declared behavior, dialogue mode and stage availability). Every action additionally requires `missionDirector`. Declaration checks run once in the policy and again in Mission Runtime against the row-locked snapshot.

**Runtime semantics.** Tier and branch are runtime-managed state keys (`mission.difficultyTier`, `mission.scenarioBranch`) seeded at start to the deterministic defaults. Mission Definitions may reference them only through `STATE_EQUALS` on declared values, so branches act through the one existing condition engine. Learner routes and the generic `SET_DECLARED_RUNTIME_STATE` action cannot write the `mission.*` prefix. Every applied action appends a runtime-owned event (`MISSION_DIFFICULTY_ADAPTED`, `MISSION_SCENARIO_BRANCH_SELECTED`, `MISSION_CHARACTER_*`). Definitions cannot declare those event types, so learners cannot forge them, and runtime history stays replayable. If a time limit elapses during an apply, the action is rejected rather than recorded as `APPLIED`.

Adaptive difficulty selects only among options declared by the immutable MissionDefinition.

AI characters are Mission-scoped simulated participants, not human identities or institutional authorities. They are never Identity users, memberships, or agent identities. Every character event carries `simulated: true`. In Phase 4F all character actions are identifier-only: `CHARACTER_SPEAK` selects a declared `lineId`, `CHARACTER_OBSERVE` a declared `factId`, and `CHARACTER_REQUEST_ACTION` a declared `objectiveId`. Mission Runtime resolves authored text from the frozen snapshot when it writes the event. Generated free-text dialogue is rejected (`CHARACTER_GENERATED_DIALOGUE_DEFERRED`) until a character-scoped executor context exists; `dialogueMode: "BOUNDED"` is a declaration for that future phase and today only permits scripted lines. Healthcare, public-safety, and non-`GENERAL` Missions may declare only `SCRIPTED_ONLY` dialogue.

AI character actions are bounded proposals validated by deterministic server policy.

Character memory is bounded to the Mission Runtime session.

**Executor boundary.** The Director builds two contexts from the frozen `definition_snapshot`. The *internal* context keeps the full snapshot and is used only by server-side policy; Mission Runtime separately re-validates against the row-locked snapshot. Executors receive only a closed `MissionDirectorExecutorContext`:

- runtime identifiers, revision and status, plus capabilities
- active stages and their objectives
- runtime state
- recent non-character events
- the current difficulty tier and allowed tiers
- branch IDs, labels and current availability
- a **character directory**

The directory lists each available character's ID, name, type, simulated role, allowed behaviors, knowledge scope, dialogue mode, opaque `scriptedLineIds` and `scenarioFactIds`, and a content-free `interactionCount`. The shared executor never sees any character's line text, fact text, dialogue history or knowledge-stage content, so it cannot base one character's action on another character's private declarations. Using another character's ID is rejected server-side. Knowledge scope is enforced server-side: a `CURRENT_STAGE` character's requests are limited to active stages it may appear in. The executor never receives the raw definition, organization, tenant or learner identifiers, future-stage content, branch descriptions, or unavailable characters. A decision's `context_digest` is the SHA-256 of exactly this executor-visible projection, so it shows what information produced the proposal without storing it.

Scenario branches must be declared by the MissionDefinition; AI cannot invent new branches.

Accessibility and accommodation authority cannot be overridden by adaptive difficulty or AI character behavior. Difficulty tiers are labels with no timing, caption, motion, input or reliance parameters, and no action can change the frozen `accessibility` block or stage time limits. Mission Runtime does not yet receive learner accommodations; that link is a future, explicitly authorized integration.

Difficulty, dialogue, and branch selection do not by themselves constitute verified evidence or institutional truth.

**Deterministic fallback.** Missions run at the default tier and branch with no AI. Scripted lines are authored content. Executor outages are recorded as `FAILED` decisions and leave the runtime untouched.

## Phase 4G — Learning ↔ Metaverse Mission Integration

Curriculum teaches.
Learning Arcade provides practice and mission experience.
Mission Runtime owns Mission state.
MOL supplies world context.
Metaverse domain engines own their own simulation facts.
Evidence Engine determines valid Evidence.
Truth Spine receives only verified reportable facts.
Accessibility/Accommodation remains a separate authority.
Agent Fabric governs AI execution.
Metaverse context may influence a Mission; it does not become Mission authority.

**Audit summary.**
- **Learning chain.** Curriculum-catalog owns lesson ↔ Arcade Activity links (`curriculum_lesson_arcade_activities`), and `MissionDefinition.arcadeActivityId` references an Arcade Activity.
- **MET-7 City Missions.** These are read-time projections of canonical *Assignments* into the Metaverse (Assignment → completion-policy requirement or lesson link → Arcade Activity). They are a separate concept from Phase 4 Mission Runtime.
- **Evidence path.** An authoritative source row plus an org-registered evidence rule goes through `projectAuthoritativeFact`, which writes `prepare_prove_evidence` and, if the rule allows, a truth fact. That service is **frozen** by the governance guards in `tests/arcadeCanonicalHistory.test.mjs` and `tests/arcadeLegacyHistoryTruthQuarantine.test.mjs`.
- **Accommodations.** There are two authorities: `accessibility_accommodation_cases`/`_requirements` (migration 141, a sensitive request → review → approval → activation lifecycle) and `authorized_accommodations` (migration 057, ACTIVE/REVOKED grants of four closed types). Learner preferences (`user_accessibility_profiles`, migration 056) are separate and presentation-only.
- **MOL location.** MOL exists only as a client-side, in-memory library.

**Contract.** A Mission opts in with `metaverseContext`, which declares:
- `scenarioId` (an approved MOL scenario)
- `requiredCapabilities` and `optionalCapabilities` (`TRAFFIC_CONTEXT`, `WATER_CONTEXT`, `WEATHER_CONTEXT`, `INCIDENT_CONTEXT`, `POWER_CONTEXT`, `DATA_CENTER_CONTEXT`, each mapped to one MOL system)
- `allowSimulatedContext`
- `requiredUnavailablePolicy` (`BLOCK_START` | `START_DEGRADED`)

The existing `environmentRefs` gain an optional `required` flag; there is no new environment field. Execution levels (STANDALONE / HYBRID / LIVING) stay documentation-only, because every provider is SIMULATED.

**Server-side MOL.** `mission-runtime/world/mol-bridge.ts` imports the same pure MOL modules the client uses: there is one source of truth and no second engine. Each runtime's world context is the bound approved scenario, re-derived deterministically (seed = runtime id, timeline anchored at runtime start). It is labeled SIMULATED, never live.

**Frozen vs live.**
- **FROZEN:** captured once as `MISSION_WORLD_CONTEXT_CAPTURED`, a runtime-owned event inside the start transaction.
- **LIVE:** recomputed on demand by `MissionRuntimeService.getWorldContext` and never stored.
- **Markers:** every value carries `contextKind`, `freshness` (CURRENT / STALE / SOURCE_UNAVAILABLE) and `simulated`. Capability status is AVAILABLE / DEGRADED / UNAVAILABLE / SIMULATION_NOT_PERMITTED, and the provider mode is preserved.

**Start rules.**
- A required environment ref that fails to resolve, or an unapproved scenario, always blocks start.
- A required capability outage follows the declared policy.
- Optional outages degrade without fabricating state.
- A SIMULATED provider without explicit permission is treated as unavailable; there is no silent fallback.
- MOL can never start a Mission; start remains published Mission → start authority → Mission Runtime.

**Events.** Only events from usable declared capabilities that share the runtime's correlation chain, or touch the Mission's environment dependency set, are referenced. They are stored as bounded references (`molEventId`, type, source, authority, provider mode, `occurredAt`, correlation, causation, relevance) and never as copied bodies.

**AI.** The Director executor receives only a minimal LIVE summary (`worldContext`: condition rows, unavailable and degraded capability names). It never receives raw MOL state, event references, correlation IDs or accommodation data, and the frozen projection events are hidden from executor `recentEvents`.

**Accommodation.** The accommodation domain owns `getMissionAccommodationProjection`, which reads only ACTIVE `authorized_accommodations` inside their effective window. It projects closed **requirement** flags:
- `timingAdjustmentRequired` (EXTENDED_ASSESSMENT_TIME)
- `breakAccommodationRequired` (ADDITIONAL_BREAKS), kept distinct from extended time
- `alternatePresentationRequired`
- `alternateInputRequired`
- `timingPolicy: null`

It never projects the stored `value`, case data, notes, reviewers or identifiers. The projection is frozen at start as `MISSION_ACCOMMODATION_PROJECTED` and is never sent to MOL or the Director executor.

The audit found no validated normalized timing policy: no canonical multiplier, no extra duration, no break/pause policy, and no service that computes effective timing. `authorized_accommodations.value` is copied unvalidated from requirement payloads, and the `accommodation-value.ts` validator referenced by migration 057 does not exist. Therefore:

The authoritative accommodation requires timing adjustment, but Phase 4G does not execute timing semantics until the accommodation domain exposes a validated normalized timing policy.

Mission Runtime never infers one. Extended time is not unlimited time, and additional breaks do not disable expiration. Stage time limits, objectives and mastery rules behave exactly as without accommodation.

**Evidence.** `describeMissionEvidenceCandidate` describes a candidate only: a SUCCEEDED runtime with learner actions, plus provenance (objectives, learner action refs, world-context event IDs, and `assessmentConditions: { timingAccommodationPresent, timingAdjustmentApplied: false }`, which states only what was recorded versus applied). The frozen verified-evidence authority does not yet accept `MISSION_RUNTIME_RESULT`, so `addressableByEvidenceAuthority: false`. Registering it is a separate, governed Evidence-authority change. Presence, context reads and world events never produce Evidence, and no Mission or MOL path writes Truth.

**Learning Arcade.** `PersistedPublishedMissionResolver.listPublishedMissionsForArcadeActivity` resolves published, org-scoped Missions for an Arcade Activity by reference. Retired releases are excluded. Starting still uses the canonical start path.

**Persistence.** No migration. Frozen projections fit existing `mission_runtime_events`, and live context is computed.

## Phase 4H — Integrated Phase 4 Acceptance

Phase 4 provides a reusable Mission Platform.

New programs should integrate through Mission, MOL, Evidence and registry contracts rather than creating course-specific infrastructure.

**Accepted flow.** These run as one journey in `apps/shs-api/tests/mission-phase4-integrated-acceptance.test.ts`, plus `tests/metaverseMolPhase4Integration.test.mjs` on the root side.
1. A curriculum lesson links to a canonical Arcade Activity.
2. The Activity resolves to published Missions (lookup by reference only).
3. A Mission is published through the HTTP draft → submit → approve → publish workflow.
4. The canonical start authority starts the exact `(missionId, version)`, with no latest fallback.
5. The release snapshot is frozen into the runtime.
6. Frozen MOL world context and the minimum-necessary accommodation requirements are recorded in the start transaction.
7. LIVE world context is recomputed separately.
8. The Director sees only its minimized, digest-bound projection.
9. Adaptive difficulty, scenario branching (observed by the canonical condition engine) and two isolated governed characters all run.
10. The learner's canonical event completes the Mission.
11. An evidence candidate is described, never Evidence.
12. An auditor reconstructs publication history, frozen definition, frozen MOL chain, runtime events, Director decisions and provenance. Replay duplicates nothing and calls nothing external.
13. After retirement, existing runtimes continue on their frozen snapshot.

**Authorities.**

| Authority | Owns | May read | May request | May not control |
|---|---|---|---|---|
| Curriculum | Lessons, lesson ↔ Arcade links | — | — | Missions |
| Mission Content | Drafts, review, releases | Arcade Activity IDs | — | Runtime state |
| Mission Runtime | Session, state, revision, events | Frozen snapshot, MOL contract, accommodation projection | — | MOL, engines, Evidence, Truth, accommodation grants |
| Mission Director | Decision ledger | Internal frozen context | Bounded actions via Mission Runtime | Runtime rows directly, Evidence, Truth |
| MOL | Coordination log/projections (in-memory) | Its own events | Record-only requests | Missions, learners, engines |
| Accommodation | Cases, grants | — | — | — (exposes a read-only projection) |
| Agent Fabric | AI execution | — | — | — (executor seam only; no live calls in Phase 4) |
| Evidence / Truth | Evidence, truth facts | — | — | — (frozen; Missions never write them) |
| Identity / Career | Users, memberships, careers | — | — | — (NPCs and MOL systems create no identities) |

**Persistence.**
- **Persisted:** drafts (`mission_definition_drafts`); review submissions and frozen review snapshots; immutable releases and append-only publication events; runtime sessions with the frozen definition snapshot; runtime events, including the frozen `MISSION_WORLD_CONTEXT_CAPTURED` and `MISSION_ACCOMMODATION_PROJECTED`; and append-only Director decisions (migration 155).
- **Computed only:** LIVE world context, MOL world state/graph/replay (client in-memory, server deterministic re-derivation), executor projections, and the evidence-candidate description.

**Simulation status.** Every Metaverse provider is SIMULATED or UNAVAILABLE. No live engine exists, and nothing in Phase 4 claims live city integration.

**Evidence and Truth limitations.** The verified-evidence authority is frozen and does not accept `MISSION_RUNTIME_RESULT` (`addressableByEvidenceAuthority: false`). Completing a Mission writes no Evidence, Truth, credential, mastery or career row. Making Mission results Evidence requires a separate, governed Evidence-authority change.

**Known limitations (non-blocking).**
- The accommodation timing policy is not executed until the accommodation authority validates one.
- The Arcade Activity lookup lists published Missions without checking current startability (for example, a Mission that forbids simulation while only simulated providers exist).
- There is no learner-facing HTTP route for world context.
- There is no Builder UI for 4F/4G fields.
- MOL has no durable server log.
- The command center is a diagnostic surface with in-memory sessions only.

**Deferred to Phase 5+.** Multiplayer and team Missions, Arcade Integration Fabric, Program Packages, the Universal Event Registry, the full MOCC, live engines and live Agent Fabric execution.

**MOCC forward compatibility.** Verified by test, with no MOCC features built:
- The versioned MOL event contract can evolve into a Universal Event Registry.
- System Registry entries already declare publish, consume, request, state and dependencies.
- Dependency impact and replay timelines are structured data.
- MOL references the canonical destination registry and shared coordinate families instead of copying them, so Phase 4 adds no competing map, coordinate, destination or route authority. The existing Quick Map / Mini Map remains the spatial surface.
- **Future roadmap items:** a durable server-side MOL log, and a read-only operational Mission-state projection for operators.

## Phase 5 — Multiplayer / Team Missions

Mission Runtime remains the canonical Mission state authority.

Multiplayer coordinates participants; it does not create a second Mission authority.

Team performance does not automatically establish individual learner evidence.

**Audit.**
- The repo has no WebSocket, Socket.IO or Redis. One authenticated SSE stream exists (Studio collaboration).
- MET-6 presence is city-wide social presence, so Mission presence is a separate, mission-scoped concept.
- Studio/project teams are persistent project authority. MET-13 team simulations reuse them read-only.
- No Mission-scoped team, participant or role concept existed, so these are new, bounded to one runtime.

**Authorities.**
- **Identity** owns users and memberships.
- **Mission Runtime** owns lifecycle, revision/CAS, objectives, stages, canonical events and the result.
- **Multiplayer** (`apps/shs-api/src/domain/mission-team`) owns team membership, mission participation roles, readiness and ephemeral presence.
- **MOL** owns world coordination only. **Evidence**, **Curriculum** and **Career** are unchanged.

**Transport.** Server-authoritative commands with polling reads (`/arcade/mission-runtimes/:runtimeId/team…`). Every route is a thin wrapper over `MissionTeamService`, so SSE (the existing Studio pattern), WebSocket, mobile or Metaverse clients can be added later without moving authority.

**Model (migration 156).**
- `mission_teams` — one per runtime (SINGLE_TEAM only); cascades with the runtime; statuses FORMING, ACTIVE, COMPLETED, DISBANDED.
- `mission_team_participants` — composite FK to `users(organization_id, user_id)`, so cross-org membership is impossible; one row per user per team; statuses JOINED, LEFT, REMOVED; `ready`.
- `mission_team_events` — ordered team-lifecycle history related to runtime revisions.

Presence (ONLINE / AWAY / DISCONNECTED) is in memory, mission-scoped, expires after 90 seconds, and is never persisted.

**MissionDefinition.**
- `multiplayer` declares `minParticipants`/`maxParticipants` (system maximum 8), `teamMode` (SINGLE_TEAM), declared `roles` (`roleId`, `label`, `required`, `maxParticipants`), and `lateJoinPolicy` (default NONE).
- Missions without the block are single-player and unchanged.
- Mission role ≠ platform role: roles grant no RBAC, organization, instructor, Evidence or governance permission.

**Lifecycle.**
1. The canonical published start is unchanged.
2. The runtime owner forms the team around the ACTIVE runtime and becomes host.
3. Participants join with a declared role. The service validates org/tenant, capacity, role seats, lifecycle and late-join policy under a team row lock.
4. Participants declare readiness.
5. The host activates only when the minimum size is met, every required role is filled, and every joined participant is ready. Presence never implies readiness, and readiness never implies authorization.
6. The team completes when the runtime reaches a terminal state.

Leave is idempotent; the host disbands instead of leaving. A removed participant cannot rejoin. A disconnect never removes membership or role; reconnecting reuses the same membership row.

**Actions and conditions.**
- In a team Mission, learner actions are accepted only as team actions. The participant and role come from server state.
- Mission Runtime appends them as canonical events carrying server-set attribution (`payload.participant`: `participantId`, `missionRole`, `actionKey`, `attributedBy`), under the same row lock and CAS.
- The single-player append path rejects team Missions, and both paths reject supplied attribution.
- `ROLE_EVENT_OCCURRED { eventType, missionRole }` is one more case in the one condition engine. World, Director-emitted and character events carry no attribution, so they cannot satisfy it.

**Concurrency and idempotency.**
- Simultaneous actions resolve through runtime CAS: exactly one lands, and the other fails safely as stale.
- A retry with the same participant and key returns the original event, even with its original now-stale revision. Reusing a key for a different action is rejected.
- Joins race safely under the team lock. Team creation, join, ready and leave are idempotent by state.

**Director.** The executor receives `team: { teamStatus, teamSize, rolesPresent, readyCount }`. Team actions in its recent events keep only `missionRole`, with no participant IDs, user IDs or accommodations. AI cannot change membership or roles.

**Evidence.**
- The candidate is `TEAM_PERFORMANCE` with `individualEvidenceInferred: false`, plus each participant's own attributed action counts.
- No Evidence, Truth, credential, mastery or career rows are written.
- Phase 5 also fixed a defect that existed since 4E. Director-emitted declared events now carry a server-set `emittedBy: "MISSION_DIRECTOR"` marker that learners cannot supply. They are never counted as learner actions, so a Director-completed run is not a learner evidence candidate.

**Privacy and accessibility.**
- Team views show participant IDs, mission roles, readiness and presence only: no user IDs, emails, profiles, accommodation data or runtime-owned projections.
- Accommodation projections stay with the runtime owner and never reach teammates, MOL or AI.
- Participants' own accommodations are not projected in Phase 5 (limitation).

**MOL / MOCC.** `MissionTeamService.operationalProjection` provides team status, Mission status, participant count, role distribution, presence summary and canonical environment references, with `missionAuthority`, `membershipAuthority`, `containsLearnerIdentity` and `containsAccommodationData` all `false`. It's read-only and adds no new location registry. Future MOCC views can render active teams from it without gaining authority.

**Known limitations.**
- Presence is process-local.
- Only SINGLE_TEAM is supported.
- There is no developer harness UI (the API and tests cover the flow).
- No time-limit pause while a team is FORMING.
- Participant accommodations are not projected.
- Display names are deliberately omitted.

**Deferred.** Multi-team Missions, matchmaking, discovery, social features, chat/voice, tournaments, spectators, realtime push, and AI or NPC participants.

## Phase 6 — Arcade Integration Fabric

Learning Arcade and Classic Arcade share platform infrastructure but remain separate product authorities.

Arcade Integration Fabric coordinates integrations; it does not absorb the authority of connected systems.

**Audit.**
- Product type reuses the existing Arcade family vocabulary (`learning` | `classic`, migration 149). Its CHECK already makes a Classic runtime session unable to bind an Arcade Activity.
- The canonical shared contract is the existing Arcade Experience Descriptor (`src/shared/arcade/experience`). Phase 6 extends it and does not replace it. No server-side experience registry, new table or migration was added.
- `arcade_activities` stays the global Learning activity registry. Curriculum keeps its lesson ↔ activity link table.
- Leaderboards exist only for Learning (per activity, org-scoped). There is no achievement store and no treasury.
- Classic Arcade has no server-side score authority.

**Descriptor extensions (all optional; absent ⇒ unchanged behavior).**
- `capabilities.missionLaunch`, `capabilities.replay`, `capabilities.achievementEligible`.
- `relationships.mission {relationshipType, missionReferences:[{missionId, missionVersion}]}`. These are exact versions, and `missionLaunch` requires a Learning activity.
- `provenance.source` ∈ SYSTEM | INSTRUCTOR | AUTHORIZED_CREATOR | PARTNER. This records origin only; publishing stays with Studio/Mission publication.
- `accessibility.supports`: declared boolean support flags only, never learner accommodation data.

A curriculum relationship stays prohibited on the descriptor; Curriculum is read through its own link table.

**Fabric** (`apps/shs-api/src/domain/arcade-integration`).
- `arcade-experience-bridge.ts` imports the shared descriptor catalog (no server copy).
- `ArcadeIntegrationService` derives normalized capabilities: MISSION_LAUNCH, MULTIPLAYER, LEADERBOARD, ACHIEVEMENTS, CAREER_LINK, CURRICULUM_LINK, EVIDENCE_CANDIDATE, METAVERSE_CONTEXT, CREATOR_AUTHORED, REPLAY. Consumers check capabilities, never routes or product names. EVIDENCE_CANDIDATE, CURRICULUM_LINK and MISSION_LAUNCH are never derived for Classic.
- The Fabric persists nothing and owns no event bus, map registry, telemetry log, table or migration.

**Routes** (guarded by `arcade.attempt`; org, tenant and identity always come from the authenticated actor):
- `GET /arcade/integration/experiences/:id` resolves the canonical activity reference with read-only projections (curriculum lesson ids and titles only, published Mission references, career references, metaverse references, accessibility support flags, provenance with `grantsPublishingAuthority:false`). It contains no learner identity.
- `GET …/:id/capabilities`.
- `POST …/:id/launch`:
  - `mode: ARCADE_SESSION` delegates to Arcade Runtime.
  - `mode: MISSION` requires MISSION_LAUNCH, a declared Mission, and the exact declared version. It then delegates to the canonical `MissionRuntimeStartService` (no latest fallback; idempotent with the direct start). Multiplayer stays with the Phase 5 team routes on the resulting runtime.
- `GET /arcade/integration/runtimes/:kind/:id` returns `ArcadeIntegrationRuntimeRef {runtimeKind, runtimeId, experienceId, arcadeActivityId, productType, status}`. It reads owner-scoped through the owning runtime service.
- **Mission Runtime classification.** Mission Runtime carries no Arcade product classification: `MissionDefinition.family` is Mission Content's own taxonomy, and `arcadeActivityId` is an optional reference. A Mission Runtime is addressable through the Fabric only when exactly one canonical Learning descriptor establishes the link, meaning:
  - the same `arcadeActivityId` as the frozen definition;
  - the MISSION_LAUNCH capability;
  - the exact `missionId`/`missionVersion` declared.

  Any other Mission Runtime (no activity, no matching descriptor, a Classic descriptor, or an ambiguous link) returns `RUNTIME_NOT_FOUND` and is never labeled `learning`. Launch checks the same link before the canonical start, so the Fabric never creates a runtime it cannot classify.
- `GET /arcade/integration/results/:kind/:id` returns a bounded result projection that keeps COMPLETION, SCORE, TEAM PERFORMANCE, INDIVIDUAL ACTIONS and LEARNING EVIDENCE CANDIDATE separate:
  - Missions and runtime sessions have no score (`value:null`); no score is ever invented.
  - Only a canonical Learning Arcade Result carries an authoritative score and mastery, from the activity's deterministic rule.
  - Classic results are never learning Evidence.
  - A team result is TEAM_PERFORMANCE. Individual actions are the server-attributed participant actions; Director-emitted events never count.
  - Every evidence candidate is `isVerifiedEvidence:false`. Only the frozen verified-evidence authority decides, through its existing ARCADE_RESULT source.
- `GET /arcade/integration/operations` is the MOCC read-only, aggregate, learner-agnostic projection. It has no commands.

**Eligibility.**
- **Leaderboard** requires the LEADERBOARD capability and an authoritative score.
- **Achievement** requires the ACHIEVEMENTS capability and completion. It is Arcade-native eligibility only (no store yet) and is never a credential, certificate, Evidence or career readiness.

**Degraded handling.**
- Optional reads (Career, Curriculum links, published-Mission lookup, team counts) return `status: UNAVAILABLE`. Unknown is never reported as false, and no data is fabricated.
- Required launch dependencies fail explicitly with `DEPENDENCY_UNAVAILABLE` (503).
- Stable error codes: ACTIVITY_NOT_FOUND, ACTIVITY_NOT_LAUNCHABLE, CAPABILITY_NOT_SUPPORTED, DEPENDENCY_UNAVAILABLE, MISSION_NOT_PUBLISHED, MISSION_VERSION_MISMATCH, TENANT_SCOPE_MISMATCH, MULTIPLAYER_NOT_ALLOWED, EVIDENCE_NOT_ADDRESSABLE, RUNTIME_NOT_FOUND, LAUNCH_INVALID.

**Telemetry.** Operational observation only, mapped onto existing records (Arcade runtime sessions, Arcade Results, Mission Runtime events, team history). It is not Evidence, Truth or billing.

**Acceptance.** `apps/shs-api/tests/arcade-integration-fabric.test.ts` covers:
- the Learning reference flow (lesson → activity → Fabric → published Mission → canonical start → team → MOL context → actions → completion → result → candidate → career projection → replay ref → eligibility);
- the Classic reference flow (resolution → runtime → result → eligibility, with no curriculum or Evidence claims);
- cross-org isolation, degraded handling and a zero-residue cleanup proof.

## Deferred

Mission version derivation, richer moderation policy, creator collaboration,
execution/evaluation, AI mission directors, adaptive difficulty, multiplayer,
seasons/leagues/tournaments, reward/credential integrations, Metaverse
orchestration, and adapters to Curriculum/Career/Arcade are deferred. These
require explicit owners and authority-safe contracts in later phases.
