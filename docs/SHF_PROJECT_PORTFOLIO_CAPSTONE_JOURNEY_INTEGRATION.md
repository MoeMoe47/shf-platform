# SHF Project / Portfolio / Capstone / Journey Integration

## Scope

Phase 6 adds canonical learner-progression dates to the Calendar without redesigning the Calendar UI and without creating completion truth from Calendar behavior.

Non-goals: celebration effects, credentials, arcade/community scheduling, Plan My Week intelligence, conflict detection, external calendar sync, portfolio tables, and a new Calendar-owned projection database.

## Project Ownership

Projects are owned by the existing Project domain:

- `projects`: identity, organization/tenant scope, optional `program_id`/`course_id`, `project_type`, lifecycle `status`, creator, and canonical schedule fields.
- `project_teams`: team relationship to a Project.
- `project_team_members`: learner participation and role derived from the learner's active specialization assignment.
- `project_submissions`: team submission lifecycle and review result.

Calendar does not create Projects, teams, submissions, reviews, evidence, or completion.

## Portfolio Ownership

No canonical backend Portfolio scheduling domain exists in this repository today. Student Portfolio and Career Center Portfolio surfaces are UI/projection-style surfaces over static or local content. Therefore Phase 6 does not add a Portfolio table, deadline, review row, or Calendar producer.

Existing Portfolio demo fixtures remain demo/UI-only in the Career Calendar adapter. The Curriculum Calendar does not treat Portfolio as canonical learner progression truth.

## Capstone Model

Capstone is represented as a Project type: `projects.project_type = 'CAPSTONE'`.

The existing `capstone-entry-service.ts` evaluates eligibility for Grade 12 Capstone entry. It is not a scheduling engine, not a completion engine, and not a separate Capstone domain. Capstone due and presentation dates are projected from the same canonical Project row.

## Schedule Semantics

Migration `050_project_scheduling.sql` adds:

- `projects.starts_at TIMESTAMPTZ`
- `projects.due_at TIMESTAMPTZ`
- `projects.presentation_at TIMESTAMPTZ`
- `projects_schedule_date_order`, requiring `due_at >= starts_at` and `presentation_at >= due_at` when both sides exist.
- `project_due_at_idx` for scheduled Project deadline reads.

`completed_at` is intentionally not added. Project completion is not a date-passage fact.

## Project Milestones

No separate `project_milestones` table is introduced. The current Project workflow has one Project row plus optional start/due/presentation dates; there is no proven independent milestone lifecycle requiring separate milestone records.

Calendar projection identities:

- `project:<projectId>:start`
- `project:<projectId>:due`
- `project:<projectId>:presentation`

The backend Project schedule endpoint returns one Project schedule DTO per entitled Project; the frontend expands that into the relevant event projections.

## Learner Entitlement

Learner Project entitlement is based on active `project_team_members` membership through `project_teams`, scoped by organization and tenant. A learner does not receive every organization Project, and Project Team is not treated as Cohort.

DRAFT Projects are hidden from learners. Admin-tier actors retain organization-scoped Project schedule visibility.

## Instructor / Reviewer Entitlement

No general instructor Project schedule entitlement was found. Phase 6 does not grant all instructors all organization Projects. The current Project schedule read requires `project.view`; tests prove `user_instructor_001` without a canonical Project relationship is denied.

Submission viewing/review remains behind existing Project submission permissions and organization/tenant checks.

## Completion Boundary

Calendar date passed does not complete a Project. Opening or viewing a Calendar event does not complete a Project. A submission in `SUBMITTED` state is not approval.

For Journey Milestones, Project/Capstone completion is only projected from owning-domain truth: an `ACCEPTED` `project_submissions` row for one of the learner's active teams.

## Evidence / Truth Boundary

Project submissions can carry `artifact_refs_json`, but Phase 6 does not create a competing Evidence/Truth table and does not write evidence from Calendar. Calendar and Journey consume read-only facts.

**(Phase 7 update)** Credentials are now implemented as canonical records —
see `docs/SHF_CREDENTIAL_ARCHITECTURE.md`. `learner_credentials` is a
separate table from Project's own `artifact_refs_json`; Phase 7 still does
not create a competing generic Evidence/Truth table, and Calendar/Journey
remain read-only consumers of Credential facts, never writers of them.

## Calendar Projection

The Curriculum Calendar now reads:

- Live Learning
- Assignments
- Career Events
- Opportunities
- Project schedule
- **(Phase 7) Learner Credentials** — expiration/renewal dates only, via `GET /credentials/me`
- existing shared local Portfolio/personal sources where already present

Project and Credential source failures are each isolated through the existing `Promise.allSettled` aggregation. If either fails, every other real source and the local sources can still render.

Project due dates participate in Today and Upcoming Deadlines through the existing event array because `dueDate` is set only for the due projection; Credential expiration/renewal dates participate the same way.

## Journey Milestone Projection

Journey Milestones is a read-only projection from canonical producers:

- `PROGRAM_START` from ACTIVE Enrollment `starts_at`.
- `PROJECT` from entitled Project `due_at`.
- `CAPSTONE` from entitled Project `project_type = 'CAPSTONE'` due/presentation dates.
- `CAREER_EVENT` from visible Career Events.
- **(Phase 7) `CREDENTIAL_EARNED`** from `learner_credentials.status = 'ISSUED'` — see `docs/SHF_CREDENTIAL_ARCHITECTURE.md`.

Assessment and Portfolio milestones are still not fabricated — no canonical producer exists for either.

## Celebration Layer Contract For Phase 6.1

Phase 6 did not implement confetti, fireworks, animation, or Learning Companion celebration behavior. Phase 6.1 implements the presentation layer described here without changing Calendar ownership or completion truth.

Future Phase 6.1 may consume only verified canonical achievement facts:

Verified canonical achievement -> Celebration Policy -> intensity tier -> visual response -> Learning Companion reaction -> optional progression presentation.

Valid future triggers must come from owning-domain truth, such as an accepted Project/Capstone submission or another verified achievement fact. Invalid triggers include viewing the Calendar, clicking an event, reaching a date, unverified browser state, or time spent in app.

Accessibility hooks required for Phase 6.1:

- reduced-motion compliance
- user/tenant celebration intensity setting
- non-motion alternative messaging
- no motion-only success communication

Implemented Phase 6.1 contract:

- shared frontend policy and host in `src/experience/celebrations/`
- automatic dedup by `sourceDomain + sourceRecordId + achievementType`
- no backend celebration write API
- no Calendar-triggered celebration truth
- Project/Capstone celebrations only from completed Journey projection records that derive from accepted Project submissions
- lesson acknowledgement only after backend curriculum completion synchronization succeeds

## Explicit Remaining Gaps

- No canonical Portfolio scheduling producer exists.
- No Assessment milestone producer is wired here.
- No independent Project milestone table is justified yet.
- No Project detail page route exists; Calendar Project events intentionally have no route until that page exists.
