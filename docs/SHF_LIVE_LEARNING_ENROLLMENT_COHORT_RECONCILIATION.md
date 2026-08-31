# SHF Live Learning / Enrollment / Cohort Reconciliation

Updated 2026-08-30 for SHF Learning Ecosystem Phase 3.

## Scope

Phase 3 reconciles the existing Live Learning domain with the canonical Enrollment/Cohort participation model established in Phase 1 and used by Assignments in Phase 2. It does not rebuild Live Learning, create a second session/audience model, redesign Calendar or Curriculum, or touch Career. It is Live Learning participation reconciliation only.

## Audience Model

Every `live_sessions` row now carries an explicit `audience_scope` (`ORGANIZATION` | `COHORT`), added by migration `044_live_learning_canonical_cohort_scope.sql`. Before this phase, `cohort_id` existed on the table but no code path enforced cohort membership — a session with `cohort_id` set was still visible/joinable organization-wide, and `NULL` had no explicit contract at all (it just happened to behave as organization-wide by omission).

The audit of `shs_dev` found **zero** non-null `cohort_id` values in the 133 existing `live_sessions` rows — every row classified as **LEGACY** (organization-scoped by accident of missing enforcement, not by a documented rule). There were no CANONICAL, ORPHAN, or UNKNOWN rows to reconcile. This made the migration safe: every existing row became explicit `audience_scope = 'ORGANIZATION'` with `cohort_id` staying `NULL`, matching its actual historical behavior exactly — no session's visibility changed as a side effect of the migration itself.

`NULL cohort_id` now has one explicit meaning: `audience_scope = 'ORGANIZATION'`, i.e. this session belongs to no specific cohort and organization membership is the entitlement rule for it (per the existing product behavior these sessions always had — office hours, all-org announcements, etc.). This is enforced, not assumed: a `CHECK` constraint (`live_sessions_audience_scope_cohort_check`) makes `ORGANIZATION` + non-null `cohort_id` and `COHORT` + null `cohort_id` both impossible at the database level.

Program-wide and direct-invite/staff-only scopes were considered and explicitly **not** built this phase — no current product need justified them, and building them would have been scope creep per the phase's own constraints. `COHORT` and `ORGANIZATION` are the only two scopes.

## Schema Changes

Migration `044_live_learning_canonical_cohort_scope.sql` (additive only, no historical migration edited):

- `live_sessions.audience_scope TEXT NOT NULL DEFAULT 'ORGANIZATION'`.
- Backfill: `audience_scope = 'COHORT'` wherever `cohort_id IS NOT NULL` (no rows matched in `shs_dev`, but the statement is correct for any future non-null legacy data).
- `live_sessions_audience_scope_check`: `audience_scope IN ('ORGANIZATION','COHORT')`.
- `live_sessions_audience_scope_cohort_check`: enforces the exact ORGANIZATION/COHORT ↔ null/non-null `cohort_id` pairing described above.
- `live_sessions_cohort_same_org_fk`: `FOREIGN KEY (organization_id, cohort_id) REFERENCES cohorts(organization_id, cohort_id)` — a cohort-scoped session can only reference a cohort in its own organization; cross-org cohort references are rejected at the database level, not just in application code.
- `idx_live_sessions_audience_scope` on `(organization_id, audience_scope, cohort_id)` for the new entitlement queries.

No destructive rewriting, no historical migration edited, no rows deleted. `schema-integrity.ts`'s manifest was extended with a `044` entry covering `live_sessions`' new columns/index/constraints.

## Enrollment Integration

`EnrollmentRepo.listActiveEnrollmentsForLearner()` and `EnrollmentRepo.isActiveCohortStaff()` (both pre-existing from Phase 1/2) are the only entitlement primitives Live Learning consults. No second enrollment/membership model was created.

- **Student cohort eligibility**: a learner is eligible for a `COHORT`-scoped session only if they have an `ACTIVE` enrollment (`enrollments.status = 'ACTIVE'`) whose `cohort_id` matches the session's `cohort_id`, in the same organization.
- **Instructor cohort authorization**: an instructor may create, manage, or receive instructor-tier visibility into a `COHORT`-scoped session only if they are `cohort_staff` with `status = 'ACTIVE'` for that cohort, or they are the session's own creator (`instructor_id` match).

## Cohort Eligibility

Enforced server-side in `live-learning-service.ts`:

- `validateCohortScope()` — on session **creation**: the target cohort must exist, be in the actor's organization, and be `ACTIVE`. `DRAFT`, `COMPLETED`, and `ARCHIVED` cohorts reject new session scheduling (`COHORT_INACTIVE`). Non-admin actors must additionally be active `cohort_staff` for that cohort (`COHORT_STAFF_REQUIRED`).
- `canViewSession()` — on **list/direct-id read**: admin tier always passes; `ORGANIZATION`-scoped sessions are visible to any same-org actor; `COHORT`-scoped sessions require the student to hold an active cohort enrollment, or the actor to be the session's instructor or active cohort staff.
- `canManageSession()` — on **cancel**: admin tier, the session's own instructor, or active cohort staff for the session's cohort. No other instructor may cancel another instructor's cohort session.

This mirrors the cohort-status policy already adopted for Assignments in Phase 2 (`SHF_ASSIGNMENT_ENROLLMENT_TARGETING.md`): only `ACTIVE` cohorts admit new scheduling; `DRAFT`/`COMPLETED`/`ARCHIVED` do not.

## Instructor / cohort_staff Integration

`listVisibleForInstructor()` (repo) and `canManageSession()`/`canViewSession()` (service) use `cohort_staff` — never Team membership, never bare organization role — to decide instructor-tier access to a specific cohort's sessions. An instructor with no `cohort_staff` row for a cohort, and who is not that session's own creator, gets neither visibility nor manage rights on that cohort's sessions, even though they hold the `instructor` role generally. Admin-tier roles (`shf_admin`, `shs_admin`, `org_admin`, `super_admin`, `program_manager`) remain organization-scoped per the existing permission map — Phase 3 did not grant them anything new, and did not promote ordinary instructors to organization-wide Live Learning admins.

## Student Visibility

`GET /live-learning/sessions` calls `listSessionsForActor()`, which branches on the actor's tier:

- Admin tier → full organization list (unchanged).
- Student-only tier → `LiveSessionRepo.listVisibleForStudent()`: `ORGANIZATION`-scoped sessions, plus `COHORT`-scoped sessions where the student holds a matching `ACTIVE` enrollment. The filter is a single SQL `EXISTS` against `enrollments` — there is no way for the client to widen this by supplying organization/cohort ids, because the query only ever uses the authenticated actor's own id.
- Instructor tier → `LiveSessionRepo.listVisibleForInstructor()`: sessions they created, all `ORGANIZATION`-scoped sessions, and `COHORT`-scoped sessions for cohorts where they are active staff.

Organization membership alone is no longer sufficient for a `COHORT`-scoped session — this was the central gap Phase 3 closed.

## Join Authorization

`requestJoin()` re-checks eligibility independently of any prior list/read call — visibility and joinability are separate decisions, exactly as required:

1. `canViewSession()` (organization + Enrollment/Cohort/cohort_staff entitlement) — denies with `{allowed:false, reason:"Learner is not eligible for this live session."}` if this fails, and still records a `deny` join event.
2. Session status (`draft`/`cancelled`/`completed`/`expired` all deny).
3. Time window (`joinWindowMinutesBefore` / `joinGraceMinutesAfterEnd` against `startsAt`/`endsAt`).
4. Provider session existence and provider `issueJoinAccess()` — the provider can still deny an institutionally-eligible learner (capacity, provider-side policy, etc.).

Every decision — allowed or denied, at any layer — is written to `live_session_join_events` via `recordDecision()`, and reflected in an audit event. An eligible learner can still be denied by the provider or the time window; an institutionally-ineligible learner is denied before the provider is ever consulted.

## Direct-ID Security

`GET /live-learning/sessions/:id` uses `getSessionForActor()`, which applies the exact same `canViewSession()` check as the list endpoint. An ineligible learner who knows a valid session id receives `404 NOT_FOUND` — not `403` — so the endpoint does not confirm or deny the session's existence to an unauthorized caller. `POST /live-learning/sessions/:id/join` applies the same entitlement check inside `requestJoin()`, independent of the read path. `GET /live-learning/sessions/:id/join-events` requires `canManageSession()` in addition to `getSessionForActor()`, so a student (or an unrelated instructor) cannot read another session's join/attendance audit trail by id.

Covered by `tests/live-learning.cohort-eligibility.test.ts`: same-org non-enrolled learner (404 read, 403 join), different-cohort learner, different-organization learner, cross-org admin (404), and an explicit "client organization smuggling" case (a caller cannot expand its own organization scope by passing a different `organizationId` in the request body).

## Provider Policy Preservation

Institutional eligibility (Enrollment/Cohort) and provider/execution policy are enforced as two independent, both-required layers — neither replaces the other:

- An enrolled, cohort-eligible learner is still denied outside the configured join window (`enrollment entitlement does not bypass closed window` test).
- An enrolled, cohort-eligible learner is still denied when the provider is not configured (Zoom with no credentials → `503 PROVIDER_NOT_CONFIGURED` at creation; a provider-side denial at join time still produces `{allowed:false}`).
- Session status (`cancelled`, `completed`, `expired`) still blocks join regardless of Enrollment/Cohort standing.

No change was made to provider health checks, `MockLiveLearningProvider`, `ZoomLiveLearningProvider`, or the provider registry.

## Attendance Truth Boundary

Unchanged and re-verified this phase: `live_session_join_events` remains the only attendance-adjacent record, written exclusively by `recordDecision()` inside the Live Learning service. Cohort/Enrollment eligibility, session visibility, and a successful join decision are all necessary-but-not-sufficient conditions checked before a join event is recorded — none of them, individually or combined, constitute "attended." Enrollment and Calendar code paths do not write to `live_session_join_events`, and this phase added no code that infers attendance from enrollment status, session visibility, or join-request success.

## Historical Access Policy

**Not solved this phase — documented, not guessed, per the phase's own stop-condition guidance.** Today, a learner's visibility into a `COHORT`-scoped session (past or future) depends entirely on their **current** enrollment status being `ACTIVE`. A learner who is later `WITHDRAWN` or moves to `COMPLETED` loses list/read/join-event visibility into that cohort's sessions, including sessions that already occurred while they were actively enrolled.

This is the same deferred gap already documented for Assignments in Phase 2 (`SHF_ASSIGNMENT_ENROLLMENT_TARGETING.md`: "Historical access for learners who were active when work was issued but later completed or withdrew is deferred until the product has a temporal assignment entitlement policy.") Building a correct temporal entitlement model (“was this learner actively enrolled in this cohort at the time this session occurred”) requires a decision this phase is not positioned to make alone — it affects Assignments, Live Learning, and any future domain with the same shape — so Phase 3 preserves the current safe (fail-closed) behavior rather than inventing a one-off rule for Live Learning alone. No learning history is deleted; the underlying `live_session_join_events` rows are untouched. The gap is in **who can currently see** that history, not in whether the history exists.

## Calendar Impact

No Calendar code changed. `useLearningCalendarEvents.js` already called `listLiveSessions(role)` → `GET /live-learning/sessions`, with zero client-side filtering — exactly the "upstream" fix pattern this phase relies on. Because the API itself now returns only entitled sessions, Month/Week/Agenda/Today/Weekly Load all automatically narrow to the same entitled set with no frontend change. Event identity (`createCalendarEventId("live-learning", session.id)`) and dedup (`dedupeCalendarEvents()`) were untouched and still guarantee one canonical Live Session maps to exactly one Calendar event. Failure isolation (`Promise.allSettled` in `useLearningCalendarEvents.js`) was untouched — a Live Learning fetch failure still leaves Assignments (and vice versa) rendering.

## Student DTO Safety

`toStudentFacing()` (`live-session.ts`) was extended with one field, `audienceScope` — not sensitive, and useful for a student to understand why a session is/isn't visible. `cohortId`, `organizationId`, `providerSessionId`, `accessPolicy`, and `recordingPolicy` remain excluded from the student-facing shape, unchanged from Phase 2A. Verified by `tests/live-learning.cohort-eligibility.test.ts`'s explicit forbidden-field assertion.

## Instructor / Location / Recording Metadata

No change this phase — deliberately out of scope (§18/§20 of the phase brief; avoid scope creep). Per the existing Calendar Capability Matrix, instructor display name resolution, recording availability, and material availability all remain **PARTIAL/MISSING** exactly as before. Phase 3 did not fabricate any of these.

## Non-Goals (this phase)

- Program-wide Live Learning targeting (no current product need; would require Program-level Enrollment enforcement not yet justified).
- Direct-invite/staff-only audience scopes.
- Temporal ("was active at the time") historical entitlement — see Historical Access Policy above.
- Instructor display-name resolution, recording/material availability.
- Any change to Calendar, Curriculum, Career, Assignments, or Store beyond the one stale test-count fix required for the migration count to stay internally consistent (`tests/career-phase3-postgres-runtime.test.ts`).
- Attendance generation from Calendar, Enrollment, or join-request state.
