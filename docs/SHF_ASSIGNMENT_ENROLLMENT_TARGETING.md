# SHF Assignment / Enrollment / Cohort Targeting

Updated 2026-08-30 for SHF Learning Ecosystem Phase 2.

## Scope

Phase 2 reconciles the existing Assignment domain with the canonical learning participation model. It does not create a second assignment system, a second cohort/enrollment model, submission/completion truth, grading, or Calendar redesign.

## Target Types

Assignment targets are explicit rows in `assignment_targets` and are constrained to:

- `LEARNER`: one learner user in the assignment organization.
- `COHORT`: one canonical `cohorts` row in the assignment organization.
- `PROGRAM`: one canonical `programs` row in the assignment organization.
- `ORGANIZATION`: explicit organization-wide assignment.

No-target assignments fail closed for student visibility. Organization-wide visibility is never inferred from null target columns.

## Entitlement Algorithm

Student reads derive access server-side:

1. The assignment must belong to the authenticated user's organization.
2. At least one explicit target must match:
   - `LEARNER` target for the authenticated `user_id`.
   - `COHORT` target for one of the learner's active enrollment `cohort_id` values.
   - `PROGRAM` target for one of the learner's active enrollment `program_id` values.
   - `ORGANIZATION` target in the same organization.
3. Multiple matching targets produce one assignment row.

The browser cannot widen access by sending learner, cohort, program, or organization ids. Assignment list and direct-id reads use the same entitlement rules.

## Enrollment And Cohort Semantics

`EnrollmentService.listActiveEnrollmentsForLearner()` is the Assignment domain's boundary for learner Program/Cohort participation. Phase 2 treats only `ACTIVE` enrollments as eligible for new assignment visibility. `PENDING`, `COMPLETED`, `WITHDRAWN`, and `CANCELLED` do not grant current assignment entitlement.

New `COHORT` targets require an `ACTIVE` canonical cohort. `ARCHIVED` cohorts are rejected for new assignment targets. Historical access for learners who were active when work was issued but later completed or withdrew is deferred until the product has a temporal assignment entitlement policy.

Enrollment status is not assignment completion. An active enrollment does not mean incomplete work, and a completed enrollment does not mean submitted or graded work.

## Validation And Constraints

Migration `043_assignment_canonical_targets.sql` adds explicit target columns and constraint-backed integrity:

- `assignment_targets.organization_id`
- `assignment_targets.target_type`
- nullable `user_id`, `cohort_id`, `program_id`
- exact-one target shape check
- assignment/user/cohort/program same-organization foreign keys
- partial uniqueness per assignment and target identity

The service also validates:

- learner exists in actor organization.
- cohort exists, is in actor organization, and is active.
- cohort target matches assignment `cohortId`/program relationship when present.
- program exists in actor organization.
- assignment program and target program are consistent when assignment program context is known.
- unsupported or invalid target combinations are rejected.

## Instructor And Admin Rules

Admin-tier roles remain tenant-scoped and can read/manage organization assignments according to existing permission maps.

Non-admin instructors can read assignments they created and cohort-targeted assignments for cohorts where they are active `cohort_staff`. Creating a cohort target requires the instructor to be active cohort staff for that cohort. Program targets require an admin or program manager role.

## Calendar Contract

Calendar behavior is unchanged structurally. The Curriculum Calendar still reads assignments through `src/lib/assignments/api.js` and projects them through `useLearningCalendarEvents.js` into `createCalendarEventId("assignment", assignment.id)`.

The security boundary is upstream: `GET /assignments` now returns only entitled assignments, so Month, Week, Agenda, Today, Due This Week, Upcoming Deadlines, and Weekly Load recalculate from the same entitled event array. Calendar does not broaden assignment access.

## Live Learning Boundary

Live Learning was audited read-only in Phase 2. `live_sessions.cohort_id` existed, but join/list authorization at that time still used only organization, role, status, time window, and provider policy. This was reconciled in Phase 3 (`SHF_LIVE_LEARNING_ENROLLMENT_COHORT_RECONCILIATION.md`): cohort-scoped Live Learning visibility, direct-id reads, and join authorization now derive from canonical `cohorts`, `cohort_staff`, and active `enrollments`, without changing Assignment semantics.

## Non-Goals

- Course targeting.
- Team-as-cohort behavior.
- StudentCourse shortcuts.
- Assignment submissions, grading, or completion state.
- Credentials, Career Events, Opportunities, external calendar sync, Plan My Week, or Learning Companion changes.
