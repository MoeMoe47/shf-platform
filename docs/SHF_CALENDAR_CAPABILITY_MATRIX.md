# SHF Learning Calendar — Capability Matrix

Audited 2026-08-29; updated 2026-08-30 (Wave 2A — real Assignments), 2026-08-30 (Wave 2A.1 —
student-level entitlement hardening), 2026-08-30 (SHF Learning Ecosystem Phase 2 — Enrollment/Cohort
targeting reconciliation), 2026-08-30 (SHF Learning Ecosystem Phase 3 — Live Learning Enrollment/Cohort
reconciliation), 2026-08-30 (SHF Ecosystem Phase 4 — real Career Events + Opportunities), 2026-08-30
(SHF Ecosystem Phase 9 — Canonical Calendar Projection Service), and 2026-08-31 (SHF Ecosystem Phase 10 —
Calendar Intelligence Engine). Source of truth for what the Calendar
(`src/pages/curriculum/CurriculumCalendar.jsx` / `src/pages/career/CareerCalendar.jsx`, sharing the engine in
`src/pages/career/calendar/*`) actually does today, versus what it visually implies. Re-audit before claiming
any row's status has changed.

**Canonical Calendar Projection Service Phase 9 (2026-08-30):** cross-domain aggregation moved from six
separate frontend fetches (`useLearningCalendarEvents.js`) to one canonical backend endpoint,
`GET /calendar/events/me` (`apps/shs-api/src/domain/calendar/`). The backend now owns dedup (stable
`sourceDomain:sourceRecordId[:kind]` identity), ordering, and `Promise.allSettled`-based per-source failure
isolation that the frontend previously implemented itself; the frontend hook is now a thin fetch + type
translation layer. No new capability was added and no capability status below changed as a result — this
phase is a plumbing/architecture change only. Portfolio and Personal reminders remain frontend-only (no
backend Calendar producer exists for either); Arcade remains an explicit empty provider (no legitimate
scheduled-Arcade concept exists). See `docs/SHF_CALENDAR_PROJECTION_SERVICE.md` for the full architecture,
the Source Ownership Matrix, and the non-ownership principle.

**Wave 2A (2026-08-30):** replaced `DEMO_ASSIGNMENTS` with a real, authenticated, organization-scoped
Assignment backend for the Curriculum Calendar only (Career Calendar's own demo assignments adapter is
untouched — out of scope this Wave). Added deterministic Calendar event identity
(`createCalendarEventId(sourceDomain, sourceRecordId)`) and safe deduplication
(`dedupeCalendarEvents()`), both in `eventContract.js`, and used them for both real producers (Live Learning
and Assignments). Added per-source failure isolation with truthful source-specific warning text.

**Wave 2A.1 (2026-08-30):** Wave 2A's own report flagged that organization match alone was not the same as
student-level entitlement. Audited every candidate membership primitive in the repo (§C below and the Wave
2A.1 report §2) and found none usable for cohort/course/program targeting without semantic drift or
referencing tables that don't physically exist in this database. Added a real, minimal, explicit targeting
model instead: every assignment now has a required `visibility_scope` (`organization` \| `targeted`, never
defaulted) and, for targeted assignments, a real `assignment_targets` FK table. `GET /assignments` and
`GET /assignments/:id` now enforce this server-side for every role tier, proven by a 22-test suite including
direct-id (IDOR) probes and identity-smuggling attempts. See the Wave 2A.1 report for full detail.

**Learning Enrollment/Cohort Phase 1 (2026-08-30):** added canonical `cohorts`, `enrollments`, and
`cohort_staff` infrastructure for future Assignment, Live Learning, Curriculum, and Calendar entitlement.
Calendar behavior is unchanged in this phase: no enrollment/cohort dates are projected into Calendar yet.

**Assignment/Enrollment/Cohort Phase 2 (2026-08-30):** Assignment targeting now uses explicit canonical
target rows for `LEARNER`, `COHORT`, `PROGRAM`, and `ORGANIZATION`. Student Assignment reads are
server-derived from active Enrollments plus explicit direct/org targets; Calendar still consumes the same
`GET /assignments` feed and therefore receives only entitled assignments.

**Live Learning Enrollment/Cohort Phase 3 (2026-08-30):** `live_sessions` now carries an explicit
`audience_scope` (`ORGANIZATION` \| `COHORT`, migration `044`). Cohort-scoped session visibility, direct-id
reads, and join authorization are now derived server-side from active `enrollments` (students) and active
`cohort_staff` (instructors) — organization membership alone is no longer sufficient for a cohort-scoped
session. `GET /live-learning/sessions` (and therefore `useLearningCalendarEvents.js`) is unchanged at the
frontend/Calendar layer; the narrowing happens entirely upstream. See
`SHF_LIVE_LEARNING_ENROLLMENT_COHORT_RECONCILIATION.md` for full detail, including the documented historical-
access gap (a learner who leaves a cohort's active enrollment loses visibility into that cohort's past
sessions too — deferred, not fixed, same as the Phase 2 Assignment gap).

**Career Events / Opportunities Phase 4 (2026-08-30):** replaced `DEMO_CAREER` and `DEMO_OPPORTUNITIES` with
two new canonical backend domains (`career_events`, `opportunities`, migration `046`), both using the same
ORGANIZATION/PROGRAM/COHORT audience model as Live Learning, enforced against canonical Enrollment/Cohort.
`OpportunityRadarCard.jsx` needed no code change — it already read the generic merged event array. Discovered
(out of scope to fix in Phase 4 itself, resolved in Phase 4.1 below) that migrations `030`, `032`, and `033`
carried the same ledger/physical mismatch reconciled for `031` in Phase 3.1 — `careers`/`career_families`
were confirmed physically absent from `shs_dev` at the time, so Career Events/Opportunities do not link to
the Career/pathway taxonomy (that FK gap remains, even though the underlying tables now physically exist).
See `SHF_CAREER_EVENTS_OPPORTUNITIES_FOUNDATION.md` for full detail.

**Database / Career Foundation Phase 4.1 (2026-08-30):** reconciled migrations `030` (`rate_limit_windows`),
`032` (`organization_relationships` + `programs` stewardship columns), and `033` (`career_families`/
`careers`/`career_curriculum_requirements`) via `047_reconcile_missing_030_032_033_schema.sql`. This was not
a theoretical gap — `GET /programs` and `GET /careers` were live-broken (`GET /programs` crashed the running
API process) against `shs_dev` before this repair. No Calendar, Career Events, or Opportunities behavior
changed; this was schema-truth repair only. See `SHF_DATABASE_MIGRATION_RECONCILIATION.md`.

**Career Pathway Integration Phase 5 (2026-08-30):** `career_events`/`opportunities` gained optional
`careerId`/`careerFamilyId` linkage and a server-computed `pathwayRelevant` boolean for student-tier reads
(derived from `ACTIVE Enrollment → Program → program_careers → Career`, never an access-control rule — see
`SHF_CAREER_PATHWAY_INTEGRATION.md`). `useLearningCalendarEvents.js` carries these through into each Calendar
event's `metadata` — **no Calendar/Opportunity Radar/Career Center UI changed**; no rendering component reads
these fields yet, so no capability status below changes as a result of this phase. The data is real and
available for a future UI enhancement.

**Canonical Calendar Intelligence Engine Phase 10 (2026-08-31):** added a stateless, derived-advice-only
backend service (`GET /calendar/intelligence/me`) that calls the Phase 9 Projection Service exactly once
and computes Weekly Load, real scheduling-conflict detection, deadline concentration, honest SHF-only
"planning windows," and deterministic, explainable recommendations — never institutional truth, never a
mutation, never a fabricated personal-free-time claim (see `docs/SHF_CALENDAR_INTELLIGENCE.md`). Weekly Load
(§L) and Plan My Week (§M) below move from a type-blind local heuristic / static demo checklist to backed-by-
real-Intelligence, with graceful fallback to their prior behavior if Intelligence hasn't loaded. Conflict
detection (§P) goes from MISSING to REAL for the one case Phase 10 implements (`HARD_CONFLICT` between two
real-interval SCHEDULED_TIME events); `BACK_TO_BACK` and cross-domain "live session vs. career event" are
covered by the same general algorithm and not a separate implementation. No new capability was added to any
other row — Portfolio/Personal remain frontend-only, Arcade contributes no workload (no real scheduling
producer exists), and no Plan My Week persistence, AI planning, or external sync was introduced.

Status values: **REAL** (backed by canonical runtime data, working end-to-end) · **PARTIAL** (real
implementation, incomplete wiring/behavior) · **UI-ONLY** (interface exists, not backed by real behavior) ·
**MISSING** (no meaningful implementation) · **BLOCKED** (cannot be completed — required upstream
domain/data does not exist yet).

## How the Calendar is built

Every event, from every domain, is normalized into one shape (`createCalendarEvent()` in
`src/pages/career/calendar/eventContract.js`) before the UI ever sees it. Sources register as adapters in
`src/pages/career/calendar/adapters.js`; the UI only ever depends on the contract, never on a source
system's native shape. This is a genuinely good architecture — the gap is not in the projection model, it's
in how many of the adapters have a real producer behind them.

**As of Phase 9**, cross-domain aggregation is a canonical **backend** service:
`GET /calendar/events/me` (`apps/shs-api/src/domain/calendar/`) reads all six source domains
(Assignments, Live Learning, Career Events, Opportunities, Projects, Credentials) through
`Promise.allSettled`, applies each domain's own entitlement, dedupes by stable identity, orders
deterministically, and returns one already-entitled, already-ordered projection. Curriculum's
`useLearningCalendarEvents.js` now does one fetch (`src/lib/calendar/api.js`) and translates the backend's
9-value type registry into the page's existing 5-value `CalendarEventType` set — it no longer performs
aggregation, dedup, or failure-isolation itself. Portfolio and Personal reminders remain genuinely
frontend-only sources (no backend producer exists for either) and are merged in after the backend fetch, as
before. There is deliberately no `calendar_events` (or similarly named) database table — the service is
fully stateless and re-reads canonical sources on every request. See
`docs/SHF_CALENDAR_PROJECTION_SERVICE.md` for the full architecture.

## A. Core calendar

| Capability | Status | Notes |
|---|---|---|
| Month view | REAL | Renders the live merged event array; no mock rendering path. |
| Week view | PARTIAL | Real data, but a 7-column day-list (`CalendarWeekView.jsx`), not an hour-by-hour time grid — no current-time indicator. |
| Agenda view | REAL | Chronological grouped list off the same real array (`CalendarAgendaView.jsx`). |
| Today / prev / next nav | REAL | `dateUtils.js` — deliberately uses `parseLocalDate()` everywhere, not `new Date("YYYY-MM-DD")`, to avoid the classic UTC-midnight off-by-one-day bug. |
| Current-date highlighting | REAL | `.cal-dayCell.is-today` driven by real `today`. |
| Event filtering | REAL | Filters the real merged array by `EVENT_TYPE_META[type].filterGroup`. |
| Event detail interaction | REAL | `CalendarEventDetail.jsx` renders real event fields and routes to the owning domain (`linkBase` + `event.route`). |

## B. Curriculum

| Capability | Status | Notes |
|---|---|---|
| Lesson dates | MISSING | Backend `curriculum` domain (`apps/shs-api/src/domain/curriculum`) exposes exactly one route: `POST /curriculum/lessons/:id/complete`. No lesson schedule/date field exists anywhere server-side. |
| Module/course milestones | MISSING | Same — no dated milestone model in `curriculum` or `programs`. |
| Assignment-related course context | UI-ONLY | Demo assignment records carry no real `courseId`; can't be joined to a real course. |
| Assessment dates | MISSING | No assessment-date model found. |
| Course milestones | MISSING | Same as above. |

## C. Assignments

| Capability | Status | Notes |
|---|---|---|
| Due dates | **REAL** (Wave 2A, entitlement hardened in 2A.1) | `apps/shs-api`'s `assignments` domain: Postgres `assignments` table (org-scoped, real FK to `organizations`/`users`) → `AssignmentRepo` → `assignment-service.ts` → `GET /assignments` (permission-gated, org-**and-entitlement**-derived server-side) → `src/lib/assignments/api.js` → `useLearningCalendarEvents.js`. Verified live end-to-end, including the entitlement boundary: a student sees org-wide assignments plus any assignment directly targeted at their own user id, and nothing targeted at another student. `DEMO_ASSIGNMENTS` remains removed from the Curriculum Calendar's production aggregation. |
| Student entitlement (visibility scope) | **REAL** (Phase 2) | Organization match is no longer sufficient by itself. Every student-visible assignment requires an explicit target row. Student reads use server-derived active `enrollments` for `PROGRAM`/`COHORT`, direct `LEARNER` targets for individual work, and explicit `ORGANIZATION` targets for org-wide work. Direct-id reads use the same entitlement check. |
| Cohort/course/program targeting | **REAL for Cohort/Program; COURSE deliberately not supported** (Phase 2) | Canonical `COHORT` and `PROGRAM` targets are implemented through `assignment_targets` and active Enrollment entitlement. Course targeting remains out of scope because no canonical learner-course enrollment relation exists. `memberships.team_id` remains organizational team membership and is still not a cohort. |
| Instructor entitlement | **REAL** (Phase 2) | Non-admin instructors see assignments they created and cohort-targeted assignments for cohorts where they are active `cohort_staff`. Admin-tier roles (`shf_admin`/`shs_admin`/`org_admin`/`super_admin`/`program_manager`) retain tenant-scoped organization visibility/management according to permission maps. |
| Overdue state | PARTIAL | `computeDueState()` (backend model) derives Upcoming/Due Today/Due Soon/Overdue from real `due_at`, but nothing in the Calendar UI surfaces this label yet today. Unchanged this Wave. |
| Submission status | **BLOCKED** (deliberately, not an oversight) | No submission/grading domain exists anywhere in this repository — the Assignment model has NO submitted/completed field. Unchanged this Wave. |
| Action routing | **REAL** | Clicking a real assignment event routes to `/curriculum/asl/assignments` (real href, not `#`). Unchanged this Wave. |

## D. Live Learning

| Capability | Status | Notes |
|---|---|---|
| Scheduled live sessions | **REAL** | Full stack: Postgres `live_sessions` table (real schema: `course_id`, `module_id`, `lesson_id`, `instructor_id`, `cohort_id`, `audience_scope` (Phase 3), `access_policy_json`, ...) → `LiveSessionRepo` → `live-learning-service.ts` → `GET /live-learning/sessions` (org-scoped, permission-gated, **entitlement-derived as of Phase 3**) → `src/lib/liveLearning/api.js` → `useLearningCalendarEvents.js`. |
| Student entitlement (visibility scope) | **REAL** (Phase 3) | Organization match is no longer sufficient by itself for a cohort-scoped session. `listVisibleForStudent()` requires an `ACTIVE` `enrollments` row matching the session's `cohort_id`. `ORGANIZATION`-scoped sessions remain visible to any same-org student. Direct-id reads (`GET /live-learning/sessions/:id`) and join (`POST .../join`) use the identical check — an ineligible learner gets `404` on read, `403` on join. |
| Cohort/instructor targeting | **REAL** (Phase 3) | New sessions targeting a cohort require the creating instructor to be active `cohort_staff` for that cohort (or admin tier); the cohort must be `ACTIVE` (not `DRAFT`/`COMPLETED`/`ARCHIVED`). Cross-org cohort references are rejected by a database FK (`live_sessions_cohort_same_org_fk`), not just application logic. |
| Session start/end | REAL | `starts_at`/`ends_at` real timestamptz columns, rendered via the same real date utils. |
| Join action | REAL | `TodayPanel.jsx`'s `JoinButton` calls the real `requestJoin(role, sessionId)` — server-authorized, never a plain stored URL. Institutional eligibility (Phase 3) and provider/time-window policy (Phase 2A) are both required; verified: denial path (403 → `{allowed:false, reason}`) is handled, not assumed-allowed. |
| Instructor/host | PARTIAL | `instructor_id` is real; Calendar always labels it "Curriculum instruction" rather than resolving the real instructor's name (no instructor-profile join wired in `useLearningCalendarEvents.js`). |
| Location/online | **REAL** (Wave 2A) | `provider` (already present in the backend's student-facing DTO — see `toStudentFacing()`) is now carried through `useLearningCalendarEvents.js`'s `metadata.provider` and displayed on the Today panel (e.g. "With Curriculum instruction · Practice session" / "· Zoom"). Verified rendering live with zero console errors. |
| Recording/materials after session | MISSING (confirmed, not closed) | `recording_policy_json` is a policy *config* column, not a recording-exists flag — and `toStudentFacing()` deliberately excludes it from what students can see (no provider metadata). There is no real signal to project a "View Recording" action from without a backend change exposing one; left deferred rather than fabricated. |
| Attendance ownership | REAL (correctly out of scope) | `live_session_join_events` table exists server-side; Calendar never writes to it, matching the ownership boundary documented in `useLearningCalendarEvents.js`'s header comment. |

## E. Career (events)

| Capability | Status | Notes |
|---|---|---|
| Employer events / career fairs / workshops | **REAL** (Phase 4) | Full stack: Postgres `career_events` table (real schema, migration `046`) → `CareerEventRepo` → `career-event-service.ts` → `GET /career-events` (org-scoped, entitlement-derived) → `src/lib/careerEvents/api.js` → `useLearningCalendarEvents.js`. `DEMO_CAREER` removed from the Curriculum Calendar's production aggregation (Career Calendar's own separate `DEMO_CAREER` adapter is untouched — a different page, out of scope). Verified live end-to-end. |
| Student/instructor entitlement | **REAL** (Phase 4) | Same ORGANIZATION/PROGRAM/COHORT model as Live Learning (Phase 3), enforced against canonical `enrollments`/`cohort_staff`. `DRAFT` events are never student-visible; direct-id reads use the same check as list reads (404 on ineligible, not 403). |
| Interview sessions | **REAL** (Phase 4, as event type) | `INTERVIEW` is one of the nine bounded `event_type` values a real Career Event can carry. |
| Mentor sessions | UI-ONLY (Curriculum Calendar); PARTIAL (as a Career Event type) | `MENTOR_SESSION` is a real, bookable Career Event type as of Phase 4, but `DEMO_MENTOR` itself was never wired into the Curriculum Calendar's own aggregation (it was only ever in Career Calendar's separate, untouched `collectAllEvents()`), so nothing there changed this phase. |
| Career workshops | **REAL** (Phase 4, as event type) | `WORKSHOP` is a real `event_type` value. |
| Application deadlines | **REAL** (Phase 4, via Opportunity) | See §F — an application deadline is an Opportunity projection, not a Career Event. |

## F. Opportunities

| Capability | Status | Notes |
|---|---|---|
| Scholarships / internships / apprenticeships / employer opportunities | **REAL** (Phase 4) | Full stack: Postgres `opportunities` table (real schema, migration `046`) → `OpportunityRepo` → `opportunity-service.ts` → `GET /opportunities` (org-scoped, entitlement-derived, `OPEN`-only for students) → `src/lib/opportunities/api.js` → `useLearningCalendarEvents.js`'s `mapOpportunityDeadline()`. `DEMO_OPPORTUNITIES` removed from the Curriculum Calendar's production aggregation. `OpportunityRadarCard.jsx` required zero code changes — it already read the generic merged event array. Verified live end-to-end, including the honest empty state when an organization has none. |
| Student entitlement | **REAL** (Phase 4) | Same ORGANIZATION/PROGRAM/COHORT model as Career Events/Live Learning. `DRAFT`/`CLOSED`/`CANCELLED`/`ARCHIVED` are never student-visible; only `OPEN`. |
| Registration/application deadlines | **REAL** (Phase 4) | `application_deadline` is a real `DATE` column, projected as exactly one Calendar event per Opportunity (`opportunity:<id>:deadline`) — verified to round-trip without UTC-midnight drift. `route` is the Opportunity's own real `action_route` when internal; a purely external `action_url` renders the dialog's existing honest "No linked destination" state rather than a broken or fabricated link (building an external-link affordance into `CalendarEventDetail.jsx` is a Calendar UI change, out of scope this phase). |
| Applications | **BLOCKED** (deliberately, not an oversight) | No application/submission domain exists for Opportunities, matching the Assignment domain's own submission gap. An Opportunity's action destination is discoverability only — never a fabricated "Applied" state. |

## G. Portfolio

| Capability | Status | Notes |
|---|---|---|
| Review deadlines | UI-ONLY | `DEMO_PORTFOLIO`, one fixture in the Career Calendar adapter only. No canonical backend Portfolio scheduling producer exists. |
| Portfolio milestones | MISSING | No canonical Portfolio milestone/date source found. Phase 6 deliberately does not fabricate one. |
| Presentation dates | MISSING | No canonical Portfolio presentation/showcase source found. |

## H. Projects

| Capability | Status | Notes |
|---|---|---|
| Scheduled Project start/due dates | **REAL** (Phase 6) | Migration `050_project_scheduling.sql` adds `starts_at` and `due_at` to the existing `projects` table. `GET /projects/schedule` returns only entitled Project rows. Curriculum Calendar maps them through `createCalendarEventId("project", "<id>:start|due")`. |
| Capstone deadlines | **REAL** (Phase 6, via Project) | Capstone is `projects.project_type = 'CAPSTONE'`; no second Capstone engine. Due dates project from the canonical Project row. |
| Review dates | BLOCKED | Review is still an action/status on `project_submissions`, not a dated review scheduling field. No `review_due_at` was added. |
| Presentation dates | **REAL** (Phase 6, via Project) | `projects.presentation_at` projects separately as `project:<id>:presentation`; no Calendar-only Capstone row exists. |

## I. Credentials

| Capability | Status | Notes |
|---|---|---|
| Credential expiration date | **REAL** (Phase 7) | Migration `051_credentials.sql` (`credential_definitions`, `learner_credentials`). `GET /credentials/me` returns only the caller's own entitled issuances; Curriculum Calendar maps a real `expiresAt` to `credential:<id>:expiration` via the pre-existing `"credential"` `CalendarEventType`. |
| Credential renewal-due date | **REAL** (Phase 7) | Only projects when the Credential Definition has both a validity period and a renewal window — a lifetime credential never gets a fake renewal date. Maps to `credential:<id>:renewal`. |
| Assessment window / exam scheduling | MISSING | No Assessment/exam domain exists anywhere in the backend; no credential requirement in Phase 7 depends on one. |
| Certificate/QR public verification | DEFERRED | `verification_id` is generated and stored at issuance for a future verifier, but no QR/public-verification surface exists yet — see `docs/SHF_CREDENTIAL_ARCHITECTURE.md`. Not built rather than faked. |

## J. Learning Arcade

| Capability | Status | Notes |
|---|---|---|
| Activity/Attempt/Result/Mastery truth | **REAL** (Phase 8) | Migration `052_arcade_activities.sql`. `POST /arcade/attempts` + `POST /arcade/attempts/:id/result` — mastery is always server-derived from the Activity's own stored policy, never a client-supplied flag. See `docs/SHF_LEARNING_ARCADE_MASTERY_ARCHITECTURE.md`. |
| Scheduled challenges / competitions / assigned activities | MISSING (by design) | No legitimate scheduled Arcade concept exists in the product yet (no real games, no due dates). The `arcade` Calendar adapter remains an explicit empty provider. When a real due date is needed, the existing Assignment domain is the intended owner — not a second Arcade-specific deadline concept. |

## K. Community

| Capability | Status | Notes |
|---|---|---|
| Community events / volunteering / program events | **REAL, via reuse** (Phase 8) | No distinct Community domain exists or was built — every real community-facing activity (workshops, site visits, mentoring, networking) is already the canonical Career Event domain's own event type (Phase 4). See `docs/SHF_LEARNING_ARCADE_MASTERY_ARCHITECTURE.md`'s Community Domain Decision and `tests/community-classification.test.ts`. No adapter/table exists under a separate "Community" name because none is needed. |

## L. Summary cards

| Capability | Status | Notes |
|---|---|---|
| Today | REAL | Computed from the real merged event array (`SummaryRow.jsx`). Phase 6 Project/Capstone date projections enter the same event array; no separate Today source was added. |
| Due This Week | **REAL** (Phase 6 upgrade) | Assignment and Opportunity deadline inputs remain real; Project due dates now participate through `dueDate` on the Project due projection. |
| Opportunities | **REAL** (Phase 4) | Both the derivation and the inputs are now real — `application_deadline` from `GET /opportunities`, entitlement-filtered server-side (see §F). |
| Weekly Load | **REAL** (Phase 10 upgrade) | Backed by the real Calendar Intelligence Engine's typed components (`scheduledEventCount`, `requiredDeadlineCount`, `majorDeadlineCount`, ...) via a documented, explainable formula — see `docs/SHF_CALENDAR_INTELLIGENCE.md` §4. The four display buckets (Light/Balanced/Busy/Heavy) and their thresholds are unchanged; only the input became real classified data instead of a raw, type-blind event count. Falls back to the pre-Phase-10 local heuristic if Intelligence hasn't loaded. Still not duration-based beyond real scheduled-time minutes (§O). |

## M. Right intelligence rail

| Capability | Status | Notes |
|---|---|---|
| Today panel | REAL | |
| Upcoming Deadlines | **REAL** (Wave 2A upgrade, extended Phase 6) | Real Assignment deadlines, Opportunity application deadlines, and Project due dates render from the same merged event array without conflating source domains. |
| Opportunity Radar | **REAL** (Phase 4) | Real component, real data as of Phase 4 — `mapOpportunityDeadline()`'s output, filtered to `type === "opportunity"`, exactly as before; only the underlying producer changed. Honestly empty (not fabricated) when an organization has no eligible open opportunities — verified live. |
| Plan My Week | **PARTIAL → real recommendation engine** (Phase 10) | The button/card chrome is unchanged, but its content is now the real Calendar Intelligence Engine's deterministic, explainable recommendations (conflicts, deadline concentration, deadlines/renewals coming up soon) when Intelligence has loaded — each traces to a real event id and opens the real event on click. Still explicitly not a scheduling agent: advisory language only, no source-domain mutation, no personal-free-time claim, no persistence. Falls back to the pre-Phase-10 static open-assignment checklist if Intelligence hasn't loaded. |

## N. Journey Milestones

| Stage | Status | Notes |
|---|---|---|
| Program Start | **REAL** (Phase 6) | `GET /journey/milestones/me` projects `PROGRAM_START` from ACTIVE Enrollment `starts_at`, never account creation or login. |
| Project | **REAL** (Phase 6) | Entitled Project due dates project as Journey milestones. Completion requires owning-domain `project_submissions.status = 'ACCEPTED'`. |
| Capstone | **REAL** (Phase 6, via Project) | Capstone is a Project type; due/presentation milestones project from the Project row and do not complete from date passage. |
| Assessment | MISSING | No model. |
| Credential | **REAL** (Phase 7) | `CREDENTIAL_EARNED` projects only from `learner_credentials.status = 'ISSUED'` (never eligibility, never a revoked issuance). Persists after expiration (issuance history is never deleted) but disappears immediately on revocation. Feeds Tier 3 Celebration — see `docs/SHF_CELEBRATION_MILESTONE_LAYER.md`. |
| Career Event | **REAL** (Phase 6 projection over Phase 4 producer) | Visible Career Events project as Journey milestones; completion comes only from Career Event status, not date passage. |
| Arcade Mastery | **REAL** (Phase 8) | `ARCADE_MASTERY` projects only from a stored `arcade_results.mastery_achieved = true` row — never a mere Attempt, launch, or below-threshold score. First mastery of an Activity only; re-mastery never duplicates. Feeds Tier 1 Celebration — see `docs/SHF_CELEBRATION_MILESTONE_LAYER.md`. |

Current state renders canonical projected milestones when they exist and the same honest empty state when no producer has records for the learner.

## O. Planning intelligence

| Capability | Status | Notes |
|---|---|---|
| Estimated duration | MISSING | No field on any producer (assignment, lesson, or otherwise) carries an estimated-duration value. |
| Unscheduled work | MISSING | No concept of "incomplete work" distinct from "has a due date" exists in the projection. |
| Weekly load | REAL (see §L) | Count-based only, not duration-based. |
| Recommended work blocks | UI-ONLY | `Plan My Week` button exists, does nothing. |
| Approval before scheduling | N/A | Nothing schedules yet, so nothing to approve. |
| Pathway-aware planning | BLOCKED | See §P below. |

## P. Conflict intelligence

| Capability | Status |
|---|---|
| Overlapping live sessions | **REAL** (Phase 10) |
| Live session vs. career event | **REAL** (Phase 10, same general algorithm — any two real-interval SCHEDULED_TIME events) |
| Overlapping scheduled blocks | **REAL** (Phase 10) |
| Concentrated due dates | **REAL** (Phase 10, as Deadline Concentration — a distinct concept from a scheduling conflict) |
| Back-to-back warning | MISSING (deliberately) — no deterministic minimum-transition-gap policy exists anywhere in the product to justify one; conflated concepts are explicitly kept separate per `docs/SHF_CALENDAR_INTELLIGENCE.md` §5 |

Phase 10 added one general `HARD_CONFLICT` algorithm (`apps/shs-api/.../calendar-intelligence-service.ts`)
that detects any two overlapping real-interval SCHEDULED_TIME events (Live Learning, Career Event, Project
Presentation) — it is not three separate implementations. Deadline Concentration is a related but distinct
concept: 2+ DEADLINE-kind events within a rolling 48-hour window, never called a "conflict" since a deadline
has no duration to overlap with. See `docs/SHF_CALENDAR_INTELLIGENCE.md` for full semantics.

## Q. Learning Companion

| Capability | Status | Notes |
|---|---|---|
| Deadline nudge / conflict signal / pathway-relevant highlight | **REAL** (Phase 11) | `GET /companion/context/me` aggregates Calendar Intelligence, Journey, Career Pathway, and Credentials into a deterministic guidance list; `CompanionBubble.jsx` renders the top-priority item with a real navigate action. See `docs/SHF_LEARNING_COMPANION_INTELLIGENCE.md`. |
| Milestone celebration | **REAL** (Phase 6.1, unchanged) | Companion reacts to the existing Celebration Layer's `emitCompanionEvent()` calls only — Phase 11 added no second achievement path. |
| Long-form "Ask Coach" chat | DEMO/PLACEHOLDER (pre-existing, confirmed by Phase 11 audit) | `AIChat.jsx` calls no backend/LLM — it echoes a canned "Placeholder reply. In production, call your backend / OpenAI here." Unrelated to and unchanged by Phase 11, which deliberately does not add an LLM tutor. |

## R. External calendar readiness

| Capability | Status | Notes |
|---|---|---|
| ICS/webcal subscription export (Google/Outlook/Apple all supported via "subscribe by URL") | **REAL** (Phase 12) | `GET /calendar/feed.ics?token=...` — standards-compliant RFC 5545, private high-entropy revocable token, one-way read-only. See `docs/SHF_EXTERNAL_CALENDAR_INTEGRATION.md`. |
| Google Calendar OAuth connect / two-way sync | NOT IMPLEMENTED (Phase 12, justified) | Blocked on missing secure per-user OAuth token storage (no reversible encryption/KMS infrastructure exists) — an explicit, documented stop condition, not an oversight. |
| Microsoft Graph OAuth connect / two-way sync | NOT IMPLEMENTED (Phase 12, justified) | Same blocker as Google. |
| External free/busy ingestion | NOT IMPLEMENTED (Phase 12, justified) | Requires the same blocked OAuth infrastructure. |
| External/internal event distinction | N/A | Only relevant once bidirectional sync exists — the event contract's `source` field would support it without a contract change when built. |

---

## Producer → Calendar lineage (real & partial only)

```
Live Learning
  Postgres live_sessions (real schema, migrated; audience_scope + cohort FK as of Phase 3)
  → LiveSessionRepo (apps/shs-api/src/domain/live-learning/repo)
  → live-learning-service.ts (org-scoped, plus active-Enrollment/cohort_staff
    entitlement for COHORT-scoped sessions as of Phase 3)
  → GET /live-learning/sessions (requirePermission(LIVE_LEARNING_VIEW))
  → src/lib/liveLearning/api.js (Bearer dev-token in dev; cookie session in prod)
  → useLearningCalendarEvents.js → createCalendarEventId("live-learning", id)
    → createCalendarEvent(type: "instructor", metadata: {liveSessionId, provider})
  → month/week/agenda event + Today panel (now shows real provider label, Wave 2A)
  → Join button → requestJoin() → real server-authorized join or 403 denial

Assignments (Wave 2A — new; entitlement hardened in Wave 2A.1 and reconciled to Enrollment/Cohort in Phase 2)
  Postgres assignments (org-scoped FK) + assignment_targets (2A.1, real
    FK join table; Phase 2 adds canonical LEARNER/COHORT/PROGRAM/ORGANIZATION targets)
  → AssignmentRepo (apps/shs-api/src/domain/assignments/repo):
    listForOrganization (admin) / listForInstructor (creator or active cohort_staff) /
    listEntitledForStudent (student — explicit ORG/LEARNER target or active
    Enrollment-derived PROGRAM/COHORT target)
  → assignment-service.ts:listForUser() — role-branches to the correct
    repo method; documented gap: no COURSE targeting because no canonical
    learner-course enrollment model exists
  → GET /assignments (requirePermission(ASSIGNMENT_VIEW), entitlement
    applied server-side before any row reaches the response)
  → src/lib/assignments/api.js (same Bearer dev-token pattern) — no
    frontend change needed for 2A.1; entitlement is invisible to the
    Calendar client by design
  → useLearningCalendarEvents.js → createCalendarEventId("assignment", id)
    → createCalendarEvent(type: "assignment")
  → month/week/agenda event + Due This Week + Upcoming Deadlines (real
    "Go to assignment" route to /curriculum/asl/assignments)

Career Events (Phase 4 — new)
  Postgres career_events (org-scoped FK, audience_scope ORGANIZATION/
    PROGRAM/COHORT, migration 046)
  → CareerEventRepo (apps/shs-api/src/domain/career-events/repo):
    listForOrganization (admin) / listVisibleForInstructor (creator or
    active cohort_staff) / listVisibleForStudent (PUBLISHED/COMPLETED +
    active Enrollment-derived PROGRAM/COHORT match, or ORGANIZATION scope)
  → career-event-service.ts (shares audience-eligibility.ts with Opportunities)
  → GET /career-events (requirePermission(CAREER_EVENT_VIEW), entitlement
    applied server-side before any row reaches the response)
  → src/lib/careerEvents/api.js (same Bearer dev-token pattern)
  → useLearningCalendarEvents.js → createCalendarEventId("career-event", id)
    → createCalendarEvent(type: "career", metadata: {careerEventId, eventType, deliveryMode, location})
  → month/week/agenda event + Career filter + Today + Weekly Load
  → clicking routes to /coach (real route; no dedicated detail page built this phase)

Opportunities (Phase 4 — new)
  Postgres opportunities (org-scoped FK, audience_scope ORGANIZATION/
    PROGRAM/COHORT, DATE-typed deadline fields, migration 046)
  → OpportunityRepo (apps/shs-api/src/domain/opportunities/repo):
    listForOrganization (admin) / listVisibleForInstructor / listVisibleForStudent
    (OPEN + active Enrollment-derived PROGRAM/COHORT match, or ORGANIZATION scope)
  → opportunity-service.ts (shares audience-eligibility.ts with Career Events;
    validates action_url/action_route destination server-side)
  → GET /opportunities (requirePermission(OPPORTUNITY_VIEW), entitlement
    applied server-side)
  → src/lib/opportunities/api.js (same Bearer dev-token pattern)
  → useLearningCalendarEvents.js → createCalendarEventId("opportunity", "<id>:deadline")
    → createCalendarEvent(type: "opportunity", allDay: true, route: actionRoute || null)
  → month/agenda event + Opportunity Radar + Upcoming Deadlines + Due This Week
  → OpportunityRadarCard.jsx required zero code changes (already read the
    generic merged array by type)

Personal reminders
  localStorage (src/pages/career/calendar/reminders.js — the one legitimate
  local-truth source; user-owned, not institutional)
  → adapters.js "personal" adapter → createCalendarEvent(type: "personal")
  → month/agenda event, editable by the student only
```

All five real producers (Live Learning, Assignments, Career Events, Opportunities, Projects) are deduplicated via
`dedupeCalendarEvents()` before reaching the UI, and fail independently via the same `Promise.allSettled` —
verified live via network-level fault injection for Live Learning/Assignments (Wave 2A report) and
structurally identical for Career Events/Opportunities (Phase 4, same code path).

**Phase 9 update:** the diagrams above describe the pre-Phase-9 frontend-side call graph and remain accurate
for *which canonical table/service ultimately owns each fact* — that has not changed. What changed is the
hop between each service and the Calendar UI: as of Phase 9, every arrow from a `GET /<domain>` endpoint
into `useLearningCalendarEvents.js` is replaced by that same domain's service function being called
directly by a Calendar adapter (`apps/shs-api/src/domain/calendar/service/calendar-adapters.ts`) inside the
backend's own `Promise.allSettled` orchestration (`calendar-projection-service.ts`), which is what
`useLearningCalendarEvents.js` now calls (via `GET /calendar/events/me`) instead of six separate HTTP
fetches. Entitlement, dedup, and failure isolation all moved server-side with it. See
`docs/SHF_CALENDAR_PROJECTION_SERVICE.md` for the current lineage and the full Source Ownership Matrix
(including Projects/Credentials, added in Phases 6/7 after this section was last redrawn).

## Producer → Calendar lineage (demo-only, everything else)

```
Portfolio
  DEMO_PORTFOLIO array (src/pages/career/calendar/demoFixtures.js,
  offset-from-today so it never looks "stale," but not read from any real domain)
  → adapters.js "portfolio" adapter → createCalendarEvent()
  → month/agenda event + summary cards + rail
  → clicking routes to /portfolio, whose own content is separately demo-backed
```

(Assignments moved out of this list in Wave 2A; Career Events and Opportunities moved out of this list in
Phase 4 — see above for all three. Career Calendar's own separate `collectAllEvents()` aggregation
(`src/pages/career/calendar/adapters.js`'s own "career"/"mentor"/"opportunity"/"assignments" adapters,
`CareerCalendar.jsx`) is a different page and remains untouched and out of scope, exactly as it was left in
prior Waves/Phases.)

## Recommended next steps (see final report for Wave sequencing)

1. **Wave 1 (prior session):** Live Learning connectivity — root-caused and verified end-to-end (was an
   environment issue, not a code defect: `apps/shs-api` simply wasn't running).
2. **Wave 2A (this session):** real Assignments backend + Calendar producer, deterministic event identity,
   dedup, source-specific failure isolation, and Live Learning provider-label surfacing. Complete — see the
   Wave 2A report.
3. **Wave 2B → SHF Learning Ecosystem Phases 2/3/3.1 (complete):** cohort/enrollment-scoped Assignment
   visibility (Phase 2), Live Learning cohort/enrollment reconciliation (Phase 3), and the `curriculum_lesson_completions`
   migration-031 ledger/physical reconciliation (Phase 3.1) all closed. Overdue/due-soon status labels remain
   un-surfaced in the Calendar UI (`computeDueState()` still computes them, just not projected); instructor-name
   resolution for Live Learning remains open.
4. **SHF Ecosystem Phase 4 (complete):** real Career Events + Opportunities backend and Calendar producer,
   Opportunity Radar backed by real data. Discovered that migrations `030`/`032`/`033` carried the same
   ledger/physical mismatch as migration `031`.
5. **Database / Career Foundation Phase 4.1 (complete):** reconciled `030`/`032`/`033` the way Phase 3.1
   reconciled `031` — see above. This closed a live, crash-inducing defect (`GET /programs` was crashing the
   API process against `shs_dev`), not just a latent one.
6. **SHF Ecosystem Phase 5 (complete):** the real Career/pathway link for Career Events/Opportunities —
   `program_careers` join table, `GET/POST/DELETE /programs/:id/careers`, `GET /careers/:slug/programs`,
   `GET /careers/pathway/me` learner derivation, and `pathwayRelevant` on Career Events/Opportunities. Wired
   into Calendar event metadata only — no UI surfaced yet (see above).
7. **Next candidates:** surfacing `pathwayRelevant`/Career metadata in the Calendar/Opportunity Radar UI (data
   is real and ready, no backend work needed); Portfolio/Projects/Capstone dates (requires new date fields on
   existing domains, not new domains), Credentials, Arcade, Community, conflict detection, duration-based
   Weekly Load, Plan My Week engine, Learning Companion Calendar context, external calendar sync, Opportunity
   applications, Career Event registration.
8. **SHF Ecosystem Phase 9 (complete):** consolidated all six source-domain producers behind one canonical
   backend `GET /calendar/events/me`, with server-side entitlement, dedup, ordering, and partial/hard-failure
   isolation. No capability status changed; this closed the "frontend-only aggregation" architectural gap
   noted in every prior Wave's lineage diagram. Portfolio and Personal remain frontend-only by design (no
   canonical backend producer exists for either). See `docs/SHF_CALENDAR_PROJECTION_SERVICE.md`.
9. **SHF Ecosystem Phase 11.5 (complete):** a repository-wide census found Career Calendar
   (`src/pages/career/CareerCalendar.jsx`) had never been migrated onto Phase 9's canonical
   `GET /calendar/events/me` — it still ran a local `collectAllEvents()` aggregator with five
   hardcoded `DEMO_*` fixture sources presented with no demo label, indistinguishable from live
   data. Also found two Dashboard widgets (`UpcomingAssignmentsCard.jsx`,
   `CareerDashboard.jsx`) showing permanently hardcoded counts regardless of actual data. All
   three now derive from the canonical endpoint; no capability status above changed as a result
   (Assignments/Career Events/Opportunities/etc. were already REAL at the backend — only Career's
   own presentation layer was fake). No Instructor/Admin/Parent Calendar surface exists anywhere
   in the repository (confirmed by census, not assumed absent). See
   `docs/SHF_CALENDAR_SURFACE_UNIFICATION.md`.
10. **SHF Ecosystem Phase 12.1 (complete):** first reversible-encryption (AES-256-GCM) capability
    in this codebase, plus a secure OAuth state/PKCE/callback foundation — no Google/Microsoft
    Calendar behavior yet. See `docs/SHF_EXTERNAL_ACCOUNT_SECURITY.md`.
11. **SHF Ecosystem Phase 12.2:** real Google Calendar and Microsoft Outlook OAuth connect, one-way
    SHF → provider event mirroring, and privacy-minimal free/busy retrieval feeding a new,
    clearly-distinct `EXTERNAL_BUSY_CONFLICT` signal into Calendar Intelligence and Companion
    Context. Status: **IMPLEMENTED_NOT_LIVE_VERIFIED** for all three Google/Microsoft
    capabilities — real, complete, non-mocked production code exists and passes its full
    contract test suite against a `MockExternalCalendarProvider`, but no real Google/Microsoft
    app-registration credentials exist in this environment, so live provider acceptance has never
    been exercised (verified live in-browser: clicking "Connect" reaches the real backend route
    and receives an honest `PROVIDER_NOT_CONFIGURED` response, never a fabricated success). Apple/
    iCal subscription (Phase 12's own ICS feed) is unaffected and remains REAL. See
    `docs/SHF_EXTERNAL_CALENDAR_INTEGRATION.md` §13.
12. **SHF Ecosystem Phase 13 (Production Hardening, complete):** bounded per-request timeouts
    (`AbortController`, default 10s) added to every real Google/Microsoft HTTP call — a genuine
    latent defect from Phase 12.2 (no timeout existed) fixed before it reached production. Added a
    reused-pattern (mirrors `trusted-reporting/dispatcher.ts`/`worker.ts` exactly) optional
    background mirror-sync dispatcher/worker, advisory-lock-protected per connection against
    concurrent double-sync, plus bounded OAuth-authorization-state cleanup. Google/Microsoft
    status remains **IMPLEMENTED_NOT_LIVE_VERIFIED** (still no real credentials in this
    environment — unchanged from Phase 12.2, honestly not upgraded). Apple/iCal remains
    **STRUCTURALLY_VERIFIED_ONLY** (no real desktop/mobile Calendar client subscription test was
    performed this phase — the feed's own security/format properties are test-verified, but a real
    external client was not used to consume it). Background sync and provider webhooks are
    explicitly **DEFERRED** (justified in `docs/SHF_EXTERNAL_CALENDAR_INTEGRATION.md`'s Phase 13
    section — on-demand sync already satisfies mirror correctness; a webhook receiver adds
    freshness only, not correctness, and cannot be safely live-verified without real provider
    credentials). See `docs/SHF_EXTERNAL_CALENDAR_INTEGRATION.md` §14 and the Phase 13 report.
