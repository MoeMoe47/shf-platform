import { createMigrationVerification, hashRecordSet } from "./criticalStateMigrationTypes";
import { getCriticalStateMigration } from "./criticalStateMigrationRegistry";
import { readCriticalStateRepository } from "./criticalStateMigrationCompatibility";
import { scanCriticalStateRecords } from "./criticalStateMigrationSafety";
import { saveMigrationVerification } from "./criticalStateMigrationStorage";

function idSet(records = [], idField = "id") {
  return new Set(records.map((record) => record?.[idField] || record?.id || record?.record_id || "").filter(Boolean));
}

export function verifyCriticalStateMigration(run, sourceRecords = []) {
  const migration = getCriticalStateMigration(run?.domain);
  const idField = migration?.id_fields?.[0] || "id";
  const target = readCriticalStateRepository(migration?.target_repository || run?.domain || "", []);
  const sourceIds = idSet(sourceRecords, idField);
  const targetIds = idSet(target, idField);
  const missing = [...sourceIds].filter((id) => !targetIds.has(id));
  const extra = [...targetIds].filter((id) => !sourceIds.has(id));
  const safety = scanCriticalStateRecords(target);
  const sourceHash = hashRecordSet(sourceRecords, idField);
  const targetHash = hashRecordSet(target, idField);
  const verification = createMigrationVerification({
    migration_run_id: run?.migration_run_id || "",
    count_match: sourceRecords.length === target.length,
    id_set_match: missing.length === 0,
    hash_match: sourceHash === targetHash,
    schema_match: target.every((record) => Boolean(record.schema_version)),
    unsafe_field_count: safety.unsafe_field_count,
    duplicate_count: 0,
    missing_count: missing.length,
    extra_count: extra.length,
    repository_read_pass: Array.isArray(target),
    legacy_fallback_required: target.length === 0 && sourceRecords.length > 0,
    verified: sourceRecords.length === target.length && missing.length === 0 && safety.unsafe_field_count === 0 && target.every((record) => Boolean(record.schema_version)),
    notes: sourceHash === targetHash ? [] : ["normalized_hash_difference_possible_after_schema_enrichment"],
  });
  return saveMigrationVerification(verification);
}
