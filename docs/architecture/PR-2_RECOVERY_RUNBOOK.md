# PR-2 Recovery Runbook

Date: 2026-09-12
Scope: Repository-local data lineage, privacy, retention, backup, restore, and recovery validation.

## Authority

This runbook covers repository-local recovery behavior only. It does not replace the production disaster-recovery runbook owned by PR-6, and it does not create a cloud object-storage provider, monitoring platform, payment system, or legal retention schedule.

Authorized operators must have repository access, database restore authority for an isolated target, and permission to handle protected source/evidence/report artifacts. Production secrets must be injected by the approved runtime secret mechanism and must not be written into backup archives, logs, reports, or source control.

## Durable Stores

| Store | Backup Method | Restore Method | PR-2 Status |
|---|---|---|---|
| Relational database | `databaseBackupPlan()` emits a secret-safe `pg_dump --format=custom` plan using `SHF_BACKUP_OUTPUT_DIR`. | Restore with `pg_restore` into an isolated `RESTORE_DATABASE_URL`, then run migrations/status checks and relationship validation. | Repository plan complete; production scheduling/storage external. |
| Local private source/evidence bytes | `createLocalFileBackup()` writes a JSON archive with path safety, SHA-256, byte counts, classification, and exclusive archive creation. | `restoreLocalFileBackup()` restores to an empty isolated root with hash/size validation and exclusive writes. | Repository helper and local drill complete; production object store external. |
| Local report artifacts | Same local file backup helper when artifacts are on local storage. | Same restore helper, followed by artifact hash/metadata validation. | Repository helper complete; production artifact store external. |
| Audit/events/lineage rows | Included in database backup. | Restore database, then validate representative source -> evidence -> metric/report lineage. | Repository validation model complete; production drill external. |
| Secrets/configuration | Secret values are not backed up by repository tooling. | Rehydrate from approved secret manager/config source, then run readiness checks. | External production secret-store responsibility. |

## Backup Procedure

1. Confirm the target is a non-production or approved backup source.
2. Set `SHF_BACKUP_OUTPUT_DIR` to a protected directory outside the repository.
3. For databases, generate the command with `databaseBackupPlan()` and run it with `DATABASE_URL` supplied by the process environment.
4. For local file stores, call `createLocalFileBackup({ sourceRoot, archivePath })`.
5. Confirm backup artifacts are mode-restricted, outside source control, and not under `apps/`, `src/`, `docs/`, `tests/`, or other tracked paths.
6. Record artifact path, hash, timestamp, source root label, operator, and ticket/change reference in the operational log.

## Restore Procedure

1. Restore only into an isolated target database/root unless an approved production incident procedure explicitly authorizes otherwise.
2. Create or empty the isolated restore target before restore; never overwrite active developer or production-like owner data.
3. Restore database dumps with `pg_restore` into `RESTORE_DATABASE_URL`.
4. Restore local file archives with `restoreLocalFileBackup({ archivePath, targetRoot })`.
5. Run `verifyRestoredBackup()` for local files.
6. Run migrations/status checks for restored databases before application use.
7. Validate representative lineage: source identifier, organization/tenant scope, evidence reference, metric/report reference, artifact hash, public projection state, and audit history.

## Privacy After Restore

Before a restored environment is used, confirm that legal hold, deletion, archival, suppression, publication status, and subject-export exclusions remain intact. A restore must not silently republish withdrawn public projections, reactivate deleted/anonymized records, bypass legal hold, or expose internal evidence through public DTOs.

## Failed Restore

If restore validation fails, stop use of the restored target, preserve logs/artifacts for investigation, and create a new isolated target for any retry. Do not partially repair restored data by hand unless an approved incident procedure records the exact correction and provenance.

## Validation Commands

```text
npx tsx --test apps/shs-api/tests/pr2-data-governance-recovery.test.ts
node --test tests/pr2LineagePrivacyRecovery.test.mjs
npm run check:truth
npm run check:oracle
git diff --check
```

The full production DR exercise, RPO/RTO timing, encrypted backup storage, scheduled backup jobs, cloud object restore, and failover drill remain PR-6/PR-7 external-environment work.
