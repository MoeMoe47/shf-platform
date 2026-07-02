import { createDatabaseAdapter } from "./persistenceAdapters";
import { listPersistenceMigrations } from "./migrationRegistry";
import { PERSISTENCE_REPOSITORIES } from "./persistenceTypes";
import { defaultPersistenceService } from "./persistenceService";

export function calculatePersistenceMetrics(service = defaultPersistenceService) {
  const repositories = PERSISTENCE_REPOSITORIES.map((item) => ({
    ...item,
    record_count: service.readRepository(item.repository).length,
  }));
  const transactionCount = service.adapter.read("transaction_history", []).length;
  const versionCount = service.adapter.read("version_history", []).length;
  const snapshotCount = service.adapter.read("session_snapshots", []).length;
  const databaseAdapter = createDatabaseAdapter();

  return {
    repository_count: repositories.length,
    repositories,
    transaction_count: transactionCount,
    version_count: versionCount,
    snapshot_count: snapshotCount,
    migration_count: listPersistenceMigrations().length,
    local_adapter_enabled: true,
    memory_adapter_enabled: true,
    database_adapter_enabled: databaseAdapter.enabled,
    database_adapter_status: "disabled_placeholder",
  };
}

