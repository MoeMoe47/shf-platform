# SHF Career Events / Opportunities Foundation

Updated 2026-08-30 for SHF Ecosystem Phase 4.

## Scope

Phase 4 replaces the Learning Calendar's `DEMO_CAREER` and `DEMO_OPPORTUNITIES` demo fixtures with two new canonical backend domains — Career Event and Opportunity — reusing the Enrollment/Cohort foundation from Phase 1 for eligibility and the existing `organizations` table for host/source-organization identity. It does not redesign Calendar, Career Center, Curriculum, or Career Calendar's own separate demo aggregation (a different page, out of scope — see Non-Goals).

## Career Event Definition

A Career Event is a scheduled, time-based career-development or employer-engagement activity: a career fair, employer session, workshop, site visit, interview, hiring event, mentor session, apprenticeship info session, or networking event. It owns event identity, scheduling, delivery mode/location, host reference, capacity, registration-required flag, audience, and lifecycle status. It does **not** own attendance truth, credential truth, or employment outcome.

## Opportunity Definition

An Opportunity is something a learner may pursue: an internship, apprenticeship, scholarship, job, fellowship, training, or sponsored program. It owns opportunity identity, type, an application deadline (its one required date), optional opens/starts/ends dates, a real action destination (internal route or external URL), audience, and lifecycle status. It does **not** own an application record, an application lifecycle, or any employment outcome.

## Why These Stay Two Separate Domains

An Opportunity does not imply a scheduled event — "Data Center Internship" has a deadline, not a start/end time a Calendar month grid meaningfully blocks out. A Career Event does not imply anything pursuable — "Employer Career Fair" is attendance-based, not application-based. Collapsing them into one generic table because both eventually reach the same Calendar would blur that distinction at the source; instead each stays a distinct table with its own lifecycle vocabulary, and only the Calendar projection layer (see below) treats them as sibling event-shaped things.

## Pre-Existing Architecture Audit

- **Career pathway taxonomy** (`careers`, `career_families`, `career_curriculum_requirements`, migration `033`): models grade-band curriculum requirements per career, not events or opportunities. Confirmed unrelated to this phase's domains — reused nowhere here.
- **Employer/partner identity**: no dedicated Employer or Partner table exists. The existing `organizations` table already carries `org_type = 'partner'` rows (e.g. workforce partners) — reused directly as `host_organization_id` (Career Event) / `source_organization_id` (Opportunity), both nullable FKs to `organizations`. No new employer registry was built (per the phase's own instruction not to build an employer CRM).
- **Frontend demo sources**: `DEMO_CAREER` (one fixture, "Office Hours"), `DEMO_MENTOR` (one fixture, "Mentor Check-In"), `DEMO_OPPORTUNITIES` (three fixtures) in `src/pages/career/calendar/demoFixtures.js`. `OpportunityRadarCard.jsx` already consumed the generic merged Calendar events array filtered by `type === "opportunity"` rather than importing demo fixtures directly, so replacing the underlying producer required no component changes there.
- **Store Catalog** (`src/data/catalogOfferings.js`, `StoreCatalog.jsx`): audited and confirmed unrelated — it models purchasable organizational offerings (programs, curriculum bundles), not learner-facing internships/scholarships. Not reused.

## Significant Discovery: Migration 033 Was Also Ledger/Physical-Mismatched (Resolved in Phase 4.1)

While auditing whether Career Events/Opportunities could reference the canonical `careers`/`career_families` tables, this phase found that **`careers`, `career_families`, and `career_curriculum_requirements` (migration `033`) were physically absent from `shs_dev`** despite being ledgered as applied — the identical `runner_version = baseline-1`, `execution_duration_ms = 0` fingerprint already reconciled for migration `031` (Phase 3.1) and `035`-`038` (Phase 1.1). Further audit found **every migration from `001` through `038`** carried this same baseline fingerprint in `shs_dev`; `030` (`rate_limit_windows`) and `032` (`organization_relationships_program_stewardship`) were confirmed to share the same physical absence.

**This phase (4) did not fix migrations 030/032/033** — that was out of scope for a Career Events/Opportunities foundation phase, exactly as migration 031's fix was deferred into its own dedicated Phase 3.1 rather than folded into Phase 3. Career Event and Opportunity were built without an FK to `careers`/`career_families`, since doing so would have made this phase's own migration unsafe to apply to `shs_dev`.

**Update (Phase 4.1, 2026-08-30): reconciled.** A dedicated follow-up phase (mirroring 3.1's precedent) repaired all three migrations via `047_reconcile_missing_030_032_033_schema.sql` — see `SHF_DATABASE_MIGRATION_RECONCILIATION.md`'s "Migrations 030 / 032 / 033 Reconciliation" section. `careers`/`career_families`/`career_curriculum_requirements` now physically exist in `shs_dev` with their canonical seed record. **This document's own schema (migration `046`) was not changed** — Career Event and Opportunity still carry no FK to the Career taxonomy, because connecting them is real product/architecture work (which pathway a given Career Event or Opportunity belongs to, and how that should factor into eligibility) that Phase 4.1 correctly treated as out of its own narrow schema-repair scope. The blocker is gone; the linkage itself remains a candidate for a future phase.

## Schema

Migration `046_career_events_opportunities_foundation.sql` (additive, next after `045`):

**`career_events`**: `career_event_id` (PK), `organization_id`/`tenant_id`, `title`, `description`, `event_type` (bounded vocabulary: `CAREER_FAIR`, `EMPLOYER_SESSION`, `WORKSHOP`, `SITE_VISIT`, `INTERVIEW`, `HIRING_EVENT`, `MENTOR_SESSION`, `APPRENTICESHIP_INFO`, `NETWORKING`), `status` (`DRAFT`/`PUBLISHED`/`CANCELLED`/`COMPLETED`/`ARCHIVED`), `starts_at`/`ends_at` (`TIMESTAMPTZ`, real moments in time), `timezone`, `delivery_mode` (`IN_PERSON`/`VIRTUAL`/`HYBRID`), `location`, `host_organization_id`, `capacity`, `registration_required`, `audience_scope`/`program_id`/`cohort_id`, `created_by_user_id`, timestamps, `version`.

**`opportunities`**: `opportunity_id` (PK), `organization_id`/`tenant_id`, `title`, `description`, `opportunity_type` (`INTERNSHIP`/`APPRENTICESHIP`/`SCHOLARSHIP`/`JOB`/`FELLOWSHIP`/`TRAINING`/`SPONSORED_PROGRAM`/`OTHER`), `status` (`DRAFT`/`OPEN`/`CLOSED`/`CANCELLED`/`ARCHIVED`), `opens_at`/`application_deadline`/`starts_at`/`ends_at` (`DATE`, not `TIMESTAMPTZ` — see Timezone Handling below), `delivery_mode`, `location`, `source_organization_id`, `action_url`/`action_route`, `audience_scope`/`program_id`/`cohort_id`, `created_by_user_id`, timestamps, `version`.

Both tables share the identical audience shape as `live_sessions` (Phase 3), extended with `PROGRAM`: a `CHECK` constraint enforces exactly one of `(no program/cohort)`, `(program_id set)`, `(cohort_id set)` matching `audience_scope`, and same-organization FKs (`(organization_id, program_id) → programs`, `(organization_id, cohort_id) → cohorts`) reject cross-org targeting at the database level. `opportunities` additionally requires `action_url IS NOT NULL OR action_route IS NOT NULL` — an Opportunity can never be a dead end.

No historical migration was edited. `schema-integrity.ts`'s manifest was extended with `046` entries for both tables.

## Eligibility Model

Both domains share one eligibility module (`apps/shs-api/src/domain/shared/audience-eligibility.ts`) rather than duplicating the logic Live Learning (Phase 3) and Assignments (Phase 2) each already implement independently:

- **`ORGANIZATION`** scope: visible to any authenticated actor in the same organization.
- **`PROGRAM`** scope: visible only to a learner with an `ACTIVE` `enrollments` row for that `program_id`.
- **`COHORT`** scope: visible only to a learner with an `ACTIVE` `enrollments` row for that `cohort_id`.

Organization membership alone is never sufficient for `PROGRAM`/`COHORT` scope — the same invariant already locked for Assignments and Live Learning. No second membership model was created; `EnrollmentRepo.listActiveEnrollmentsForLearner()` is the only source of truth consulted.

## Enrollment/Cohort Integration

Creation-time validation (`validateAudienceScopeForCreate`) mirrors the Assignment/Live Learning precedent exactly: `PROGRAM` scope requires the program to exist in the actor's organization; `COHORT` scope requires the cohort to exist, be in the actor's organization, and be `ACTIVE` (not `DRAFT`/`COMPLETED`/`ARCHIVED`). Cross-org or unknown program/cohort references are rejected with `PROGRAM_NOT_FOUND`/`COHORT_NOT_FOUND` before any row is written.

## Career/Pathway Relationship

**Built in Phase 5.** No FK link to `careers`/`career_families` was added in this phase (4) — the physical blocker (migration 033 being absent from `shs_dev`) was resolved in Phase 4.1, and the linkage itself was built in Phase 5: `career_events`/`opportunities` gained optional `career_id`/`career_family_id` columns (migration 049), plus a server-computed `pathwayRelevant` boolean for student-tier reads, deterministically derived from the learner's own `ACTIVE Enrollment → Program → Career`. Career relevance remains strictly a category/relevance signal, never an access-control rule — the audience-scope entitlement described above is unchanged and unaffected by it. See `docs/SHF_CAREER_PATHWAY_INTEGRATION.md` for full detail.

## Instructor / Admin Authorization

- **Admin tier** (`shf_admin`, `shs_admin`, `org_admin`, `super_admin`, `program_manager`): full organization-scoped read/manage, unchanged privilege level from other phases — not expanded.
- **`ORGANIZATION`** scope creation requires admin tier.
- **`PROGRAM`** scope creation requires admin tier (mirrors "Program targets require an admin or program manager role" from the Assignment Phase 2 doc — `program_manager` is itself in `ADMIN_TIER_ROLES`).
- **`COHORT`** scope creation requires admin tier or active `cohort_staff` for that specific cohort — an instructor who is staff on Cohort A cannot create a Cohort B event (`COHORT_STAFF_REQUIRED`, verified by test).
- **Status transitions** (publish/cancel/close/archive) require the record's own creator, active cohort staff for a cohort-scoped record, or admin tier.

## Student Visibility

`GET /career-events` and `GET /opportunities` branch by actor tier (identical structure to Live Learning's `listSessionsForActor`): admin tier sees the full organization list; student-tier sees only `PUBLISHED`/`COMPLETED` Career Events or `OPEN` Opportunities matching institutional eligibility; instructor-tier sees records they created, `ORGANIZATION`-scope records, and `COHORT`-scope records for cohorts they actively staff. `DRAFT` is never visible to students. `CANCELLED` Career Events and `CLOSED`/`CANCELLED` Opportunities remain queryable by their creator/admin (never deleted) but drop out of student-facing lists and the Calendar projection.

## Direct-ID Security

`GET /career-events/:id` and `GET /opportunities/:id` apply the identical eligibility check used by list endpoints. An ineligible caller who knows a valid id receives `404`, not `403` — matching the Live Learning precedent so existence is never confirmed to an unauthorized caller. Verified with cross-cohort, cross-organization, and cross-org-admin direct-id tests for both domains.

## Career Event API

`GET /career-events`, `GET /career-events/:id`, `POST /career-events`, `PATCH /career-events/:id/status` (lifecycle: `DRAFT → PUBLISHED|CANCELLED`, `PUBLISHED → CANCELLED|COMPLETED`, `CANCELLED|COMPLETED → ARCHIVED`). No update-in-place PATCH for event details was built — out of scope; only status transitions, matching "only implement required operations."

## Opportunity API

`GET /opportunities`, `GET /opportunities/:id`, `POST /opportunities`, `PATCH /opportunities/:id/status` (lifecycle: `DRAFT → OPEN|CANCELLED`, `OPEN → CLOSED|CANCELLED`, `CLOSED|CANCELLED → ARCHIVED`). No application workflow was built — per the phase's own explicit instruction, an Opportunity's `action_url`/`action_route` is a real destination (validated: `action_url` must be `http(s)://`, `action_route` must start with `/`), never a fabricated "Applied" state.

## Calendar Career Event Projection

`useLearningCalendarEvents.js` gained `listCareerEvents(role)` alongside its existing `listLiveSessions`/`listAssignments` real sources, fetched via the same `Promise.allSettled` used for the others. One Career Event maps to exactly one Calendar event (`createCalendarEventId("career-event", id)`, `type: "career"`), using its real `startsAt`/`endsAt`. `CANCELLED` events are filtered out of the Calendar projection the same way Live Learning already filters `cancelled` sessions. Routes to `/coach` — the same real destination `DEMO_CAREER` already used, since no dedicated Career Event detail page exists and building one is out of scope this phase.

## Opportunity Calendar Projection

Only the application deadline is projected — never every date field on an Opportunity, per the phase's own "do not turn every Opportunity into arbitrary Calendar noise" instruction. Identity is `createCalendarEventId("opportunity", "<id>:deadline")` so a future second projection (e.g. a start date) can never collide with this one. `allDay: true` because `application_deadline` is a `DATE`, not a moment — see Timezone Handling.

## Opportunity Radar

`OpportunityRadarCard.jsx` required **no code change** — it has always filtered the shared merged Calendar events array by `type === "opportunity"` rather than importing `DEMO_OPPORTUNITIES` directly, so replacing the underlying producer with `mapOpportunityDeadline()`'s real output was sufficient. Verified live: an `OPEN` Opportunity with a real deadline appears in the Radar, Upcoming Deadlines, and the Opportunities filter view; an organization with none shows the pre-existing honest empty state ("No upcoming opportunities match your current pathway.") — never a fabricated placeholder.

## Truth / Outcome Boundary

Locked, unchanged from the phase brief: viewing a Career Event or Opportunity is not registering/applying; an Opportunity's `action_url`/`action_route` is a destination, not proof of an application; Career Event attendance is not tracked by this phase's domains at all (no attendance table was built — out of scope, matching "do not build registration unless existing infrastructure supports it"); nothing here writes toward `workforce_employment_outcomes` or any other outcome-truth table.

## Timezone Handling

Career Events use `TIMESTAMPTZ` for `starts_at`/`ends_at` — they are real moments in time, rendered through the Calendar's existing `dateUtils.js` (unchanged, not touched this phase). Opportunities use `DATE` for `opens_at`/`application_deadline`/`starts_at`/`ends_at` — deadlines are calendar days, and storing them as `TIMESTAMPTZ` would invite the exact UTC-midnight off-by-one bug the phase brief warned against. Verified by test: a `2026-11-15` deadline round-trips as the literal string `"2026-11-15"` through create → fetch, never shifted by a day.

## Failure Isolation

Career Event and Opportunity fetches are independent `Promise.allSettled` branches alongside Live Learning and Assignments — any one producer failing populates `unavailableSources` with that producer's name and leaves the other three rendering normally. Verified structurally (identical pattern to the already-verified Live Learning/Assignment failure isolation from prior phases); the merge only reports a full error state when *all four* real sources fail simultaneously.

## Non-Goals

- Opportunity applications, hiring outcome tracking, or any "Applied"/"Interviewing"/"Hired" state — no canonical application domain exists, and building one is explicitly out of scope.
- An employer/partner CRM — `organizations` (`org_type = 'partner'`) is reused as-is.
- Career Event registration/RSVP state — no existing infrastructure supports it, so none was fabricated.
- Career/CareerFamily/pathway linkage — built in Phase 5 (see `docs/SHF_CAREER_PATHWAY_INTEGRATION.md`).
- A dedicated Career Events or Opportunities list page, or any other new visual surface — Calendar/Career Center/Curriculum design is locked this phase.
- Any change to Career Calendar's own separate `collectAllEvents()` aggregation (`src/pages/career/calendar/adapters.js`'s "career"/"mentor"/"opportunity" adapters, `CareerCalendar.jsx`) — a different page, out of scope, exactly as Assignments (Wave 2A) and Live Learning (Phase 3) both left it.
- Reconciling migrations `030`, `032`, `033` — discovered, disclosed, deferred to a future phase.
