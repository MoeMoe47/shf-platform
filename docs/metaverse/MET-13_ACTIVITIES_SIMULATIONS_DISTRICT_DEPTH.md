# MET-13 Activities, Simulations + District Depth

## Executive Result

MET-13 deepens the Silicon Heartland city with a canonical, reusable simulation/activity runtime, and a source-backed simulation catalog covering all nine MET-2 districts, without inventing curriculum, assignment, assessment, mission, evidence, career, project, team, or enterprise authority.

Every simulation's `activityId` resolves 1:1 to a real MET-2 `MetaverseActivity`, so runtime entry continues through the unmodified MET-3 unlock projection and MET-5 protected entry service. Ten simulations are catalogued: four flagship, multi-step simulations (Data Center Operations, AI Agent Build/Test, Student Enterprise Service Delivery, City Infrastructure & Budget Tradeoff) and six standard-depth district simulations. No career pathway or program enrollment is required for any simulation unless the simulation itself is grounded in an existing pathway record (Data Center Operations, Career Pathway Exploration Scenario).

## Repository Baseline

- Repository: `/Users/mikeslate/Projects/shrv1`
- Branch: `studio-v1-plus-development`
- Baseline HEAD: `b0e928660cf1ed817df0431e2cd0d6792804e8d2` ("feat(metaverse): add student enterprise system")
- MET-2 registry: `apps/shs-api/src/domain/metaverse/registry/city-registry.ts`
- MET-3 unlock: `apps/shs-api/src/domain/metaverse/unlocks/`
- MET-5 runtime/entry: `apps/shs-api/src/domain/metaverse/runtime/metaverse-entry-service.ts`

## 1. Authority Reuse Map

| Concern | Canonical owner | MET-13 usage |
| --- | --- | --- |
| District/facility/activity identity | MET-2 `city-registry.ts` | Every `SimulationDefinition.activityId` resolves to a real `MetaverseActivity`; validated by `validateSimulationRegistry()`. |
| Learner unlock decision | MET-3 unlock projection (via `MetaverseEntryService`) | `SimulationSessionService.decideEntry()` calls the same entry service every other metaverse resource uses; no second unlock check exists. |
| Protected entry / org isolation / identity derivation | MET-5 `metaverse-entry-service.ts` | `organization_id`/`tenant_id`/`user_id` used for every DB read/write are the values the entry decision derived from `req.user`, never request-body values. |
| Curriculum/lesson content | `src/content/lessons/data-center-foundations-student/` | `sourceType: CURRICULUM_LESSON`, `sourceRef` on Data Center Operations. |
| Career pathway | `docs/career/records/DATA_CENTER_AI_INFRASTRUCTURE.pathway-record.json` | Read-only `careerPathwayId` reference; never required, never mutated. |
| Team membership | `studio_team_members` (migration 082) | `SimulationTeamAdapter` reads active membership only; client cannot self-declare a team id. |
| Evidence/assessment/credential authority | `prepare_prove_evidence`, canonical completion-policy domains | `simulation-evidence-adapter.ts` only *describes* a boundary (`isVerifiedSkill: false`, etc.); it never writes to a verified-evidence, portfolio, or credential table. |
| Work Passport projection | MET-10 `passport-projection-service.ts` | New `SIMULATION_EXPERIENCE` claim type and `simulationActivity` source loop; projects `EVIDENCE_CANDIDATE`/`ACTIVITY_COMPLETED`, never `VERIFIED_SKILL`. |
| City Orchestration | MET-11 `city-orchestration-service.ts` | Untouched. `simulation-orchestration-adapter.ts` is an additive surface (`/metaverse/simulations/orchestration`) built from the same catalog, not a merge into MET-11's own arrays (documented P1 below). |
| Student Enterprise | MET-12 `enterprise/` domain | Enterprise Service Delivery simulation references a learner's real enterprise/team context by `sourceRef`; it does not read or write enterprise tables directly and creates no employment/legal-entity claim. |
| Arcade | Arcade domain (external to metaverse) | Mission Prep Drill is practice-only and never writes to or reads Arcade's own result/mastery tables. |
| Market/Treasury | MET-9 market/treasury domains | Pricing & Resource Allocation Exercise is entirely simulated figures; no Market listing, order, or Treasury balance is read or written. |
| Operational telemetry | `observability/operational-telemetry.ts` (same sink as `unlock-authority-adapter.ts`) | `simulation-event-adapter.ts` emits `simulation.*` events through the existing sink; no second event bus. |
| Permission model | `SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW` (reused from MET-7 mission routes) | All simulation routes reuse this permission key rather than inventing a new one; per-simulation access is enforced separately by the entry decision, not by the permission check alone. |

No new identity, organization, curriculum, assignment, assessment, mission, evidence, career, project, team, enterprise, market, Treasury, or civic authority was created.

## 2. Canonical Simulation Model

`apps/shs-api/src/domain/metaverse/simulations/model/simulation-contract.ts` defines `SimulationDefinition` with exactly the fields the MET-13 brief called for (`simulationId`, `activityId`, `title`, `summary`, `districtId`, `facilityId`, `simulationType`, `sourceType`, `sourceRef`, `programId` (optional), `careerPathwayId` (optional), `lessonId`, `assignmentId`, `missionProjectionId`, `difficulty`, `participationMode`, `prerequisites`, `objective`, `instructions`, `taskSteps`, `retryPolicy`, `completionRules`, `evidenceOutputs`, `assessmentBoundary`, `careerConnection`, `programConnection`, `teamMode`, `accessibleAlternative`, `estimatedMinutes`, `status`, `tags`), plus `isFlagship` to mark the four flagship entries. `programId`/`careerPathwayId` are typed `string | null` and never validated as required.

## 3. Simulation Types

`SIMULATION_TYPES` implements the full bounded taxonomy from the brief (`TECHNICAL_SIMULATION`, `PROJECT_SIMULATION`, `TEAM_CHALLENGE`, `SCENARIO`, `DESIGN_CHALLENGE`, `OPERATIONS_SIMULATION`, `CIVIC_SIMULATION`, `BUSINESS_SIMULATION`, `ARCADE_CHALLENGE`, `PROGRAM_ACTIVITY`, `SIDE_MISSION_ACTIVITY`, `SHOWCASE_ACTIVITY`). Ten of the twelve types are used by the current catalog; `PROGRAM_ACTIVITY` and `SHOWCASE_ACTIVITY` are declared but not yet assigned to a catalog entry (P1 — see gaps).

## 4. Required Simulation Contract

`validateSimulationDefinition()` enforces all twelve required-contract items (objective, prerequisites, task steps, retry behavior, completion condition, evidence output, assessment boundary, team mode, accessible alternative, source authority, plus id/type validity and a ≥3-step minimum for flagship entries) and is run over the full catalog by `validateSimulationRegistry()`, exposed at `GET /metaverse/simulations/registry/validate`. No simulation in the catalog fails this validator (see §17 test results).

## 5. Evidence Boundary

`simulation-evidence-adapter.ts#describeSimulationEvidenceBoundary()` is pure and read-only. It derives `isVerifiedSkill`/`isCredential`/`isCourseCompletion`/`isCareerEligibility`/`isJobReadiness`/`isCivicAuthority` as hardcoded `false` — these are never computed from any input, so no code path can flip them true. `SimulationSessionService.completeSession()` writes the same fixed-false flags into `completion_result` server-side. `SIMULATION_AUTHORITY_BOUNDARY` in the contract file documents this as a static assertion (`simulationMayOwnVerifiedSkill: false`, etc.) for future reviewers.

## 6. Assessment Boundary

`SIMULATION_ASSESSMENT_BOUNDARIES` = `PRACTICE | FORMATIVE | SUMMATIVE | PROJECT | EVIDENCE_CANDIDATE_ONLY`. The current catalog uses `PRACTICE` (3 entries), `EVIDENCE_CANDIDATE_ONLY` (5 entries), and `PROJECT` (1 entry, Enterprise Service Delivery). No catalog entry uses `FORMATIVE`/`SUMMATIVE` yet because no simulation is currently wired to a real canonical assignment/assessment record (P1 — see gaps). The runtime never computes a grade or mastery value; `assessmentBoundary` is a declared classification only.

## 7. Retry Model

All five policies (`UNLIMITED_PRACTICE`, `LIMITED_ATTEMPTS`, `INSTRUCTOR_RELEASED_RETRY`, `REVIEW_REQUIRED`, `NO_RETRY`) are implemented in `SimulationSessionService`. Retry is enforced both mid-attempt (`/retry` endpoint) and across attempts (`assertNewAttemptAllowed()` on `startSession`), so a learner cannot bypass `NO_RETRY`/`LIMITED_ATTEMPTS`/instructor-gated policies by abandoning a session and starting a fresh one — the unique-active-session-per-learner-per-simulation index plus `countTotalSessions` close that path. Retry count is never treated as a mastery signal by this runtime.

## 8. Team Mode

`INDIVIDUAL | TEAM | EITHER` is supported. `SimulationTeamAdapter.getActiveMembership()` reads `studio_team_members` (canonical MET-12/Studio team table) and is the *only* source of truth for team participation; the client sends a team id it believes is its own, and the server independently verifies it before starting a session (`TEAM_MEMBERSHIP_REQUIRED` on failure — confirmed by test for both an unverified and a forged team id). Team participation alone never implies individual skill verification (see §5).

## 9. Accessibility

Every `SimulationDefinition.accessibleAlternative` declares `keyboardOperable: true`, `screenReaderEquivalent: true`, `reducedMotionSupported: true`, `colorIndependentState: true`, a written `nonSpatialAlternative`, `mobileTabletSupported: true`, and an explicit `timedInteractionAccommodation` (non-null wherever a step is timed — only the Arcade drill has a timed mode, and it states its untimed accommodation). Site-wide `prefers-reduced-motion` handling already exists in `src/styles/global.css` (`* { animation-duration: .01ms !important; ... }`) and applies to every simulation panel automatically. Mobile/tablet layout is inherited from the pre-existing `.met-activity` container's 620px/900px breakpoints (MET-5/7), not re-implemented per simulation.

## 10-19. District Coverage

Every one of the nine MET-2 districts has at least one simulation with real learner action and a server-validated completion path (not a placeholder card):

| District | Simulation | Depth |
| --- | --- | --- |
| Data Center | `data-center-operations-simulation` | Flagship, 5 steps, artifact-required |
| Technology & Innovation | `ai-agent-build-test-simulation` | Flagship, 4 steps |
| Technology & Innovation | `enterprise-service-delivery-simulation` | Flagship, 5 steps, team, artifact-required, review-gated retry |
| Civic | `civic-budget-tradeoff-simulation` | Flagship, 4 steps |
| Career & Education | `career-pathway-exploration-scenario` | 3 steps, grounded in real pathway record |
| Learning Arcade | `arcade-mission-prep-drill` | 2 steps, practice-only, untimed accommodation |
| Treasury & Commerce | `enterprise-budgeting-simulation` | 3 steps, no real balance touched |
| Community | `community-accessibility-audit-challenge` | 3 steps, artifact-required |
| Residential / Student Life | `team-time-management-challenge` | 3 steps, SEL/scheduling only |
| Public Realm | `city-scavenger-hunt-side-mission` | 3 steps, Side Mission, no prerequisites |

Civic District simulation is intentionally bounded (§16 of the brief): it is not gated by SHF Civic eligibility and creates no civic authority; full SHF Civic integration remains MET-14 scope.

## 20. Flagship Simulations

All four recommended flagship simulations exist and each satisfies: multi-step (≥4 steps), real source context, retry policy, evidence candidate output, a review/completion boundary, individual-or-team or team-only mode, an accessible alternative, and operational event lineage (`simulation.started` → `...step_completed` → `...artifact_submitted` (where required) → `...completed`).

## 21. Activity Registry

`apps/shs-api/src/domain/metaverse/simulations/registry/simulation-registry.ts` is the canonical registry. `validateSimulationRegistry()` checks: unique simulation ids, full contract validity per entry, `activityId`/`districtId`/`facilityId` resolution against the live MET-2 registry, every required district represented, and a minimum flagship count of 4. `GET /metaverse/simulations/registry/validate` exposes this at runtime; the integration test suite confirms it currently reports zero errors.

## 22. Runtime Entry

Every simulation route (`GET /metaverse/simulations`, `GET /metaverse/simulations/:id`, and all `/session/*` mutations) calls `SimulationSessionService.decideEntry()`, which delegates to the unmodified `MetaverseEntryService` (MET-5). A direct route to an unknown, locked, or cross-org simulation id fails closed: unknown ids return 404 before any entry decision runs; locked/ineligible simulations return 403 with the entry service's own reason text; cross-org or wrong-owner session ids return 404 (`SESSION_NOT_FOUND`) rather than leaking existence.

## 23. Simulation Session State

`metaverse_simulation_sessions` persists exactly what the brief allows: current step index, completed step ids, per-step responses, retry count/status, team session ref, timestamps, and an optimistic-concurrency `version` column. No verified-completion authority is persisted client-side; `completion_result` is only ever written by the server inside `completeSession()`, gated by the same optimistic-concurrency check.

## 24. Completion

`completeSession()` requires (a) all non-optional steps completed when `requiresAllRequiredSteps`, and (b) at least one submitted artifact when `requiresArtifactSubmission` — both enforced server-side before the `COMPLETED` status transition is written. The client never sets `status: "COMPLETED"` itself (see frontend test "completion and retry are always server round trips").

## 25. Program Packages

Simulations declare `programConnection.packageIds` (e.g. `after-school-tech-explorer`, `summer-data-center-camp`, `weekend-ai-bootcamp`, `summer-entrepreneurship-camp`, `community-civics-program`, `nonprofit-service-program`) as descriptive tags a Program Package domain can filter on. **P1 gap:** no canonical Program Package registry/model exists yet in this repository; these are plain string tags, not resolved against a real Program authority, so as not to fabricate one. No simulation requires a career pathway to be usable inside a package.

## 26. Side Missions

`city-scavenger-hunt-side-mission` is a first-class `SIDE_MISSION_ACTIVITY` with zero prerequisites and no career/program requirement. `arcade-mission-prep-drill` and `community-accessibility-audit-challenge` are tagged `side-mission-eligible` and are equally launchable standalone. **P1 gap:** there is no dedicated Side Mission *launcher* registry wiring these tags to MET-7/MET-11 mission surfaces yet — the simulation catalog itself is Side-Mission-ready, but the mission domain does not yet enumerate them as mission-launchable side content.

## 27. Student Enterprise Integration

`enterprise-service-delivery-simulation` walks intake → estimation → delivery → QA → presentation. It is `sourceType: ENTERPRISE_OPERATIONS_CONTEXT` referencing the MET-12 enterprise domain by path, and requires real, active Studio team membership to run in `TEAM` mode (verified via `SimulationTeamAdapter`, the same table MET-12 teams use). It reads no enterprise table directly and writes none; no employment or legal-entity claim is made (explicit in `careerConnection.notes`).

## 28. Opportunity Exchange Integration

No simulation auto-awards an Opportunity. **P1 gap:** MET-8 linking ("Opportunity may link to a simulation as project/work experience") is not yet wired — no Opportunity record currently references a `simulationId`. This is additive and safe to add later without touching bid/award authority.

## 29. Market Integration

`enterprise-budgeting-simulation` is entirely simulated figures (price point, resource allocation) with an explicit code comment and test-equivalent guarantee that no canonical Market listing, order, or Treasury balance is ever read or written by this simulation.

## 30. Work Passport Integration

New `SIMULATION_EXPERIENCE` passport claim type, `METAVERSE_SIMULATION` source authority, and a `simulationActivity` projection loop in `passport-projection-service.ts`. A completed session with `canBecomeEvidenceCandidate` projects `verificationLevel: EVIDENCE_CANDIDATE`; otherwise `ACTIVITY_COMPLETED`. `VERIFIED_SKILL` is never produced by this loop.

## 31. City Orchestration

`GET /metaverse/simulations/orchestration` builds briefing items, one flagship-prioritized next action, and fast-travel destinations from the live, unlock-filtered catalog. This is additive: MET-11's own `city-orchestration-service.ts` contract and tests are untouched. **P1 gap:** a deeper merge into MET-11's own briefing/next-action arrays (so simulations appear inline with missions/opportunities in one unified feed rather than a parallel surface) is left as documented follow-up rather than risking MET-11's existing acceptance tests.

## 32. Notifications

**P1 gap:** no NCA notification is emitted yet for `simulation.assigned`, `team session ready`, `retry released`, `review complete`, or `showcase upcoming`. Operational events (§34) exist and could feed NCA in a follow-up without new authority.

## 33. Presence / Communication

No new communication surface was created. Team-mode simulations are expected to use the existing MET-6 `TEAM_ROOM`/`PROJECT_ROOM` concepts by convention (the enterprise/team simulation already requires real Studio team membership, which is the same membership MET-6 rooms key off); no dedicated wiring between a simulation session and a specific room id exists yet (P1).

## 34. Operational Events

`simulation.started`, `simulation.step_completed`, `simulation.failed`, `simulation.retried`, `simulation.completed`, `simulation.artifact_submitted` are emitted through the same `emitOperationalTelemetry` sink as `unlock-authority-adapter.ts`. `SIMULATION_OPERATIONAL_EVENT_BOUNDARY` documents `eventsCreateVerifiedSkill: false` / `eventsCreateMastery: false` / `eventsCreateCredential: false` as a static assertion.

## 35-36. UI Model / Immersive Experience

`MetaverseSimulationShell` is the single reusable shell; `SimulationObjective`, `SimulationTaskPanel`, `SimulationStepProgress`, `SimulationEvidencePanel`, `SimulationRetryState`, `SimulationTeamPanel`, `SimulationAccessibleAlternative` are its sub-components. All ten catalog simulations render through this one shell (see `MetaverseActivityMount.jsx`) — none has a bespoke page. Presentation stays inside the existing `.met-activity` facility-scene/HUD/overlay visual language; no admin-form styling was introduced.

## 37. Mobile / Tablet

Inherited from `.met-activity`'s existing responsive rules; no drag-only or precise-mouse-only control exists in any simulation step (numeric fields, radio/checkbox lists, reorderable text lists with up/down buttons, and free-text areas only).

## 38. Performance

No 3D engine was introduced. Simulations are plain React state machines over server JSON, consistent with the existing 2D-cinematic-scene-plus-overlay architecture.

## 39. Security

See §42 backend test results below for the enumerated cases actually exercised (auth required, org isolation, cross-org/cross-owner session denial, hidden-simulation-id enumeration denied, forged team denied, client-forged completion denied, retry policy enforced). Deep links to unknown/locked simulations fail closed before any session state is created.

## 40. Persistence

Two new tables only: `metaverse_simulation_sessions`, `metaverse_simulation_artifacts` (migration `147_metaverse_simulation_activities.sql`). The simulation catalog itself remains a declarative in-code registry, exactly like the MET-2 city registry — no duplicate assignment, mission, project, assessment, evidence, career, or team-authority table was created.

## Repository-Local P0/P1

**P0:** None remaining. (One test-authoring defect was found and fixed during this pass: the "auth required" backend test omitted the Authorization header entirely, which hits a pre-existing dev-mode fallback shared by *every* metaverse route — not a MET-13-specific gap — rather than exercising real rejection the way MET-7's equivalent test does. Fixed to use an unresolvable dev-token identity, consistent with the MET-7 convention; now passes.)

**P1:**
- No canonical Program Package registry/model exists; `packageIds` are descriptive tags only (§25).
- Side Mission *launcher* wiring into MET-7/MET-11 mission surfaces does not yet exist; the catalog is Side-Mission-ready but not yet mission-enumerated (§26).
- No Opportunity record links to a `simulationId` yet (§28).
- No deeper merge of the simulation orchestration surface into MET-11's own briefing/next-action arrays (§31).
- No NCA notifications for simulation lifecycle events yet (§32).
- No explicit team-room/project-room binding from a simulation session to a MET-6 communication room id (§33).
- `PROGRAM_ACTIVITY` and `SHOWCASE_ACTIVITY` simulation types are declared but not yet assigned to a catalog entry.
- No `FORMATIVE`/`SUMMATIVE` assessment-boundary simulation exists yet (none is currently wired to a real canonical assignment/assessment record).
- Full browser/UI acceptance (real browser session clicking through a flagship simulation) was not run in this pass; frontend coverage here is static source-assertion tests (this repository's established convention for the metaverse frontend — no rendered-component harness is configured) plus a passing live-server backend integration suite exercising the identical HTTP contract the frontend calls.

## Browser Acceptance

Not run as a live browser session in this pass (no rendered-component harness is configured for the metaverse frontend in this repository, consistent with every prior MET-6/7/8/9/10/11/12 phase's frontend test convention). In its place: (a) 15 backend integration tests ran against a live dev server + Postgres and exercised the exact HTTP contract the UI calls — full session lifecycle (start → sequential steps → completion), artifact-required flagship completion, forged/expired step sequencing, forged team id rejection, cross-org and cross-owner session denial, hidden-id enumeration denial, and the orchestration surface; (b) 10 static frontend tests confirm the shell/components render the objective, task steps, retry state, evidence boundary, and accessible alternative from server data, never fabricate a verified-skill claim, and never optimistically set completion/retry state without a server round trip. This is documented as a P1 rather than a fabricated acceptance run.

## Final Verdict

MET-13 establishes a canonical, reusable metaverse simulation/activity architecture with real district depth across all nine MET-2 districts, four flagship simulations, and full reuse of MET-3/MET-5/MET-6/MET-9/MET-10/MET-11/MET-12 authority. It is ready for MET-14 if the validation results in this document continue to hold.
