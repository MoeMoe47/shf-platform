import { scanPersistencePayload } from "./persistenceSafety";
import { SHS_PERSISTENCE_SCHEMA_VERSION, nowIso } from "./persistenceTypes";

export const SHS_PERSISTENCE_MIGRATIONS = Object.freeze([
  {
    migration_id: "agents_local_v1_to_persistence_v1",
    source: "agents_local_v1",
    target: SHS_PERSISTENCE_SCHEMA_VERSION,
    destructive: false,
    dry_run_default: true,
  },
  {
    migration_id: "orchestrator_local_v1_to_persistence_v1",
    source: "orchestrator_local_v1",
    target: SHS_PERSISTENCE_SCHEMA_VERSION,
    destructive: false,
    dry_run_default: true,
  },
  {
    migration_id: "direct_connect_local_v1_to_persistence_v1",
    source: "direct_connect_local_v1",
    target: SHS_PERSISTENCE_SCHEMA_VERSION,
    destructive: false,
    dry_run_default: true,
  },
  {
    migration_id: "reports_local_v1_to_persistence_v1",
    source: "reports_local_v1",
    target: SHS_PERSISTENCE_SCHEMA_VERSION,
    destructive: false,
    dry_run_default: true,
  },
  {
    migration_id: "production_automation_v2_to_persistence_v1",
    source: "production_automation_v2",
    target: SHS_PERSISTENCE_SCHEMA_VERSION,
    destructive: false,
    dry_run_default: true,
  },
]);

export function listPersistenceMigrations() {
  return [...SHS_PERSISTENCE_MIGRATIONS];
}

export function checkMigrationReadiness(migrationId) {
  const migration = SHS_PERSISTENCE_MIGRATIONS.find((item) => item.migration_id === migrationId);
  if (!migration) return { status: "not_found", warnings: ["Migration is not registered."] };
  return {
    status: "ready_for_dry_run",
    migration_id: migrationId,
    current_schema_version: SHS_PERSISTENCE_SCHEMA_VERSION,
    warnings: [
      "Dry-run only by default.",
      "No destructive migration is allowed in Persistence V1.",
      "Credentials, public approval mutations, and SHF Impact Data mutations are blocked.",
    ],
  };
}

export function dryRunPersistenceMigration(migrationId, sampleRecords = []) {
  const readiness = checkMigrationReadiness(migrationId);
  const safety = scanPersistencePayload(sampleRecords);
  return {
    migration_id: migrationId,
    operation: "migration_dry_run",
    timestamp: nowIso(),
    status: readiness.status === "ready_for_dry_run" && safety.safe ? "dry_run_pass" : "blocked",
    readiness,
    safety_result: safety,
    planned_record_count: Array.isArray(sampleRecords) ? sampleRecords.length : 0,
    would_mutate: false,
  };
}

export function applyPersistenceMigration() {
  return {
    status: "blocked_in_v1",
    message: "Migration apply is disabled by default in Persistence V1. Use dry-run planning only.",
  };
}

