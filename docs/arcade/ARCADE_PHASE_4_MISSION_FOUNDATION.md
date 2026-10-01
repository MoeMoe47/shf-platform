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

## Deferred

Persistence and publishing, creator tooling, execution/evaluation, AI mission
directors, adaptive difficulty, multiplayer, seasons/leagues/tournaments,
reward/credential integrations, Metaverse orchestration, and adapters to
Curriculum/Career/Arcade are deferred. These require explicit owners and
authority-safe contracts in later phases.
