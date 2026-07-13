import { createMigrationRun, hashRecordSet } from "./criticalStateMigrationTypes";
import { getCriticalStateMigration } from "./criticalStateMigrationRegistry";
import { buildCriticalStateMigrationPlan } from "./criticalStateMigrationPlanner";
import {
  createLegacyBackup,
  readLegacyCriticalState,
  saveCriticalStateRepository,
  splitValidCriticalRecords,
} from "./criticalStateMigrationCompatibility";
import { saveMigrationBackup, saveMigrationPlan, saveMigrationRun } from "./criticalStateMigrationStorage";
import { verifyCriticalStateMigration } from "./criticalStateMigrationVerifier";

export function createCriticalStateMigrationBackup(domainOrId) {
  const migration = getCriticalStateMigration(domainOrId);
  if (!migration) return { ok: false, status: "blocked", errors: ["migration_not_registered"] };
  const records = migration.source_keys.flatMap((key) => readLegacyCriticalState(key, []));
  const backup = createLegacyBackup(migration.domain, migration.source_keys.join(","), records);
  return { ok: true, status: "backup_created", backup: saveMigrationBackup(backup) };
}

export function applyCriticalStateMigration(domainOrId, options = {}) {
  const migration = getCriticalStateMigration(domainOrId);
  if (!migration) return createMigrationRun({ domain: String(domainOrId || ""), status: "blocked", errors: ["migration_not_registered"] });
  if (options.confirmMigration !== true) {
    const plan = buildCriticalStateMigrationPlan(migration.domain);
    saveMigrationPlan(plan);
    return createMigrationRun({
      migration_plan_id: plan.migration_plan_id,
      domain: migration.domain,
      status: "planned",
      source_count: plan.record_count_detected,
      blocked_count: plan.record_count_blocked,
      duplicate_count: plan.record_count_duplicate,
      errors: ["confirmMigration_required"],
      warnings: plan.warnings,
    });
  }
  const records = migration.source_keys.flatMap((key) => readLegacyCriticalState(key, []));
  const { valid, blocked, duplicates } = splitValidCriticalRecords(
    migration.domain,
    records,
    migration.id_fields[0] || "id",
    migration.target_schema_version
  );
  const backupResult = createCriticalStateMigrationBackup(migration.domain);
  const saved = saveCriticalStateRepository(migration.target_repository, valid, {
    entity_type: `${migration.domain}_critical_record`,
    change_summary: "migration_apply",
    notes: ["critical_state_migration_v1", "repository_primary_with_fallback"],
  });
  const run = saveMigrationRun(createMigrationRun({
    domain: migration.domain,
    status: "running",
    completed_at: new Date().toISOString(),
    source_count: records.length,
    migrated_count: saved.length,
    blocked_count: blocked.length,
    duplicate_count: duplicates.length,
    verified_count: 0,
    source_hash: hashRecordSet(records, migration.id_fields[0] || "id"),
    target_hash: hashRecordSet(saved, migration.id_fields[0] || "id"),
    backup_reference: backupResult.backup?.backup_id || "",
    warnings: duplicates.length ? ["duplicate_ids_detected"] : [],
  }));
  const verification = verifyCriticalStateMigration(run, valid);
  return { ...run, status: verification.verified ? "verified" : "failed", verified_count: verification.verified ? saved.length : 0, verification };
}

export function migrateAllPrimaryCriticalState(options = {}) {
  return ["orchestrator", "command_bus", "job_scheduler", "notification_fabric", "tracking_intelligence", "executive_command_center"]
    .map((domain) => applyCriticalStateMigration(domain, options));
}
