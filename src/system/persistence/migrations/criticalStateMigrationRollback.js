import { createMigrationRun } from "./criticalStateMigrationTypes";
import { getCriticalStateMigration } from "./criticalStateMigrationRegistry";
import { preserveLegacyCriticalState } from "./criticalStateMigrationCompatibility";
import { listMigrationBackups, saveMigrationRun } from "./criticalStateMigrationStorage";

export function previewCriticalStateRollback(domainOrId) {
  const migration = getCriticalStateMigration(domainOrId);
  const backups = listMigrationBackups().filter((backup) => backup.domain === migration?.domain);
  const backup = backups.slice(-1)[0] || null;
  return {
    ok: Boolean(migration && backup),
    status: "rollback_preview",
    domain: migration?.domain || String(domainOrId || ""),
    requires_confirm: true,
    would_mutate: false,
    backup_reference: backup?.backup_id || "",
    record_count: backup?.record_count || 0,
  };
}

export function applyCriticalStateRollback(domainOrId, options = {}) {
  const migration = getCriticalStateMigration(domainOrId);
  if (!migration) return { ok: false, status: "blocked", errors: ["migration_not_registered"] };
  if (options.confirmRollback !== true) return previewCriticalStateRollback(domainOrId);
  const backups = listMigrationBackups().filter((backup) => backup.domain === migration.domain);
  const backup = backups.slice(-1)[0] || null;
  if (!backup) return { ok: false, status: "blocked", errors: ["backup_missing"] };
  const firstKey = migration.source_keys[0];
  preserveLegacyCriticalState(firstKey, backup.records || []);
  const run = createMigrationRun({
    domain: migration.domain,
    status: "rolled_back",
    source_count: backup.record_count,
    migrated_count: backup.record_count,
    backup_reference: backup.backup_id,
    operator_note: "Confirmed local rollback restored exact domain legacy backup; repository history preserved.",
  });
  return saveMigrationRun(run);
}
