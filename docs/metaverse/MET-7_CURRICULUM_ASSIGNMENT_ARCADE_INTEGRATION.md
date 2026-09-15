# MET-7 Curriculum + Assignment + Learning Arcade Integration

Status: Implemented (P0 scope) — City Missions are a read-time projection, never a new authority.

MET-7 makes a real canonical Assignment (curriculum-, arcade-, or Studio-bound) appear in the Silicon Heartland Metaverse as a **City Mission**: a district/facility/activity-located, status-honest, next-action-guided view of work the learner is already assigned. It creates no second curriculum, assignment, assessment, evidence, portfolio, Arcade, or career authority. Nothing about a mission is persisted — `mission_projection_id` is a deterministic hash of `(organization_id, student_id, assignment_id)`, recomputed on every request from live data, never stored.

## Canonical Authority Map

| Fact | Canonical source | MET-7 status |
| --- | --- | --- |
| Assignment existence/targeting/status | `apps/shs-api/src/domain/assignments/{model,service}/*.ts` | Reused as-is; `listAssignedWork`/`getAssignmentForActor` are the only entitlement reads |
| Curriculum release/lesson progress, access-state, next lesson | `apps/shs-api/src/domain/assignments/service/assignment-entitlement-service.ts` | Reused verbatim (`resolveAssignmentWork`) — MET-7 never re-derives access-state |
| Completion Policy requirements (ARCADE, PRACTICE, STUDIO_PROJECT, …) | `apps/shs-api/src/domain/completion-policy/{model,service,repo}` | Reused (`evaluateAssignmentCompletion`, `CompletionPolicyRepo.listRequirements`) for LESSON-scoped assignments only |
| Arcade activity/result/mastery | `apps/shs-api/src/domain/arcade/{model,repo}` | Reused (`ArcadeRepo.getActivityById`, `.hasMasteryForActivity`) — read-only |
| Lesson↔Arcade Activity definition link | `curriculum_lesson_arcade_activities` (migration 064) via `CurriculumCatalogRepo.listArcadeLinksForLesson` | Reused — `arcade_activities.lesson_id` is documented dead/unused and is never read |
| Enrollment/cohort/program membership | `apps/shs-api/src/domain/enrollments/repo/enrollment-repo.ts` | Reused, indirectly via `assignment-entitlement-service` and directly for `programId` derivation |
| Studio project/review/delivery status | `apps/shs-api/src/domain/studio/service/studio-project-service.ts` (`list(actor)`) | Reused, read-only, best-effort (never blocks mission projection if it throws) |
| MET-2 city/district/facility/activity registry | `apps/shs-api/src/domain/metaverse/registry/city-registry.ts` | Reused; the location resolver never invents an id not already in the registry |
| MET-3 unlock decision (district/facility/activity access) | `apps/shs-api/src/domain/metaverse/unlocks/*` via `MetaverseEntryService` | Reused unchanged — a mission's own status is a *second, independent* gate layered on top of MET-3, never a replacement for it |
| MET-5 protected entry | `apps/shs-api/src/domain/metaverse/runtime/metaverse-entry-service.ts` | Reused unchanged; `mission-projection-service.ts` calls it directly |
| Verified evidence source types (`LESSON_COMPLETION`, `ARCADE_RESULT`, `STUDIO_DELIVERY`, `PROJECT_SUBMISSION`) | `apps/shs-api/src/domain/verified-evidence/service/verified-evidence-service.ts` (`SOURCE_TABLES`) | Referenced/described only — MET-7 never calls `projectAuthoritativeFact`/`projectAuthoritativeOutboxEvent` |
| Portfolio artifact source types | `apps/shs-api/src/domain/portfolio/model/portfolio-contract.ts` (`PORTFOLIO_SOURCE_TYPES = ["STUDIO_EVIDENCE"]`) | Referenced only; confirmed unchanged by test |
| Program↔Career links, learner pathway | `apps/shs-api/src/domain/career-pathways/service/career-pathway-service.ts` (`listCareersForProgram`) | Reused, projection-only, fails to `null` rather than guessing |
| Notifications (NCA) | `apps/shs-api/src/domain/notifications` | Referenced only; no new notification authority (see P1 gaps) |
| Operational telemetry | `apps/shs-api/src/observability/operational-telemetry.ts` | Reused — same sink MET-5/MET-6 already use |

## What MET-7 Added

Domain under `apps/shs-api/src/domain/metaverse/missions/`:

- `mission-contract.ts` — `CityMission` type and its sub-shapes (`MissionStatus`, `MissionLocation`, `MissionArcadeRelation`, `MissionEvidenceExpectation`, `MissionCareerContext`, `MissionPrerequisiteStatus`, `MissionNextAction`)
- `mission-location-resolver.ts` — pure, deterministic curriculum→district/facility keyword mapping (asserted at module load against the real MET-2 registry, so a typo fails loudly); matches a mission to a concrete `MetaverseActivity` only when its bound lesson's stable key equals a registry activity id (currently just `data-center-foundations-introduction`)
- `mission-authority-adapter.ts` — pure `buildCityMission()`: composes an already-resolved `ResolvedAssignmentWork`, completion-policy `RequirementResult[]`, Arcade candidates, Studio linkage, and career context into a `CityMission`. Derives `missionStatus` from `DerivedAccessState` verbatim (`LOCKED`/`AVAILABLE`/`IN_PROGRESS`/`OVERDUE`; `COMPLETED` → `COMPLETED_SOURCE_PENDING_VERIFICATION`), except when a real Studio project exists, in which case Studio's own `reviewStatus`/`deliveryStatus` drive `SUBMITTED`/`COMPLETED_VERIFIED_SOURCE`
- `mission-evidence-adapter.ts` — pure, descriptive-only evidence boundary (`isVerifiedEvidence` is always `false` from this domain)
- `mission-career-adapter.ts` — pure(-ish) projection over `listCareersForProgram`, fails to `null` on error
- `mission-event-adapter.ts` — `emitMetaverseMissionEvent()`, five new operational event names appended to `METAVERSE_UNLOCK_OPERATIONAL_EVENTS` in `unlocks/unlock-authority-adapter.ts` (`metaverse.mission.viewed/started/exited/submitted/activity_completed`), reusing the existing `METAVERSE_OPERATIONAL_EVENT_BOUNDARY`
- `mission-projection-service.ts` — the only module that touches the database or another domain's service layer. Every mission is recomputed fresh on every call — nothing is cached
- `api/routes.ts` — `registerMetaverseMissionRoutes(app)`, mounted from `apps/shs-api/src/api/router.ts`

One small, additive, non-authority read added to an existing repo (no migration): `CurriculumCatalogRepo.findLessonIdByStableKeys()` (`curriculum-catalog-repo.ts`) — bridges a release-snapshot `(unitStableKey, lessonStableKey)` to the live `curriculum_lessons.lesson_id` that `curriculum_lesson_arcade_activities` keys on.

## API Routes

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/metaverse/missions` | List every City Mission projected from the caller's own real assigned work |
| GET | `/metaverse/missions/:missionId` | Fetch one mission by its deterministic id, entitlement-checked |
| POST | `/metaverse/missions/:missionId/enter` | Re-derive mission eligibility AND MET-3/MET-5 unlock, emit `metaverse.mission.started`/`.exited` |
| POST | `/metaverse/missions/:missionId/events` | Record `metaverse.mission.viewed` or `.activity_completed` — operational facts only |
| POST | `/metaverse/missions/:missionId/submit` | Record `metaverse.mission.submitted` where a canonical submission authority exists (Studio-linked artifact assignments only); `409 MISSION_SUBMISSION_NOT_SUPPORTED` otherwise |

All five routes are gated by `requirePermission(SHS_SECURITY_PERMISSIONS.ASSIGNMENT_VIEW)` — the exact same permission `/assignments` already uses, not a new `metaverse.mission.*` permission (a City Mission is a projection of Assignment data, not a new authority). Identity, organization, and role always come from `req.user`; no route reads `student_id`/`user_id`/`organization_id`/`assignment_id` from the request body or query string for identity purposes.

## Runtime Decision Flow

1. `listMissionsForActor(user)` calls `assignment-entitlement-service.listAssignedWork(actor)` — the same canonical entitlement resolver `/assignments` uses — so a mission can only ever exist for an assignment the caller is already really entitled to (cross-org, non-targeted, and forged-id access are structurally impossible, not just checked).
2. For each `ResolvedAssignmentWork`, the orchestrator gathers (read-only, in parallel where possible): Completion Policy requirement results (LESSON-scoped assignments with a bound policy only, via `evaluateAssignmentCompletion`), Arcade candidates (policy-required via `completion_policy_requirements` ARCADE rows, plus lesson-linked-recommended via `curriculum_lesson_arcade_activities`), Studio linkage (artifact-type assignments only), and `programId`/career context (via the assignment's `cohortId` → `EnrollmentRepo.getCohortById`).
3. `buildCityMission()` (pure) derives `missionStatus`, `nextAction`, `prerequisites`, `arcadeRelations`, and `evidenceExpectations` from those inputs and the MET-2 location resolver.
4. `POST /enter` first requires the mission's own `missionStatus` to not be `LOCKED`/`CLOSED`, **then** independently calls `MetaverseEntryService.decide()` (MET-5, unchanged) against the mission's resolved district/facility/activity resource. **Both** gates must agree — a mission being `AVAILABLE` never overrides MET-3's own district/facility enrollment requirement (verified by test: entering a real, `AVAILABLE` Data Center mission is still denied with `NOT_ENROLLED` for a learner who is assignment-entitled but not enrolled in the Data Center program).
5. Every mission field is recomputed from scratch on every request — there is no cache to go stale, so "protected entry rechecks mission authority" and "direct URL/API cannot bypass mission eligibility" are true by construction.

## Server-Side Security Behavior (verified by tests)

- Mission list/get requires a resolvable authenticated identity (`AUTH_REQUIRED`, 401) and an active organization (via `requirePermission`).
- A mission can only exist for an assignment the caller is really entitled to; a non-entitled learner sees nothing and gets `404` on a direct fetch or an `enter` call for someone else's mission id.
- Cross-organization access is denied: a mission id valid for one org 404s for a user in a different org.
- A guessed/forged `miss_...` id that doesn't correspond to any of the caller's real assignments 404s.
- `organization_id`/`user_id`/`userId`/`organizationId` in the `enter` request body are recognized `CLIENT_AUTHORITY_FIELDS` (the same MET-5 guard every other metaverse entry path has) and cause the **entire request** to be refused (`403`, `client_cannot_grant_unlock`) rather than silently ignored — verified by test. A clean request for the same mission still resolves to the caller's own real assignment/student identity, never a body-supplied one. `/events` doesn't read those fields at all, so a forged `assignment_id`/`student_id` there is simply inert.
- District/facility/activity mapping comes only from the canonical MET-2 registry resolver (`mission-location-resolver.ts`), asserted at module load against real registry ids; verified end-to-end against a real published course/lesson (matches `data-center-district` / `data-center-training-lab` / the exact `data-center-foundations-introduction` registry activity).
- A REQUIRED Arcade prerequisite, read from a **real** `completion_policy_requirements` row, blocks `nextAction` (`PLAY_ARCADE_CHALLENGE`) until a **real** `arcade_results.mastery_achieved=true` row exists for that learner/activity — never a client-supplied flag.
- Arcade mastery becoming `true` never flips `evidenceExpectations.isVerifiedEvidence` — it stays `false`; mastery and verification remain different authorities (unit + integration test).
- Entering a mission, viewing it, or recording `activity_completed` never writes to `curriculum_lesson_completions`, `arcade_results`, `assessment_results`, or any evidence/outcome table — verified by querying `curriculum_lesson_completions` before/after an `activity_completed` event and asserting no change.
- A LESSON-scoped mission has no canonical submission authority; `POST /submit` returns `409 MISSION_SUBMISSION_NOT_SUPPORTED` rather than silently accepting a submission this repo has no authority to record (mirrors `assignment.ts`'s own documented boundary: "no submission/grading domain exists in this repository to own that truth").
- Archiving the underlying assignment (`PATCH /assignments/:id {status: "archived"}`) immediately removes its mission from the list and 404s a direct fetch by the previously-valid mission id — there is nothing to invalidate because nothing was cached.
- Withdrawing a learner's enrollment (`status='WITHDRAWN'`) immediately removes a cohort-targeted mission from that learner's list; reactivating restores it — proven against a real `enrollments` row, not a mock.
- Structural check: `mission-projection-service.ts` contains no `INSERT`/`UPDATE`/`DELETE` SQL and never calls `createAssignment`/`updateAssignment`/`submitResult`/`createActivity`/`projectAuthoritativeFact`/`projectAuthoritativeOutboxEvent`/`PortfolioService`/`linkProgramCareer` — it is read-only into every domain it touches (verified by source-text test, both as a fast unit assertion and again in the DB-backed integration suite).

## Storage / Persistence

None. `mission_projection_id` is `sha256(organization_id|student_id|assignment_id)` truncated to 32 hex chars, computed on demand and never stored (`deriveMissionProjectionId`). Mission operational events go through the existing in-process telemetry sink (`emitOperationalTelemetry`), the same non-persistent pattern MET-5/MET-6 already use. **No migration was created for MET-7.** The one schema-adjacent change is additive code only: a new read method on an existing repo (`CurriculumCatalogRepo.findLessonIdByStableKeys`), not a schema change.

## Frontend Implementation

New client: `src/system/metaverse/metaverseMissionClient.js` — the only frontend module calling `/metaverse/missions*`. Sends `credentials: "include"`, no client-declared authority fields (`clientAuthorityFieldsSent: false`), mirrors the existing `metaverseRuntimeClient.js`/`metaverseCommunicationClient.js` dev/production header pattern.

New component: `src/components/metaverse/MetaverseMissionList.jsx` — the accessible, non-spatial mission list (`aria-label="Accessible mission list"`), rendering only server-provided `missions` (no hardcoded array), each card showing real `missionStatus`, `nextAction.label`/`.reason`, and Arcade relation summary (`requiredOrRecommended`, `masteryAchieved`).

`MetaverseCityPage.jsx` wiring:

- Polls `listMissions()` every 30s (mirrors the existing 15s city-presence poll pattern) into `missions`/`missionsLoading`/`missionsError` state.
- `missionCountsByDistrict`/`missionCountsByFacility` are `useMemo`-derived purely from the fetched `missions` array and attached to district/facility markers as `missionCount` — a real badge (rendered in `MetaverseHotspot.jsx`, also folded into the marker's accessible label), never a fabricated number.
- A "Missions" toggle button (`MetaverseCameraControls.jsx`, mirroring the existing "Locations" toggle) opens `MetaverseMissionList` as a right-docked panel (mirrors `.met-navigator`'s left-docked styling; new `.met-missions*`/`.met-hotspot__mission-count` CSS rules reuse the same `met-*` visual language — no new design system).
- Selecting a mission (`handleSelectMission`) first calls `enterMissionApi(mission.missionProjectionId)` — the mission-aware protected-entry endpoint. Only on `can_enter: true` does it then navigate the camera through the exact same `selectDistrict`/`selectFacility`/`selectActivity` functions a direct city click uses (each of which performs its own independent MET-5 entry check, consistent with the "both gates must agree" behavior above). A denial is always surfaced via `entryNotice` with the real reason text (`entry.decision.reason_text` or the mission's own `nextAction.reason`) — never a silent no-op.

## Accessibility

- `MetaverseMissionList` is reachable by keyboard/tab like every other `met-*` panel button; each mission is a real `<button>` with `aria-describedby` pointing at its next-action text.
- Mission status is never color-only: every card renders a text status pill (`STATUS_LABEL`) alongside any color styling.
- The city-view mission-count badge is `aria-hidden` (decorative) but the same count is folded into the hotspot's existing `aria-label`, so screen-reader users get the information without relying on the visual badge.
- `MetaverseMissionList` is the full non-spatial equivalent required by build-brief §22/§29 — every mission reachable by walking the city is also reachable from this list, with the same real data.

## Validation Coverage

Backend, pure-logic (`apps/shs-api/tests/metaverse-mission-runtime.test.ts`, 14 tests, no DB/server): location-resolver mapping and fallback-never-fabricates; deterministic/scoped mission id; unsatisfied vs. satisfied ARCADE prerequisite blocking/unblocking `nextAction`; `LOCKED` access-state produces a locked mission regardless of prerequisites; `COMPLETED` access-state maps to `COMPLETED_SOURCE_PENDING_VERIFICATION`, never a fabricated verified/credential state; Studio review/delivery status honestly drives `SUBMITTED`/`COMPLETED_VERIFIED_SOURCE`; evidence expectations never claim verified evidence; mission operational events match the reused zero-authority boundary; portfolio boundary (`STUDIO_EVIDENCE`-only) unchanged; team-assignment authority gap is explicit; Arcade mastery never flips `isVerifiedEvidence`; no-duplicate-authority structural check on `mission-projection-service.ts`.

Backend, DB/server-integration (`apps/shs-api/tests/metaverse-mission-integration.test.ts`, 15 tests, real Postgres + running API, same convention as `assignments.security.test.ts`): authentication required; entitled-only visibility; cross-org denial and forged-id 404; real district/facility/registry-activity mapping end to end; real Completion-Policy ARCADE requirement blocks then unblocks on real Arcade mastery; both mission eligibility and MET-3's independent district gate are enforced on entry, and a non-entitled learner still 404s; `activity_completed` never writes curriculum completion; lesson-scoped `submit` is honestly refused (`409`); archiving an assignment invalidates its mission; withdrawing/restoring enrollment removes/restores cohort-targeted mission visibility; forged `organization_id`/`user_id`/`assignment_id` in the enter body is refused outright, and a clean request still resolves to the caller's own real identity; Arcade mastery does not become verified evidence; structural no-duplicate-authority check (DB-backed copy); MET-6 room/presence reuse is confirmed absent (documented gap, not silently faked).

Frontend, source-text (`tests/metaverseMissionIntegration.test.mjs`, 13 tests, mirrors `tests/metaversePresenceCommunicationRuntime.test.mjs`'s style): client sends no authority fields and exposes the full list/get/enter/events/submit surface; city page wires real `listMissions()`/`enterMissionApi()`, never a hardcoded mission; mission counts/markers derive only from fetched data; mission entry always goes through the protected endpoint before navigating, and a denial always surfaces its real reason; mission list renders real prerequisite/status/Arcade fields and never claims "verified mastery"/"credential"/"job eligibility"; list is the accessible non-spatial equivalent with proper roles; hotspot badge is decorative with an accessible-label fallback; camera-controls toggle and city-page wiring are actually connected (props passed, panel rendered); CSS reuses the existing `met-*` design language; portfolio/career labels are never asserted "verified" by the component itself.

Existing frontend suites (`tests/metaverseCityShell.test.mjs`, `metaverseRuntimeAdapter.test.mjs`, `metaversePresenceCommunicationRuntime.test.mjs`, `metaverseVisualAssetMapping.test.mjs` — 73 tests combined with the new file) and the existing backend MET-4/5/6 + assignment/curriculum-binding suites (169 tests) still pass unchanged, except one **pre-existing** failure in `metaverse-city-registry.test.ts` ("city registry is declarative...") that fails identically with or without MET-7's changes (confirmed via `git stash`) — untouched by MET-7, not remediated here to avoid scope creep.

`npm --prefix apps/shs-api run typecheck` and `npm --prefix apps/shs-api run build` (`tsc --noEmit` / `tsc -p tsconfig.json`) both pass clean. Root `npm run build` (`vite build`) succeeds (pre-existing large-chunk warnings only, unrelated to MET-7).

## Browser / Runtime Acceptance

Not run as a full interactive Chrome session in this pass. The frontend wiring was validated by: (a) `npm run build` succeeding with the new imports/components in the graph, (b) the regex-based source tests above proving the actual wiring exists (props passed, handlers connected, no hardcoded data), and (c) the backend routes it calls being proven correct end-to-end against a live server+DB by the integration suite. A live-browser walk (seeded learner, real click-through of Missions panel → district → facility → activity mount) was not performed and should be done before this surface is treated as user-facing production-ready.

## Migration

Migration created?: **No.** City Missions are a pure read-time projection; the one repo addition (`CurriculumCatalogRepo.findLessonIdByStableKeys`) is a new read method on an existing table, not a schema change.

## P0 / P1 Gaps

P0 gaps: None identified in implemented scope.

P1 gaps:

- **Team assignments** — this repo's `AssignmentTargetType` is `LEARNER | COHORT | PROGRAM | ORGANIZATION`; there is no canonical team-distinct assignment authority to project team City Missions from (confirmed by test, not fabricated). Revisit once/if a canonical team-assignment authority exists.
- **MET-6 room/presence reuse for mission context** — a City Mission does not yet create or join a `FACILITY_ROOM`/`PROJECT_ROOM` on entry; MET-6's presence/chat only activates today via the existing district/facility-view flow in `MetaverseCityPage.jsx`, which a mission-driven navigation does pass through (so presence/chat still work once the learner lands in the facility), but there is no mission-specific room or "who else has this mission" surface. Confirmed absent by test rather than left ambiguous.
- **Entitlement-gated (service-catalog) mission entry** — no assignment/mission in this repo's live registry is gated by a service-catalog entitlement today (the one registry activity with an entitlement-style unlock reference, `entitled-ai-agent-lab`, is `PLANNED`/no production route). MET-3's entitlement-revocation path is exercised for entry in general (existing MET-5 suite) and mission-level enrollment revocation is proven here, but a dedicated "revoked entitlement blocks a *mission*" fixture was not built, since fabricating one would require inventing an entitlement-gated assignment this repo doesn't otherwise have.
- **Notifications (NCA)** — mission operational events (`metaverse.mission.*`) are emitted through the same telemetry sink MET-5/MET-6 use, but no new NCA `EVENT_POLICIES`/`notification_type` entries were added to turn "mission unlocked"/"submission received" into an actual in-app notification. Adding one without a dedicated design pass risked mis-triage (NCA-1's own stated failure mode for an unclassified type); deferred rather than guessed.
- **Arcade "assignment" authority** — there is no canonical way to directly assign a standalone Arcade challenge via the Assignment domain (`ArcadeActivity` has no `assignmentId`); `ARCADE_PRACTICE_FOR_MISSION` is fully derived from the real `completion_policy_requirements` (ARCADE type) and `curriculum_lesson_arcade_activities` link table instead. `mission.arcadeAssignmentId` is therefore always `null` by design, not an oversight.
- **Additional curriculum-domain location rules** — `mission-location-resolver.ts` covers the keyword groups named in the build brief (data center, civic, career, financial-literacy/commerce, community, technology/AI/software) plus a safe fallback to the Learning Center; broader/finer-grained domain coverage can be added later without changing the mapping's shape.
- **Richer Arcade-per-activity frontend surface** — `MetaverseMissionList` shows Arcade relation title/required-or-recommended/mastery as text; it does not deep-link into a specific Arcade challenge route (`/arcade.html#/...`) yet.
- **Full interactive browser acceptance** — see Browser/Runtime Acceptance above.
