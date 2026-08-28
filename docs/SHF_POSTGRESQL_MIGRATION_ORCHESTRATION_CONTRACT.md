# SHF PostgreSQL Migration Orchestration Contract

## Authority

The canonical migration source is `apps/shs-api/migrations/`. The TypeScript
runner in `apps/shs-api/src/db/migration-runner.ts` is the only supported
execution authority. Migrations are deployment steps, not automatic API startup
mutations. The application may use the readiness check, but API replicas must
not race to change schema.

## Identity and ordering

Every migration must use a unique numeric prefix and lowercase
`NNN_description.sql` filename. The runner derives order numerically, rejects
malformed names and duplicate IDs, and includes all current migrations through
`028_auth0_identity_links_and_sessions.sql`.

## Bookkeeping and drift

The runner creates `schema_migrations` idempotently. Each row stores migration
ID, canonical filename, SHA-256 checksum, applied timestamp, duration, and
runner version. An unknown database-applied migration or changed checksum is a
hard failure. Applied migrations are never silently rewritten or rerun.

## Locking and transactions

`pg_try_advisory_lock` provides a database-level bounded lock. The mutating CLI
holds one dedicated PostgreSQL client for the complete lock and migration run;
the lock is therefore connection-scoped and cannot be lost to pool checkout.
A competing runner fails safely while the lock is held. Each migration runs in
its own transaction and is recorded only after successful SQL execution.
Failure rolls back that migration and stops the chain; later migrations do not
run.

## Commands

Run from `apps/shs-api/` with an explicit `DATABASE_URL`:

```text
npm run db:migrate:status
npm run db:migrate:plan
npm run db:migrate
```

`status` and `plan` are read-only. `up` acquires the lock and applies pending
migrations in order. Errors identify the migration ID without logging the
connection string or credentials. Production database configuration remains
fail-closed when `DATABASE_URL` is missing.

## Readiness

`checkSchemaReadiness` verifies the bookkeeping table, unknown history, drift,
and pending migrations without changing the database. A deployment should fail
readiness when required migrations are pending; process liveness remains a
separate concern.

## Fresh and upgrade databases

Fresh databases use `db:migrate` and must apply the complete ordered set.
Upgrade databases apply only pending migrations. A successful second run is a
no-op. Migration 028 is not special-cased and participates in the same chain.

## Existing database adoption

Databases that predate bookkeeping require an explicit operator action:
`npm run db:migrate:baseline -- --confirm <explicit-id> ...`. Baseline never
marks the whole history automatically, does not infer schema state from file
presence, and records source checksums for only the explicitly named IDs.
Operators must first verify the corresponding schema artifacts and retain that
verification in deployment evidence. The command is not an automatic startup
path. A later adoption run may baseline additional exact IDs after review.

## Rollback and Azure relationship

There are no automatic down migrations. Production rollback is forward-fix or
backup/restore. The runner is portable and depends only on `DATABASE_URL`, so it
can later run as an Azure PostgreSQL deployment step without Azure-specific
APIs. Azure staging and Auth0 remain separate deferred deployment concerns.

## Operational prerequisites

Use a deployment identity with database migration permission, a backup/restore
plan, protected migration source and lockfile, and a reviewed staging plan
before production use. Do not commit connection strings, state, or secrets.

## Local runtime proof (2026-08-26)

PostgreSQL `16.12` was verified on loopback as a Homebrew development service.
Disposable databases were used only for this proof and were removed afterward.
Fresh execution applied all 28 migrations, persisted 28 distinct checksummed
rows, created the migration-028 identity/session tables, and a second run was a
no-op. An upgrade database applied `001-010` first, then only pending
`011-028`.

Real PostgreSQL fixtures proved transaction rollback and stop-chain behavior,
checksum drift detection, unknown applied-history detection, confirmation and
exact-ID baseline behavior, and advisory-lock contention. A second runner
failed while the first held the lock; a subsequent retry succeeded, proving
normal lock release. Status/plan were read-only. No Azure, staging, production,
or participant database was used.

Readiness-specific disposable checks returned `READY` for the fully migrated
database and `pending_migrations`, `migration_drift`, and
`unknown_applied_migration` for the corresponding incomplete states.

Migration `029_trusted_reporting_outbox_worker_hardening.sql` is now the next
canonical migration after 028. It participates in the same numeric discovery,
checksum, transaction, locking, status, and readiness contract. It adds only
the durable outbox worker lease/retry/quarantine schema required by the worker
hardening slice.

Migration `030_rate_limit_windows.sql` is the canonical operational rate-limit
counter schema. It participates in the same ordered/checksummed migration
runner; its rows are availability-control state, not institutional reporting
data.

Migration `031_curriculum_lesson_completions.sql` is the canonical server-owned
lesson completion persistence. It participates in the same ordered/checksummed
chain and enforces one completion and one `lesson.completed` idempotency key per
organization, user, curriculum, and lesson.
