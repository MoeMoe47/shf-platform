# SHF Learning Enrollment & Cohort Foundation

Status: Phase 1 implemented on 2026-08-30.

## Canonical Concepts

Organization is the institutional tenant. `users.organization_id` is a real organization relationship, but it is not a learning enrollment.

User is the person/account. Learners, instructors, and administrators are all users; authorization is derived from authenticated server-side identity and permissions.

Team is an organizational/business unit. Existing `teams` and `memberships.team_id` are not learner cohorts and must not be reinterpreted as cohorts.

Program is the structured SHF program/pathway. Enrollment references the existing `programs.program_id`; Phase 1 does not create another Program model.

Cohort is an administratively grouped, time-bounded set of learners participating in one Program inside one Organization.

Enrollment is the canonical participation relationship connecting one learner user to one Program, optionally through one Cohort.

Course/Curriculum owns learning content and completion. Phase 1 does not create course enrollment or lesson completion truth.

Assignment owns institutional work. Phase 1 does not rewrite assignment targeting; it exposes enrollment helpers for later targeting integration.

## Schema

Migration: `apps/shs-api/migrations/041_learning_enrollment_cohorts.sql`.

`cohorts`

- `cohort_id TEXT PRIMARY KEY`
- `organization_id TEXT NOT NULL REFERENCES organizations`
- `tenant_id TEXT NOT NULL CHECK (tenant_id = 'tenant:' || organization_id)`
- `program_id TEXT NOT NULL`
- `name TEXT NOT NULL`
- `description TEXT`
- `status TEXT NOT NULL CHECK (DRAFT, ACTIVE, COMPLETED, ARCHIVED)`
- `starts_at TIMESTAMPTZ NOT NULL`
- `ends_at TIMESTAMPTZ`
- `created_by_user_id TEXT NOT NULL REFERENCES users`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `version INTEGER NOT NULL DEFAULT 1`
- composite FK `(organization_id, program_id)` to `programs(organization_id, program_id)`

`enrollments`

- `enrollment_id TEXT PRIMARY KEY`
- `organization_id TEXT NOT NULL REFERENCES organizations`
- `tenant_id TEXT NOT NULL CHECK (tenant_id = 'tenant:' || organization_id)`
- `learner_user_id TEXT NOT NULL`
- `program_id TEXT NOT NULL`
- `cohort_id TEXT`
- `status TEXT NOT NULL CHECK (PENDING, ACTIVE, COMPLETED, WITHDRAWN, CANCELLED)`
- `enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `ends_at TIMESTAMPTZ`
- `created_by_user_id TEXT NOT NULL REFERENCES users`
- `updated_by_user_id TEXT REFERENCES users`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `version INTEGER NOT NULL DEFAULT 1`
- composite FK `(organization_id, learner_user_id)` to `users(organization_id, user_id)`
- composite FK `(organization_id, program_id)` to `programs(organization_id, program_id)`
- composite FK `(organization_id, cohort_id)` to `cohorts(organization_id, cohort_id)`

`cohort_staff`

- `cohort_staff_id TEXT PRIMARY KEY`
- `organization_id TEXT NOT NULL REFERENCES organizations`
- `tenant_id TEXT NOT NULL CHECK (tenant_id = 'tenant:' || organization_id)`
- `cohort_id TEXT NOT NULL`
- `user_id TEXT NOT NULL`
- `role TEXT NOT NULL CHECK (INSTRUCTOR, ADMINISTRATOR)`
- `status TEXT NOT NULL CHECK (ACTIVE, INACTIVE)`
- `created_by_user_id TEXT NOT NULL REFERENCES users`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- composite FK `(organization_id, cohort_id)` to cohorts
- composite FK `(organization_id, user_id)` to users

Indexes cover cohorts by tenant/org/program/status/date, enrollments by tenant/org/learner/status, program/status, cohort/status, one active/pending enrollment per learner/program, and one active staff role per cohort/user/role.

## APIs

Registered by `apps/shs-api/src/domain/enrollments/api/routes.ts`.

- `GET /enrollments/me`: learner reads their own enrollments.
- `GET /enrollments/:id`: direct-id read with tenant and relationship entitlement.
- `POST /enrollments`: admin/program manager enrollment creation.
- `PATCH /enrollments/:id/status`: lifecycle transition.
- `PATCH /enrollments/:id/cohort`: cohort transfer/removal within the same program/org.
- `POST /cohorts`: create cohort.
- `GET /cohorts/:id`: direct-id read with tenant and relationship entitlement.
- `PATCH /cohorts/:id`: cohort metadata/status update.
- `POST /cohorts/:id/staff`: assign instructor/administrator to a cohort.
- `GET /cohorts/:id/roster`: roster derived from enrollments.

## Permissions

Added to `SHS_SECURITY_PERMISSIONS`:

- `cohort.view`
- `cohort.manage`
- `enrollment.view`
- `enrollment.manage`

Students receive view-only. Instructors receive view-only and only gain roster visibility through `cohort_staff`. Organization administrators, SHF/SHS administrators, super admins, and program managers receive manage permissions according to the existing role map.

## Lifecycle

Cohort transitions:

- `DRAFT -> ACTIVE`
- `DRAFT -> ARCHIVED`
- `ACTIVE -> COMPLETED`
- `ACTIVE -> ARCHIVED`
- `COMPLETED -> ARCHIVED`
- `ARCHIVED` is terminal

Enrollment transitions:

- `PENDING -> ACTIVE`
- `PENDING -> CANCELLED`
- `ACTIVE -> COMPLETED`
- `ACTIVE -> WITHDRAWN`
- `COMPLETED`, `WITHDRAWN`, and `CANCELLED` are terminal

Enrollment `COMPLETED` is participation lifecycle only. It does not mean course completion, credential earned, assignment completed, assessment passed, or verified outcome achieved.

## Tenant Model

Routes derive organization scope from `req.user.active_organization_id` / `req.user.organization_id` and `req.user.tenant_id`. Client-supplied `organization_id` is ignored for create/update operations. The service rejects invalid tenant/org context and every repository query is constrained by organization.

Knowing a `cohort_id` or `enrollment_id` does not grant access. Direct-id reads return `null`/404 unless the actor is same-org and is an admin, the learner themself, or active cohort staff where applicable.

## Roster Semantics

Cohort roster is not a second membership table. It is derived from:

`cohorts.cohort_id <- enrollments.cohort_id <- enrollments.learner_user_id`.

`cohort_staff` is staff authorization only, not learner membership.

## Duplicate And Re-Enrollment Policy

Phase 1 allows a learner to enroll in multiple concurrent Programs.

Phase 1 blocks duplicate concurrent `PENDING`/`ACTIVE` enrollments for the same learner and Program.

Phase 1 allows re-enrollment in the same Program after terminal status, preserving history as a separate enrollment row.

Phase 1 allows cohort transfer within the same enrollment only when the destination cohort belongs to the same Organization and Program.

## Downstream Contracts

Assignments may later ask `EnrollmentService` whether a learner is actively enrolled in a Program or Cohort and list active enrollments. Assignment targeting should not query enrollment tables ad hoc.

Curriculum may later ask which active Program/Cohort relationships apply to the learner. Curriculum remains the owner of content, lessons, and completion.

Live Learning currently has `live_sessions.cohort_id` as an unenforced field and `live_session_join_events` as authorization/attendance truth. Phase 1 does not migrate Live Learning; a later phase can replace temporary cohort assumptions with canonical Cohort and Enrollment checks.

Calendar may later project meaningful enrollment/cohort dates. Phase 1 does not create calendar events, calendar tables, or Plan My Week behavior.

Career may later relate Programs to career pathways. Career status does not belong in Enrollment.

Credentials may later use Enrollment as eligibility context. Active/completed Enrollment does not equal credential eligibility or credential earned.

Truth/Evidence may later consume enrollment lifecycle events. Enrollment status does not assert verified training completion, credential, assessment, or outcome truth.

## Non-Goals

Phase 1 does not implement course enrollment, assignment submission, grading, credentials, career events, calendar projections, Plan My Week, pathway-aware planning, external calendars, reporting rewrites, or frontend redesign.

## Schema Integrity Reconciliation Update

The earlier `shs_dev` mismatch for migrations `035` through `038` has been reconciled by `apps/shs-api/migrations/042_reconcile_missing_035_038_schema.sql`. The affected ledger rows remain as historical `baseline-1` records, and `042` is the additive physical repair record. `shs_dev` now reports migrations `001` through `042` applied with no pending, drift, or unknown rows, and the critical schema integrity checker passes.

Because this mismatch was the only Phase 1 foundation blocker, Phase 1 can now be considered `PASS` for the Enrollment/Cohort foundation. The original partial finding remains historically accurate; this section records the explicit reconciliation update.

## Anti-Drift Invariants

1. Team is not Cohort.
2. Organization membership is not Enrollment.
3. Enrollment is not Assignment completion.
4. Enrollment is not Credential.
5. Cohort roster derives from Enrollment.
6. Browser state cannot establish institutional enrollment truth.
7. Tenant scope is server-derived.
8. Knowing an ID does not grant access.
9. Program/Cohort/Enrollment organization consistency is mandatory.
10. Historical enrollment should not silently disappear.
