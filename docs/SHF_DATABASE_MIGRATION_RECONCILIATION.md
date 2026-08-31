# SHF Database Migration Reconciliation

Status: Phase 1.1 reconciliation (migrations 035-038) completed on 2026-08-30. Phase 3.1 reconciliation (migration 031) completed on 2026-08-30. Phase 4.1 reconciliation (migrations 030, 032, 033) completed on 2026-08-30. Phase 4.2 (exhaustive migration/schema integrity verifier) completed on 2026-08-30 — PARTIAL by design (the verifier discovered 390 further gaps it correctly did not fix itself). Phase 4.3 (full baseline physical-schema reconciliation) completed on 2026-08-30 — **`shs_dev` now passes `db:schema:integrity:strict` with zero failures.** No known applied-migration/physical-schema gap remains in strict verifier coverage.

## Mismatch Discovered

The local `shs_dev` migration ledger recorded migrations `035` through `038` as applied, but the physical tables from those migrations were absent during the Phase 1 Enrollment/Cohort verification.

Fresh disposable database migration from `001` through `041` created the `035` through `038` objects successfully. That established the migration files as executable and narrowed the defect to the existing `shs_dev` ledger/schema state.

## Root Cause

Root cause: `shs_dev` contained baseline ledger rows for migrations `035` through `038`.

Evidence from `schema_migrations` before reconciliation:

- `035_program_specialization_assignments.sql`: `runner_version = baseline-1`, `execution_duration_ms = 0`
- `036_program_specialization_requests.sql`: `runner_version = baseline-1`, `execution_duration_ms = 0`
- `037_program_course_assignments.sql`: `runner_version = baseline-1`, `execution_duration_ms = 0`
- `038_projects_teams_submissions.sql`: `runner_version = baseline-1`, `execution_duration_ms = 0`

The repository migration runner has an explicit `baseline` command that inserts ledger rows without executing migration SQL. Normal `up` execution runs each migration inside `BEGIN`/`COMMIT`, inserts the ledger row in the same transaction, and rolls back on failure. The strongest supported cause is therefore historical use of the baseline path against `035` through `038`, not a normal runner transaction failure.

## Affected Migrations And Expected Objects

### Migration 035

File: `apps/shs-api/migrations/035_program_specialization_assignments.sql`

Expected table:

- `program_specialization_assignments`

Expected indexes and constraints:

- Primary key `program_specialization_assignments_pkey`
- Unique `(organization_id, assignment_id)`
- Foreign keys to `users`, `organizations`, and `programs`
- Check constraints for grade, stage, assignment type, status, source, and effective date order
- Partial unique index `program_specialization_active_primary_idx`
- Scope index `program_specialization_assignments_scope_idx`

### Migration 036

File: `apps/shs-api/migrations/036_program_specialization_requests.sql`

Expected table:

- `program_specialization_requests`

Expected indexes and constraints:

- Primary key `program_specialization_requests_pkey`
- Unique `(organization_id, request_id)`
- Foreign keys to `users`, `organizations`, `programs`, and `program_specialization_assignments`
- Check constraints for grade, stage, request type, status, and review metadata
- Partial unique index `program_specialization_pending_primary_request_idx`
- Scope index `program_specialization_requests_scope_idx`

### Migration 037

File: `apps/shs-api/migrations/037_program_course_assignments.sql`

Expected table:

- `program_course_assignments`

Expected indexes and constraints:

- Primary key `program_course_assignments_pkey`
- Unique `(organization_id, assignment_id)`
- Foreign keys to `users`, `organizations`, and `programs`
- Check constraints for grade, stage, and status
- Partial unique index `program_course_active_assignment_idx`
- Scope index `program_course_assignment_scope_idx`

### Migration 038

File: `apps/shs-api/migrations/038_projects_teams_submissions.sql`

Expected tables:

- `projects`
- `project_teams`
- `project_team_members`
- `project_submissions`

Expected indexes and constraints:

- Primary keys on all four tables
- Foreign keys from projects to `organizations`, `programs`, and `users`
- Foreign keys from teams, memberships, and submissions to their parent project/team/user/org records
- Unique `(team_id, learner_id)` for members
- Unique `(team_id, version)` for submissions
- Check constraints for project status, team mode/status, submission version/status
- Scope indexes `project_scope_idx`, `project_team_scope_idx`, and `project_submission_scope_idx`

## Actual State Before Repair

Before repair, `shs_dev` had ledger rows for `035` through `038` but lacked the expected physical objects. The rows were baseline ledger rows, not normal executed migration rows.

No rows existed in the missing tables because the tables did not exist. Related source table counts inspected after repair were:

- `organizations`: 2
- `users`: 5
- `programs`: 0
- `memberships`: 0
- `cases`: 3

There was no canonical source data from which to populate the repaired `035` through `038` tables. No fake seed rows were inserted.

## Repair Strategy

Repair used an additive migration:

`apps/shs-api/migrations/042_reconcile_missing_035_038_schema.sql`

The migration creates the canonical `035` through `038` objects in their current historical form using `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`. It does not delete data, alter existing populated tables, rewrite the ledger, or replay historical migrations through manual ledger deletion.

The existing `035` through `038` ledger rows remain as historical baseline records. Migration `042` is the honest record that physical schema reconciliation occurred.

## State After Repair

`shs_dev` now has all expected `035` through `038` tables physically present:

- `program_specialization_assignments`
- `program_specialization_requests`
- `program_course_assignments`
- `projects`
- `project_teams`
- `project_team_members`
- `project_submissions`

The expected indexes, primary keys, foreign keys, unique constraints, check constraints, column types, nullability, and defaults were verified from PostgreSQL catalogs.

Row counts after repair:

- `program_specialization_assignments`: 0
- `program_specialization_requests`: 0
- `program_course_assignments`: 0
- `projects`: 0
- `project_teams`: 0
- `project_team_members`: 0
- `project_submissions`: 0

The migration ledger reports `001` through `042` applied, no pending migrations, no checksum drift, and no unknown applied migrations.

## Later Migration Compatibility

Migrations `039`, `040`, and `041` are compatible with the repaired schema.

- `039_assignments.sql` creates the assignments table without depending on the repaired objects.
- `040_assignment_targeting.sql` adds assignment visibility/targeting and explicitly does not reinterpret the historical `035` through `038` objects as enrollment/cohort membership.
- `041_learning_enrollment_cohorts.sql` creates canonical `cohorts`, `enrollments`, and `cohort_staff` without conflicting with `035` through `038`.

Runtime code references the repaired objects in the Prepare/Prove, Program assignment, Curriculum completion, and Project services. Those references now have matching physical tables in `shs_dev`.

## Automated Prevention

Added a small critical-object manifest and checker:

- `apps/shs-api/src/db/schema-integrity.ts`
- `apps/shs-api/src/db/schema-integrity-check.ts`
- npm script `db:schema:integrity`
- regression coverage in `apps/shs-api/tests/schema-integrity.test.ts`

The checker detects the incident class where `schema_migrations` says a critical migration is applied but required physical tables, columns, indexes, or constraints are absent.

## Phase 1 Re-Evaluation

The prior Phase 1 Enrollment/Cohort foundation result was `PARTIAL` only because of the pre-existing `035` through `038` ledger/physical mismatch in `shs_dev`.

After reconciliation, Phase 1 can be considered `PASS` for this blocker: canonical Enrollment/Cohort objects remain present, the repaired historical objects are physically present, the ledger is clean, and the integrity checker passes.

## Remaining Risks (Phase 1.1)

The cause is proven for `shs_dev` as baseline ledger rows. The repository evidence does not prove who ran the baseline command or why. Other environments should run `db:schema:integrity` before Phase 2 integration to confirm they do not carry the same ledger/physical mismatch.

This risk materialized: Phase 3's Live Learning regression run discovered that migration `031` (`curriculum_lesson_completions`) carried the identical mismatch, undetected by the Phase 1.1 checker because its manifest only covered `035`-`038`. See the section below.

---

## Migration 031 Curriculum Lesson Completion Reconciliation

Status: Phase 3.1 reconciliation completed on 2026-08-30.

### Before State

Phase 3 (Live Learning/Enrollment/Cohort reconciliation) ran the full `shs_dev` regression suite and found one unrelated failure: `tests/curriculum-completion-runtime.test.ts` failed with `relation "curriculum_lesson_completions" does not exist` (Postgres error `42P01`), even though `db:migrate:status` and the then-current `db:schema:integrity` both reported clean.

Preflight for this phase reconfirmed the finding directly:

- `db:migrate:status`: `pending: []`, `drift: []`, `unknownApplied: []` (migration `031` shown as applied).
- `schema_migrations` row for `031`: `filename = 031_curriculum_lesson_completions.sql`, `runner_version = baseline-1`, `execution_duration_ms = 0`.
- `information_schema.tables` search for `%curriculum%`, `%lesson%`, `%completion%` in `shs_dev`: zero matches. The table did not exist under any name.

### Root Cause

Identical fingerprint to the `035`-`038` incident above: `runner_version = baseline-1` and `execution_duration_ms = 0` indicate the ledger row was written by the runner's `baseline` command (which inserts a ledger row without executing the migration's SQL), not by normal `up` execution. As with `035`-`038`, the repository has no record of who ran the baseline command or why — **operator/history is UNKNOWN**, stated rather than guessed.

### Canonical Schema Confirmation

Before repairing, the current canonical shape of `curriculum_lesson_completions` was confirmed against every piece of code that references it — `CurriculumCompletionRepo`, `CurriculumCompletionService`, `grade12-eligibility-service.ts`, and `capstone-entry-service.ts` — and found to be **unchanged** from migration `031`'s original 2026 SQL: `completion_id` (PK), `user_id`/`organization_id` (FKs to `users`/`organizations`), `curriculum_id`, `lesson_id`, `completed_at`, `idempotency_key`, `created_at`, a uniqueness constraint on `(organization_id, user_id, curriculum_id, lesson_id)` for idempotent completion, a uniqueness constraint on `(organization_id, idempotency_key)`, and a reporting index on `(organization_id, curriculum_id, completed_at)`. No column, constraint, or index was added or changed — the repair replays the original shape verbatim.

### Completion Ownership Boundary (reaffirmed, unchanged)

Curriculum owns lesson definition and the completion policy/evaluation boundary. Activity domains (assessments, reflections, arcade, project submissions, Live Learning attendance) own their own canonical execution facts. Evidence/Truth infrastructure owns verified institutional truth and reporting projections. The browser does not manufacture completion — `POST /curriculum/lessons/:id/complete` is the only write path, and this reconciliation changed no completion semantics, no policy, and no new completion behavior.

### Repair Strategy

Same strategy as `035`-`038`: an additive migration, not a rewrite of migration `031`'s ledger row.

`apps/shs-api/migrations/045_reconcile_curriculum_lesson_completions.sql` replays `031`'s exact table and index definitions, both already guarded with `IF NOT EXISTS` in the original SQL. This makes the repair a genuine no-op on any database where `031` already ran for real (every fresh database, and `shs_dev` itself once repaired) — verified directly: a fresh disposable database (`shs_phase31_fresh_verify`) ran migrations `001`-`045` with `pending: []` and no duplicate-object errors.

The `031` ledger row was left untouched — it remains the historical record that this migration was (incorrectly) baselined. Migration `045` is the honest record that physical schema reconciliation occurred, exactly mirroring how `042` relates to `035`-`038`.

### After State

`shs_dev`'s `curriculum_lesson_completions` table now physically exists with all expected columns, the primary key, both unique constraints, the reporting index, and both foreign keys, verified against PostgreSQL catalogs. `db:migrate:status` reports `001` through `045` applied, `pending: []`, `drift: []`, `unknownApplied: []`. `db:schema:integrity` reports `{"ok":true,"failures":[]}`.

`tests/curriculum-completion-runtime.test.ts` (the exact test Phase 3 reported as failing) now passes for the correct reason — the transaction it exercises actually inserts into a real table. A live `POST /curriculum/lessons/:id/complete` smoke test against `shs_dev` confirmed real persistence and idempotent repeat-request behavior (identical `completion_id` returned, no duplicate row), then had its disposable fixture data removed.

### Automated Prevention

`apps/shs-api/src/db/schema-integrity.ts`'s `CRITICAL_MIGRATION_OBJECTS` manifest (added for `035`-`038` in Phase 1.1) now also carries a `031: curriculum_lesson_completions` entry with its required columns, index, and constraints. `tests/schema-integrity.test.ts`'s manifest-coverage test was extended to assert this entry's presence. No second, parallel integrity mechanism was created — this extends the existing one, per the phase's own instruction.

### Fresh Database Result

`shs_phase31_fresh_verify`: migrations `001`-`045` applied cleanly (`pending: []`, `drift: []`), schema integrity PASS, `curriculum_lesson_completions` physically present with the expected shape, `/health` PASS, and 78 tests passed covering curriculum completion, Live Learning cohort-eligibility/security/provider, Assignment security, Enrollment/Cohort, schema-integrity, and migration-runner. Database dropped and removal confirmed.

### shs_dev Result

Pre- and post-repair `db:migrate:status` and `db:schema:integrity` both captured (see After State above). No unrelated data was touched — the repair only creates previously-absent objects. All disposable smoke-test fixtures were removed; `shs_dev` carries no Phase 3.1 test debris.

## Remaining Risks (Phase 3.1)

Root cause is proven to be the same `baseline-1` mechanism as `035`-`038`, but — as before — the specific operator/history is unrecorded and marked UNKNOWN rather than guessed. The schema-integrity manifest now covers every table this reconciliation effort has so far found affected (`031`, `035`-`038`, `041`, `043`, `044`), but it is a curated list, not an exhaustive scan of every table in the database — a `baseline` invocation against a migration not yet in the manifest would still go undetected until discovered the same way this one was (a regression-suite failure). Extending `db:schema:integrity` to a full, unconditional table/column diff against every migration file (rather than a curated critical-object list) would close this residual gap but was not undertaken here, matching this phase's narrow reconciliation-only scope.

This risk materialized again: Phase 4's Career Events/Opportunities audit discovered migrations `030`, `032`, and `033` carry the identical mismatch. See the section below.

---

## Migrations 030 / 032 / 033 Reconciliation

Status: Phase 4.1 reconciliation completed on 2026-08-30.

### Discovery And Ledger State

Phase 4 (Career Events/Opportunities) audited whether its new domains could reference the canonical Career/pathway taxonomy (`careers`/`career_families`, migration `033`) and found the tables physically absent from `shs_dev`. Broadening the audit to every migration's ledger row surfaced that **every migration from `001` through `038` in `shs_dev` carries `runner_version = 'baseline-1'`, `execution_duration_ms = 0`** — not just the previously-known `031`/`035`-`038`. A direct physical check of core tables in that range found most (`organizations`, `users`, `programs`, `teams`, `cases`, `audit_events`, `referral_details`, `live_sessions`, `live_session_join_events`, `integration_outbox`) genuinely exist despite the baseline row — they were evidently created by some other means before the ledger was baselined. Only three were confirmed both ledgered-as-applied and physically absent: `030` (`rate_limit_windows.sql`), `032` (`organization_relationships_program_stewardship.sql`), `033` (`career_workforce_foundation.sql`).

### Migration 030 — Physical State

`rate_limit_windows` table: **absent**. Consumer: `src/security/rate-limit.ts`'s production-mode rate limiter (`consumeRateLimit`), which uses an in-memory `Map` fallback in non-production environments — this is why the gap caused no visible failures in `shs_dev`'s dev/test-mode usage until this audit, but would throw `rate_limit_backend_unavailable` on every request in a production-mode deployment against this database.

### Migration 032 — Physical State

`organization_relationships` table: **absent**. `programs.program_classification` / `owner_organization_id` / `operator_organization_id` / `accountable_organization_id` columns: **absent**. `btree_gist` extension: **not installed**. Two `role_permissions` rows (`organization.relationship.view`/`.manage` for `role_org_admin`): **absent**.

This one is not theoretical — it is a **live, crash-inducing defect**, confirmed directly: `GET /programs` (a mounted, real route, `src/domain/programs/api/routes.ts` → `ProgramRepo.listPrograms()`) crashed the running `shs-api` Node process against `shs_dev` with `error: column "program_classification" does not exist` (Postgres code `42703`), because `ProgramRepo`'s `SELECT` unconditionally references these columns. `GET /organization-relationships` returned `500 INTERNAL_ERROR` for the same reason (missing table).

### Migration 033 — Physical State

`career_families`, `careers`, `career_curriculum_requirements` tables: **absent**, including migration `033`'s own seed rows (one `career_family`, one `career`, one `career_curriculum_requirement` — described in the migration's own comment as a "minimal architecture proof record," not fake production data). `GET /careers` (mounted, real route) returned `500 INTERNAL_ERROR`.

### Root Cause

Identical fingerprint to `031` and `035`-`038`: `runner_version = baseline-1` / `execution_duration_ms = 0` indicates the runner's `baseline` command wrote these ledger rows without executing their SQL. As with the prior incidents, the specific operator/history is **UNKNOWN** — no repository evidence identifies who ran `baseline` against this wider range or why. This is stated as evidence-based fact (the fingerprint), not inferred motive.

### Canonical Schema Confirmation

All three migrations' physical shapes were confirmed unchanged against current consumers before repair:

- `rate_limit_windows`: `src/security/rate-limit.ts`'s `INSERT ... ON CONFLICT` query uses exactly `limiter_key, window_started_at, window_seconds, request_count, expires_at` — matches migration `030` verbatim.
- `organization_relationships` + `programs` columns: `OrganizationRelationshipRepo` and `ProgramRepo` reference exactly the columns migration `032` defines — no evolution.
- `career_families`/`careers`/`career_curriculum_requirements`: `CareerRepo` and `career-foundation.test.ts` (which asserts against the migration `033` SQL text directly) confirm the shape and seed record are unchanged.

No schema evolution beyond the original three migrations was found; the repair replays each verbatim.

### Repair Strategy

One additive migration, `apps/shs-api/migrations/047_reconcile_missing_030_032_033_schema.sql`, combining all three reconciliations (mirroring `042`'s precedent of combining multiple migrations' repairs into one file). Every statement is guarded exactly as each original migration already guarded it (`CREATE TABLE/INDEX IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, conditional `DO $$ ... pg_constraint ...` blocks for the two constraints that lack an `IF NOT EXISTS` form, `INSERT ... ON CONFLICT DO UPDATE`/`DO NOTHING`), making the migration a genuine no-op on any database where these migrations ran for real — verified directly against a fresh disposable database (`shs_phase41_fresh_verify`): migrations `001`-`047` applied with zero duplicate-object errors.

The `030`/`032`/`033` ledger rows were left untouched — they remain the historical record that these migrations were (incorrectly) baselined. Migration `047` is the honest record that physical reconciliation occurred.

### Data Safety

No pre-existing data anywhere in `shs_dev` corresponded to `rate_limit_windows`, `organization_relationships`, or the Career taxonomy tables — all three were simply empty/nonexistent, confirmed by `organizations`/`programs` row counts before and after repair being unchanged (`programs`: 0 rows both before and after; `organizations`: 3 rows, unchanged). Migration `033`'s own single seed record set was inserted exactly as the original migration specifies — this is the migration's own architecture-proof data, not fabricated for this reconciliation. No destructive transformation, no invented data.

### State After Repair

All five objects (`rate_limit_windows`, `organization_relationships`, `programs`' four new columns, `career_families`, `careers`, `career_curriculum_requirements`) physically exist in `shs_dev` with correct columns, types, defaults, primary keys, foreign keys, unique/check constraints (including the `EXCLUDE USING gist` overlap-prevention constraint on `organization_relationships` and the `btree_gist` extension it depends on), and indexes — verified against PostgreSQL catalogs directly. `GET /programs`, `GET /careers`, and `GET /organization-relationships` all now return `200` against `shs_dev`; the API process no longer crashes.

### Automated Prevention

`apps/shs-api/src/db/schema-integrity.ts`'s manifest extended with six new entries: `030:rate_limit_windows`, `032:organization_relationships`, `032:programs` (the four added columns/constraints), `033:career_families`, `033:careers`, `033:career_curriculum_requirements`. `tests/schema-integrity.test.ts`'s coverage assertion extended to match. No second integrity mechanism was created.

### Fresh Database Result

`shs_phase41_fresh_verify`: migrations `001`-`047` applied cleanly (`pending: []`, `drift: []`), schema integrity PASS, all six manifest objects physically present with correct shape, seed record present, `/health` PASS, `GET /programs`/`GET /careers` both `200`, and the full 276-test suite passed (271 pass, 5 skipped, 0 fail). Database dropped and removal confirmed.

### shs_dev Result

Pre-repair state captured (ledger rows, physical absence, live crash) as documented above. Post-repair: `migrate:status` clean (`pending: []`, `drift: []`, `unknownApplied: []`), `schema:integrity` PASS, `/health` PASS, previously-crashing routes verified fixed, full 276-test suite passed. No unexpected data changes; no debris left.

## Remaining Risks (Phase 4.1)

Root cause mechanism proven (the same `baseline-1` pattern), operator/history still UNKNOWN. The schema-integrity manifest is now larger but remains a curated list, not an exhaustive migration-vs-schema diff — the same residual gap noted in Phase 3.1 still applies to any migration not yet added to the manifest. Given this is now the *third* time this exact class of issue has been discovered incrementally (031, then 030/032/033), a full automated migration-vs-physical-schema diff (rather than a hand-curated critical-object list) is a strong candidate for a future phase, so this class of defect stops being discovered one regression-suite failure at a time.

This is exactly what Phase 4.2 built. It also stopped being a hypothetical: running the new verifier against `shs_dev` immediately surfaced 390 more real gaps.

---

## Exhaustive Migration / Physical Schema Integrity (Phase 4.2)

Status: verifier complete and proven 2026-08-30. **Newly discovered gaps NOT reconciled by this phase** — see "shs_dev Exhaustive Result" below.

### Why The Curated Manifest Was Insufficient

`CRITICAL_MIGRATION_OBJECTS` (in `schema-integrity.ts`) only ever grew reactively — an entry was added for `031`, `035`-`038`, `041`, `043`, `044`, `046`, then `030`/`032`/`033`, in each case *after* a regression-suite failure or a live crash surfaced the gap. Anything not yet added stayed invisible no matter how broken it physically was. Phase 4.2's objective was to close that blind spot structurally rather than by continuing to append entries one incident at a time.

### Expectation Registry Design

Rejected: a general-purpose SQL parser (fragile, unbounded scope for a 47-file, single-project migration history). Rejected: a manually-authored exhaustive manifest for all 47 migrations (the exact reactive-authoring problem this phase exists to eliminate, just done once instead of incrementally).

Built instead: `apps/shs-api/src/db/migration-expectation-parser.ts` — a **bounded extractor**, not a general SQL parser, scoped to the narrow DDL vocabulary this repository's migrations have actually used from `001` through `047` (verified by repo-wide search before writing it): `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `CREATE [UNIQUE] INDEX IF NOT EXISTS ... ON`, `CREATE EXTENSION IF NOT EXISTS`, and named `CONSTRAINT` clauses (inline or via `ALTER TABLE ADD CONSTRAINT`). No trigger, view, function, or stored-procedure DDL exists anywhere in this repository's migrations.

The registry is **generated fresh from the migration files on every run** (`censusMigrationExpectations()` in `exhaustive-schema-integrity.ts`), not a checked-in generated artifact — the migration files themselves are the one source of truth, so there is nothing to keep in sync or let go stale.

### Object Types Covered

`table`, `column`, `index`, `constraint` (any explicitly-named `CONSTRAINT`, covering CHECK/FK/UNIQUE/EXCLUDE clauses that use one), `primary_key` (derived from any inline or table-level `PRIMARY KEY`, using Postgres' deterministic `<table>_pkey` auto-naming — safe because no table name in this repository is anywhere near the identifier length where that naming could truncate), `extension`.

**Known, disclosed limitation**: inline `UNIQUE`/`CHECK` constraints written *without* an explicit `CONSTRAINT` name rely on Postgres' auto-generated name, which is not predicted (name-length truncation makes that unreliable) and not yet verified structurally (e.g. by columns covered + constraint type via `pg_constraint`). Every constraint this project's actual incident history has touched already uses an explicit name, so this gap has not caused an undetected incident to date — but it is a real, acknowledged gap, not a silently-skipped one.

### Ledger-Aware Verification

An expectation is only enforced when its owning migration ID is present in `schema_migrations` (i.e., recorded applied). A pending migration's expectations are never treated as failures — that is `db:migrate:status`'s job, not the integrity checker's.

### Baseline Diagnostics

For every applied migration whose `runner_version` starts with `baseline` and `execution_duration_ms = 0`, the result's `baselineAppliedMigrations` array names it — this makes the historical failure pattern (baseline row written without the migration's SQL ever running) visible at a glance. Critically, a baseline-applied migration is **not** automatically treated as broken: if its physical objects are genuinely present (verified directly in a disposable-database test — see "Baseline Failure Simulation" below), the check still passes. Physical verification, not ledger metadata, decides pass/fail; the metadata is diagnostic context only.

### Current-State Evolution Handling

Repo-wide search confirmed **zero** `DROP TABLE`, `DROP COLUMN`, `RENAME`, or `ALTER COLUMN ... TYPE` statements anywhere in the migration history — every migration is purely additive at the table/column level. This means an expectation extracted from migration N's own text is always the correct *current* canonical expectation; no later migration ever invalidates an earlier one's column definition, so no re-attribution logic was needed. The one narrower exception found — `DROP CONSTRAINT IF EXISTS X` immediately followed by `ADD CONSTRAINT X` with the identical name (migrations `020`/`021`/`026`/`029` redefine a CHECK constraint's condition this way) — still doesn't require re-attribution, since the constraint's *name* survives unchanged; the parser's `SQL_NOISE_WORDS` filter exists specifically so the `DROP` clause's own `IF`/`EXISTS` tokens are never mistaken for a constraint name.

### Reconciliation Migration Handling

No special-case logic was needed here either. A reconciliation migration (`042`, `045`, `047`) that replays an original migration's exact SQL produces its **own** set of expectations for the same physical objects. Since both the original and the reconciliation migration are recorded applied, both sets of expectations get checked — redundantly, but harmlessly, since they describe the same real object. When an object is missing, the checker groups all contributing migration IDs into one failure entry (see `exhaustive-schema-integrity.ts`'s `failureKey`/`contributingMigrations` grouping) instead of reporting the same missing table twice under two different migration IDs.

### Command Usage

- `npm run db:schema:integrity` — unchanged, the original curated `CRITICAL_MIGRATION_OBJECTS` check. Fast, kept for backward compatibility and for the richer per-object index assertions it already had.
- `npm run db:schema:integrity:strict` — new. Runs the exhaustive census-based check. Output: `{ ok, checkedMigrations, checkedObjects, failures, baselineAppliedMigrations }`. Each failure names its `objectType`, `table`, `name`, and every `contributingMigrations` entry (with `appliedViaBaseline`).

### Historical Failure Simulation

In a disposable database (`shs_phase42_fresh_verify`, migrations `001`-`047` applied for real): `DROP TABLE careers CASCADE;` (never run against `shs_dev`). The strict checker immediately reported `ok: false` with 12 failures, all correctly scoped to `careers` (the table itself, all 9 columns, the primary key, and its one index), correctly citing both `033` (original) and `047` (reconciliation) as contributing migrations. This proves the checker detects the exact defect class this project has repeatedly hit.

### Baseline Failure Simulation

On the same disposable database, `UPDATE schema_migrations SET runner_version='baseline-1', execution_duration_ms=0 WHERE migration_id='041'` (cohorts/enrollments/cohort_staff — fully physically intact). Result: `041` appeared in `baselineAppliedMigrations` (diagnostic visibility), but produced **zero** new failures — proving physical verification, not ledger metadata, decides pass/fail, exactly as designed. The pre-existing 12 `careers` failures were unaffected. The disposable database was dropped immediately after both simulations; `shs_dev`'s ledger was never touched.

### shs_dev Exhaustive Result

`{ "ok": false, "checkedMigrations": 47, "checkedObjects": 1261 }` — **390 failures**, spanning 19 migrations (`008`, `012`-`029`, `034`) and 23 tables (`report_drafts`, `report_draft_revisions`, `report_artifacts`, `report_distribution_recipients`, `report_disclosure_decisions`, `report_distributions`, `report_public_eligibility_decisions`, `report_public_disclosure_decisions`, `report_public_disclosure_policies`, `report_public_disclosure_policy_signoffs`, `report_public_snapshots`, `report_publication_authorities`, `report_publication_release_approvals`, `report_publication_authorizations`, `report_publications`, `shf_public_impact_projections`, `identity_provider_links`, `shs_identity_sessions`, `integration_outbox`, `prepare_prove_activity_results`, `prepare_prove_evidence`, `competency_definitions`, `learner_competency_decisions`).

This was verified to be **real, not a parser artifact**: the identical check against a genuinely fresh database (migrations `001`-`047` run for real) returned `ok: true` with **zero** failures across the same 1261 checked objects — proving the extractor has no false positives and that every one of these 390 gaps is authentic historical drift in `shs_dev`, sharing the same `baseline-1`/`0ms` ledger fingerprint as every other incident in this document.

**Confirmed live, not theoretical**: `GET /prepare-prove/competency-definitions/monitoring-proof` (a real, mounted route) crashed the running `shs-api` process against `shs_dev` with `error: relation "competency_definitions" does not exist` — the same crash class already fixed for `/programs` and `/careers` in Phase 4.1, now found in a different subsystem (the "Prepare/Prove" evidence-competency domain, migration `034`).

### Newly Discovered Mismatches

**Yes — material, not reconciled by this phase.** Per this phase's own stop conditions ("Return PARTIAL if a new physical-schema mismatch is discovered" / "no undiscovered material schema mismatch remains in covered migrations" is a PASS requirement), this phase's own verdict is **PARTIAL**. Building and proving the exhaustive verifier was this phase's job; discovering 390 further gaps across a large, separate subsystem (the SHF BOS reporting/trusted-reporting/public-disclosure governance domain, migrations `008`/`012`-`029`, plus the Prepare/Prove evidence-competency domain, migration `034`) is real, dedicated reconciliation work on the scale of Phase 4.1 or larger, and reconciling it inline here would have been exactly the kind of undisciplined scope expansion this project's phased structure exists to prevent. This is intentionally left for a future dedicated phase (see the capability matrix / next-candidates note for a suggested "Phase 4.3").

### Fresh Database Verification

`shs_phase42_clean_verify`: migrations `001`-`047` applied cleanly, `db:schema:integrity` PASS, `db:schema:integrity:strict` PASS (`ok: true`, 0 failures, 0 baseline-applied migrations — as expected, since every migration ran for real), API booted, `/health` PASS, full 276-test suite passed. Dropped and confirmed removed.

### Performance

All six pg_catalog/information_schema queries (`schema_migrations`, `information_schema.tables`, `information_schema.columns`, `pg_indexes`, `pg_constraint`, `pg_extension`) are issued exactly once each, regardless of how many of the 1261+ expectations are being checked — no per-object query. (Originally parallelized via `Promise.all`; changed to sequential in Phase 4.3 — see that section's "Baseline Guard" note — because `buildPhysicalObjectExistenceCheck()` is now also called with a single `Client`/`PoolClient` connection, which cannot run concurrent queries safely.) The full exhaustive check still completes in well under a second against `shs_dev`.

### CI / Deployment Recommendation

No CI configuration exists in this repository for the backend test suite specifically (deployment/CI infrastructure for `apps/shs-api` was not found as an existing, safely-extensible system this phase could integrate into without guessing at unrelated infrastructure). **Recommendation, not implemented this phase**: run `npm run db:schema:integrity:strict` as a required step immediately after `npm run db:migrate` in any deployment pipeline, and fail the deploy on a non-zero exit code — this project's own incident history (five separate discovered-late incidents: `031`, `035`-`038`, `030`/`032`/`033`, and now `008`/`012`-`029`/`034`) is a strong argument for gating on this rather than relying on regression tests or live crashes to surface it.

### Startup / Runtime Enforcement — Deliberately Unchanged

`src/server.ts`'s existing startup sequence does not currently run any schema-integrity check before accepting traffic. This phase does not change that. Per its own instruction ("Do not make this change casually... if current startup architecture does not enforce schema integrity, leave runtime startup behavior unchanged and document recommended deployment gate"), enforcement is documented as a **deployment-pipeline** recommendation (above), not added to the request path or to server startup. No request-path schema-integrity checks were added anywhere — the checker is a CLI/deployment tool, never invoked per-request.

### Known Limitations

- Auto-named (unnamed) `UNIQUE`/`CHECK` constraints are not structurally verified (documented above).
- The census covers every migration `001`-`047`, but a brand-new migration `048`+ that introduces DDL vocabulary outside the parser's bounded set (a trigger, a view, a stored procedure — none exist today) would need the parser extended, not just the migration file added. This is a maintenance note, not a current gap.
- 390 newly-discovered failures remained unreconciled at the end of Phase 4.2 — **reconciled in Phase 4.3, see below.**

---

## Phase 4.3 Full Baseline Physical-Schema Reconciliation

Status: completed 2026-08-30. **`shs_dev` now passes `db:schema:integrity:strict` with zero failures.**

### Starting State

Re-ran preflight against current HEAD rather than trusting the Phase 4.2 report: `db:migrate:status` clean, `db:schema:integrity` (curated) PASS, `db:schema:integrity:strict` (exhaustive) — **390 failures**, 47 migrations checked, 1261 objects checked.

### Root-Object Analysis

390 expectation failures were not 390 independent defects. Grouped by physical table, they collapsed to **23 root objects**:

- **22 fully-absent tables** (LEDGER ONLY — the table itself, every column, its primary key, and its indexes all failed): `report_drafts`, `report_draft_revisions` (008); `report_artifacts` (012, extended by 015); `report_distribution_recipients`, `report_disclosure_decisions` (013); `report_distributions` (014); `report_public_eligibility_decisions` (016); `report_public_disclosure_decisions` (017, extended by 021); `report_public_disclosure_policies` (018, extended by 019); `report_public_disclosure_policy_signoffs` (019, extended by 020); `report_public_snapshots` (022, extended by 023); `report_publication_authorities`, `report_publication_release_approvals`, `report_publication_authorizations` (024); `report_publications`, `shf_public_impact_projections` (025, extended by 026); `identity_provider_links`, `shs_identity_sessions` (028); `prepare_prove_activity_results`, `prepare_prove_evidence`, `competency_definitions`, `learner_competency_decisions` (034).
- **1 PARTIAL PHYSICAL table**: `integration_outbox` — the table itself (migration 007) was already physically present and correctly excluded from the failure set; only migration 029's later hardening (5 columns, 1 constraint, 2 indexes) was missing.
- **2 migrations audited and confirmed already correct, excluded from repair**: migration `007` (`integration_outbox`'s own base table) and migration `027` (all four `truth_public_population_*` tables) — both physically present and passed the strict check untouched.

### Affected Domain Map

- **Reporting / Trusted Reporting / Public Disclosure Governance** (008, 012-026): report drafting, artifact generation, distribution authorization, public-eligibility and public-disclosure decisions, disclosure policy + sign-offs, public snapshots, publication authority/release/authorization, and the public Impact projection. The largest group by far — 17 of the 20 affected migrations.
- **Identity** (028): Auth0 provider links and SHS-owned browser sessions.
- **Trusted Reporting Worker Hardening** (029): outbox lease/quarantine columns on the already-existing `integration_outbox` table.
- **Prepare / Prove / Competency** (034): activity results, evidence, competency definitions, and learner competency decisions — the domain with the confirmed live crash.

### Migration 008 Reconciliation

`report_drafts` + `report_draft_revisions`: fully absent, replayed verbatim (both already `CREATE TABLE/INDEX IF NOT EXISTS`-guarded).

### Migrations 012-029 Reconciliation

All fully idempotent as originally written (`CREATE TABLE/INDEX IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`) **except** four `ALTER TABLE ... ADD CONSTRAINT` statements that redefine an existing CHECK constraint's condition via a preceding `DROP CONSTRAINT IF EXISTS` (migrations 020, 021, 026, 029) — `ADD CONSTRAINT` has no `IF NOT EXISTS` form in Postgres, so replaying these verbatim would fail on a fresh database (where the constraint already exists for real). All four were wrapped in the same `DO $$ ... IF NOT EXISTS (SELECT FROM pg_constraint ...) $$` guard already established for exactly this situation in migration 032 (Phase 4.1) — their historical `DROP CONSTRAINT IF EXISTS` step was omitted since the repair establishes the current, final condition directly rather than replaying a since-superseded intermediate one. Domain breakdown: 012/015 → `report_artifacts`; 013 → `report_distribution_recipients`/`report_disclosure_decisions`; 014 → `report_distributions`; 016 → `report_public_eligibility_decisions`; 017/021 → `report_public_disclosure_decisions`; 018/019/020 → `report_public_disclosure_policies`/`_policy_signoffs`; 022/023 → `report_public_snapshots`; 024 → `report_publication_authorities`/`_release_approvals`/`_authorizations`; 025/026 → `report_publications`/`shf_public_impact_projections`; 028 → `identity_provider_links`/`shs_identity_sessions`; 029 → `integration_outbox` hardening.

### Migration 034 Reconciliation

`prepare_prove_activity_results` → `prepare_prove_evidence` → `competency_definitions` → `learner_competency_decisions`, replayed in their original file's FK-dependency-safe order, plus the one required seed record (`competency_prepare_prove_monitoring_finding`) — real canonical reference data `PrepareProveService.getProofDefinition()` depends on (confirmed by the live crash this repair fixes), not fabricated/demo data, replayed with the original's `ON CONFLICT (slug) DO NOTHING`.

### Repair Dependency Order

One combined migration, statements ordered exactly as the affected migrations' own real dependency graph requires: 008 → 012 → 013 → 014 → 015 → 016 → 017 → 018 → 019 → 020 → 021 → 022 → 023 → 024 → 025 → 026 → 028 → 029 → 034 (007 and 027 excluded — already correct). Every forward reference (e.g. 013's `report_disclosure_decisions` referencing 012's `report_artifacts`; 024's authorizations referencing 016/017/022; 025's publications referencing 024's authorizations) resolves correctly because its referenced table is created earlier in the same file.

### Repair Migration(s)

One file: `apps/shs-api/migrations/048_reconcile_missing_008_012to029_034_schema.sql`. A single combined migration was chosen over domain-scoped ones (matching this project's own established precedent — `042` and `047` each already combined multiple, materially-different domains into one reconciliation) because every repair here is the identical mechanical operation (replay guarded original DDL) regardless of which subsystem owns the table, and the migration runner already wraps the whole file in one transaction, so splitting it would only multiply ledger rows for zero added safety.

### Historical Ledger Treatment

The 008/012-029/034 ledger rows were left untouched — they remain the historical record that these migrations were (incorrectly) baselined. Migration `048` is the honest record that physical reconciliation occurred.

### Data Safety

Captured before repair: `integration_outbox` (the one pre-existing affected table) had **0 rows** and **0 distinct `delivery_status` values** — zero risk of the new CHECK constraint rejecting existing data. `organizations` (3 rows) and `users` (120 rows) — the only tables referenced via FK by every repaired table — were unaffected (read-only references, never modified). All 22 other affected tables were fully absent, so there was no existing data to migrate, transform, or lose. No destructive operation of any kind was performed.

### Required Reference Data

One record restored: migration 034's own `competency_prepare_prove_monitoring_finding` seed (see Migration 034 Reconciliation above) — the same single "architecture proof" record the original migration always specified. No demo users, enrollments, outcomes, opportunities, lessons, or other fake institutional activity was added anywhere in this repair.

### Prepare / Prove Repair

`GET /prepare-prove/competency-definitions/monitoring-proof` crashed the running API process before repair (`relation "competency_definitions" does not exist`) and returns `200` with the real competency record after repair — verified live, both against `shs_dev` and a fresh disposable database. `PrepareProveService.getProofDefinition()` itself is self-healing (it upserts its own canonical `PROOF_CONFIGS` values into `competency_definitions` on every call, independent of the migration's seed) — its crash was purely from the missing *table*, not the missing seed row; the seed row was restored anyway because migration 034 always specified it as required reference data. No fake competency proof was generated; authorization behavior (`CURRICULUM_LESSON_COMPLETE` permission gate) is unchanged.

### Reporting / Trusted Reporting Repair

Schema only — restoring these 17 tables makes the existing reporting/disclosure/publication *code* able to run without crashing; it does not create, approve, or publish any report, disclosure decision, policy sign-off, snapshot, or publication record. `GET /public/impact/curriculum-lesson-completions` (previously would have failed the same way `/programs`/`/careers` did) now returns `200` with an honest empty list (`{"items":[]}`) — proving the schema works without any report data existing, exactly the correct post-repair state for a producer/Evidence/Truth/metric boundary that owns no data of its own creation.

### Other Domain Repairs

Identity (028): `identity_provider_links`/`shs_identity_sessions` restored, unverified live beyond the strict schema check (no seeded test data exists to exercise a login flow against `shs_dev` without fabricating identity records, which was out of scope). Trusted Reporting worker hardening (029): `integration_outbox`'s lease/quarantine columns and indexes restored on the already-populated-in-principle (currently empty) table — no behavior change, only makes the existing worker code's queries valid.

### Strict Failure Count By Wave

**390 → 0**, in a single wave. Every one of the 19 affected migrations' SQL was already fully idempotent except the four constraint statements identified above, which were fixed with the same guard pattern already proven in migration 032 — so one combined, carefully-ordered reconciliation migration resolved every failure on the first attempt. No count regression was observed at any point.

### Physical Catalog Verification

Verified directly against PostgreSQL catalogs post-repair (not just "migration ran"): `GET /programs`/`/careers`/`/prepare-prove/...`/`/public/impact/...` all return `200`; `db:schema:integrity:strict` independently confirms every column/index/constraint/extension for all 23 root objects (not just table existence) via `information_schema.columns`, `pg_indexes`, `pg_constraint`, and `pg_extension`.

### shs_dev Final Strict Integrity

```
{ "ok": true, "checkedMigrations": 48, "checkedObjects": 1652, "failures": [] }
```

`db:migrate:status`: `pending: []`, `drift: []`, `unknownApplied: []`.

### Fresh Database Verification

`shs_phase43_fresh_verify` and (after the baseline guard was added) `shs_phase43_final_verify`: migrations 001-048 applied cleanly with zero duplicate-object errors, `db:schema:integrity` and `db:schema:integrity:strict` both `ok:true`/zero failures, API booted, `/health` and both previously-broken routes (`/prepare-prove/...`, `/programs`) returned `200`, full 289/290-test suite passed. Both dropped and confirmed removed.

### Regression Suite

Full suite (not targeted): 290 tests, 284 pass / 6 skipped (env-var-gated disposable-DB tests, one newly added — see Baseline Guard below) / 0 fail, on both `shs_dev` and fresh databases. `npm run typecheck` and `npm run build` both clean. No product behavior changed anywhere.

### Baseline Command Audit

Audited `baselineMigrations()` in `migration-runner.ts`: it never checked physical schema before Phase 4.3 — it only validated ledger consistency (`assertSafeStatus`), then unconditionally inserted a `runner_version = baseline-*` row. **Yes, anyone could still baseline a migration today without its physical schema existing** — this is the exact mechanism behind every incident in this document.

### Baseline Prevention Guard

Added the smallest safe guard: before `baselineMigrations()` writes a ledger row for a migration not already applied, it now parses that migration's own SQL (`migration-expectation-parser.ts` — the same parser Phase 4.2 built) and verifies every expected table/column/index/constraint/extension is physically present (`findMissingPhysicalObjects()`, a new export from `exhaustive-schema-integrity.ts`, sharing its one source of truth for "does this exist" with `db:schema:integrity:strict` — not a second detector to keep in sync). If anything is missing, baseline is refused with a `BaselineSchemaVerificationError` naming the migration and every missing object, and no ledger row is written. An explicit `{ force: true }` option (wired to a new `--force` CLI flag on `db:migrate:baseline`) bypasses the guard for a deliberate, acknowledged override — never the default.

While implementing this, found and fixed a related issue: the exhaustive checker's five catalog queries were run via `Promise.all`, which is unsafe when `executor` is a single `Client`/`PoolClient` (as `baselineMigrations` uses, to keep its whole operation on one transaction) — a single Postgres connection cannot run concurrent queries, and node-postgres only papers over it today with a deprecation warning. Changed to sequential (still exactly 5 fixed queries regardless of object count, so the O(1) performance property is unchanged) and added a regression test.

New test: `tests/baseline-schema-guard.test.ts` (disposable-DB-gated), covering both required cases — a synthetic migration whose table doesn't exist is refused (no ledger row written) and the same migration succeeds once the table is created for real.

### Remaining Applied/Physical Gaps

**NONE.** `db:schema:integrity:strict` against `shs_dev` returns `ok: true` with zero failures across all 48 currently-applied migrations and 1652 checked objects.

### Files Changed

- `apps/shs-api/migrations/048_reconcile_missing_008_012to029_034_schema.sql` (new)
- `apps/shs-api/src/db/exhaustive-schema-integrity.ts` (extended: `buildPhysicalObjectExistenceCheck`, `findMissingPhysicalObjects`; sequential queries)
- `apps/shs-api/src/db/migration-runner.ts` (`baselineMigrations` guarded; new `BaselineSchemaVerificationError`, `BaselineOptions`)
- `apps/shs-api/src/db/migrate.ts` (`--force` flag for `db:migrate:baseline`)
- `apps/shs-api/tests/baseline-schema-guard.test.ts` (new)
- `apps/shs-api/tests/migration-runner.test.ts`, `tests/career-phase3-postgres-runtime.test.ts` (migration count 47→48)

### Documentation

This section. `SHF_CALENDAR_CAPABILITY_MATRIX.md` and `SHF_CAREER_EVENTS_OPPORTUNITIES_FOUNDATION.md` were not touched — Phase 4.3 changed no product behavior they describe.

### Remaining Risks

Operator/history for every historical baseline invocation remains UNKNOWN — the guard prevents *recurrence*, it doesn't explain the past. The exhaustive verifier's own documented limitation (auto-named UNIQUE/CHECK constraints not structurally verified) still applies; none of the 23 objects repaired this phase were affected by it (all their constraints are explicitly named). A future migration `049`+ using DDL vocabulary outside the parser's bounded set would need the parser extended before the baseline guard or strict check could cover it correctly.

### Phase 5 Readiness

Database schema truth is now clean and enforced going forward (both by `db:schema:integrity:strict` as a recommended deployment gate — see Phase 4.2 — and by the baseline guard preventing new instances of this exact defect class). Product feature work (Career/pathway linkage, Opportunity applications, Career Event registration, Credentials, etc.) can proceed without carrying forward any known schema-truth risk from this incident history.

## Final Root-Cause Inventory

Every migration `001`-`038` in `shs_dev` carries the `baseline-1`/`0ms` ledger fingerprint. Of those:

- **Physically complete despite the baseline fingerprint** (never actually broken): `001`-`006`, `009`, `010`, `011`, `007`, `027`, and every other migration in that range not listed below.
- **Repaired in Phase 1.1**: `035`, `036`, `037`, `038`.
- **Repaired in Phase 3.1**: `031`.
- **Repaired in Phase 4.1**: `030`, `032`, `033`.
- **Repaired in Phase 4.3**: `008`, `012`, `013`, `014`, `015`, `016`, `017`, `018`, `019`, `020`, `021`, `022`, `023`, `024`, `025`, `026`, `028`, `029`, `034`.
- **Unverified**: none — `db:schema:integrity:strict` exhaustively checked all 48 currently-applied migrations and found zero remaining failures.

**NO KNOWN APPLIED MIGRATION / PHYSICAL SCHEMA GAPS REMAIN**, proven by the strict verifier, not asserted.
