import { createMigrationPlan, hashRecordSet } from "./criticalStateMigrationTypes";
import { getCriticalStateMigration } from "./criticalStateMigrationRegistry";
import { readLegacyCriticalState, splitValidCriticalRecords } from "./criticalStateMigrationCompatibility";
import { scanCriticalStateRecords } from "./criticalStateMigrationSafety";

export function buildCriticalStateMigrationPlan(domainOrId, legacyOverride = null) {
  const migration = getCriticalStateMigration(domainOrId);
  if (!migration) {
    return createMigrationPlan({
      migration_id: String(domainOrId || "unknown"),
      blockers: ["migration_not_registered"],
      record_count_blocked: 0,
    });
  }
  const legacyRecords = Array.isArray(legacyOverride)
    ? legacyOverride
    : migration.source_keys.flatMap((key) => readLegacyCriticalState(key, []));
  const idField = migration.id_fields[0] || "id";
  const { valid, blocked, duplicates } = splitValidCriticalRecords(
    migration.domain,
    legacyRecords,
    idField,
    migration.target_schema_version
  );
  const safety = scanCriticalStateRecords(valid);
  const blockers = [];
  if (!migration.target_repository) blockers.push("target_repository_missing");
  if (!migration.target_schema_version) blockers.push("schema_version_missing");
  if (safety.unsafe_field_count) blockers.push("unsafe_fields_detected");
  return createMigrationPlan({
    migration_id: migration.migration_id,
    domain: migration.domain,
    source_type: migration.source_type,
    source_key: migration.source_keys.join(","),
    target_repository: migration.target_repository,
    target_schema_version: migration.target_schema_version,
    record_count_detected: legacyRecords.length,
    record_count_valid: valid.length,
    record_count_blocked: blocked.length,
    record_count_duplicate: duplicates.length,
    compatibility_mode: migration.compatibility_mode,
    safety_result: safety,
    warnings: duplicates.length ? ["duplicate_ids_detected"] : [],
    blockers,
    source_hash: hashRecordSet(legacyRecords, idField),
  });
}

export function buildAllCriticalStateMigrationPlans() {
  return ["orchestrator", "command_bus", "job_scheduler", "notification_fabric", "tracking_intelligence", "executive_command_center"]
    .map((domain) => buildCriticalStateMigrationPlan(domain));
}
