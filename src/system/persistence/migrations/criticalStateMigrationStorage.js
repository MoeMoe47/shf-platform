import { defaultPersistenceService } from "../persistenceService";
import { createPersistenceTransaction } from "../transactionHistory";
import { createPersistenceVersion } from "../versionHistory";

export const CRITICAL_STATE_MIGRATION_PLAN_REPOSITORY = "critical_state_migration_plans";
export const CRITICAL_STATE_MIGRATION_RUN_REPOSITORY = "critical_state_migration_runs";
export const CRITICAL_STATE_MIGRATION_BACKUP_REPOSITORY = "critical_state_migration_backups";
export const CRITICAL_STATE_MIGRATION_VERIFICATION_REPOSITORY = "critical_state_migration_verifications";

function save(repository, record, operation) {
  return defaultPersistenceService.saveRecord(repository, record, {
    entity_type: repository,
    change_summary: operation,
    notes: ["critical_state_migration", "append_only"],
  }).record;
}

export function saveMigrationPlan(plan) {
  return save(CRITICAL_STATE_MIGRATION_PLAN_REPOSITORY, plan, "migration_preview");
}

export function saveMigrationRun(run) {
  return save(CRITICAL_STATE_MIGRATION_RUN_REPOSITORY, run, "migration_apply");
}

export function saveMigrationBackup(backup) {
  return save(CRITICAL_STATE_MIGRATION_BACKUP_REPOSITORY, backup, "migration_backup");
}

export function saveMigrationVerification(verification) {
  return save(CRITICAL_STATE_MIGRATION_VERIFICATION_REPOSITORY, verification, "migration_verify");
}

export function listMigrationPlans() {
  return defaultPersistenceService.readRepository(CRITICAL_STATE_MIGRATION_PLAN_REPOSITORY);
}

export function listMigrationRuns() {
  return defaultPersistenceService.readRepository(CRITICAL_STATE_MIGRATION_RUN_REPOSITORY);
}

export function listMigrationBackups() {
  return defaultPersistenceService.readRepository(CRITICAL_STATE_MIGRATION_BACKUP_REPOSITORY);
}

export function listMigrationVerifications() {
  return defaultPersistenceService.readRepository(CRITICAL_STATE_MIGRATION_VERIFICATION_REPOSITORY);
}

export function createMigrationTransaction(operation, repository, before, after, notes = []) {
  return createPersistenceTransaction({
    entity_type: "critical_state_migration",
    entity_id: after?.migration_run_id || after?.migration_plan_id || after?.backup_id || repository,
    operation,
    repository,
    before,
    after,
    safety_result: after?.safety_result || {},
    status: "recorded",
    notes,
  });
}

export function createMigrationVersion(repository, record, change_summary) {
  return createPersistenceVersion({
    entity_type: "critical_state_migration",
    entity_id: record?.migration_run_id || record?.migration_plan_id || record?.backup_id || repository,
    repository,
    record,
    change_summary,
    metadata: { migration_v1: true },
  });
}
