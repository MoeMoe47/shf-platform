import { createPersistenceRepository } from "../repositoryFactory";
import { createRecordHash, SHS_PERSISTENCE_SCHEMA_VERSION } from "../persistenceTypes";

function structured(status, record = null, extras = {}) {
  return {
    ok: !["blocked", "failed"].includes(status),
    status,
    record,
    transaction_id: extras.transaction_id || "",
    version_id: extras.version_id || "",
    errors: extras.errors || [],
    warnings: extras.warnings || [],
  };
}

export function createCriticalStateRepository(config) {
  const repository = createPersistenceRepository(config);
  const idField = config.idField || "id";

  function save(record, options = {}) {
    const safety = repository.validateRecord(record);
    if (!safety.safe) return structured("blocked", record, { errors: safety.findings || [] });
    const saved = repository.save(record, options);
    const history = repository.getHistory(saved[idField] || saved.id);
    const latestHistory = history.slice(-1)[0] || {};
    return structured(options.status || "saved", saved, {
      transaction_id: latestHistory.transaction_id || "",
      warnings: options.warnings || [],
    });
  }

  function saveMany(records = [], options = {}) {
    const results = records.map((record) => save(record, options));
    return {
      ok: results.every((result) => result.ok),
      status: results.every((result) => result.ok) ? "saved" : "blocked",
      records: results.filter((result) => result.ok).map((result) => result.record),
      results,
      errors: results.flatMap((result) => result.errors || []),
      warnings: results.flatMap((result) => result.warnings || []),
    };
  }

  function update(id, patch = {}, options = {}) {
    const current = repository.getById(id);
    return save({ ...(current || { [idField]: id }), ...patch }, { ...options, status: "updated" });
  }

  function archive(id) {
    const record = repository.archive(id);
    return structured(record ? "archived" : "failed", record, record ? {} : { errors: ["record_not_found"] });
  }

  function restore(id, options = {}) {
    const record = repository.restore(id, options);
    if (record?.status === "dry_run") return structured("blocked", null, { warnings: [record.message] });
    return structured(record ? "restored" : "failed", record, record ? {} : { errors: ["record_not_found"] });
  }

  function createSnapshot(scope = repository.repository) {
    return repository.createSnapshot(scope);
  }

  function exportSafeBackup() {
    const records = repository.list();
    return {
      backup_id: `${repository.repository}_backup_${Date.now()}`,
      repository: repository.repository,
      record_count: records.length,
      record_hash: createRecordHash(records),
      schema_version: SHS_PERSISTENCE_SCHEMA_VERSION,
      created_at: new Date().toISOString(),
      records,
    };
  }

  function importValidatedBackup(backup = {}, options = {}) {
    if (options.confirmImport !== true) {
      return { ok: false, status: "blocked", errors: ["confirmImport_required"], warnings: [] };
    }
    return saveMany(backup.records || [], { change_summary: "Imported validated critical-state backup" });
  }

  return {
    ...repository,
    save,
    saveMany,
    update,
    archive,
    restore,
    createSnapshot,
    count: () => repository.list().length,
    computeRecordHash: (record) => createRecordHash(record),
    getSchemaVersion: () => SHS_PERSISTENCE_SCHEMA_VERSION,
    exportSafeBackup,
    importValidatedBackup,
  };
}
