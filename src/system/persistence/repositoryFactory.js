import { defaultPersistenceService } from "./persistenceService";
import { scanPersistencePayload } from "./persistenceSafety";
import { SHS_PERSISTENCE_SCHEMA_VERSION, createPersistenceId } from "./persistenceTypes";
import { createSessionSnapshot } from "./sessionSnapshots";

function findRecordId(record = {}, idField = "id") {
  return record[idField] || record.id || record.record_id || record.entity_id;
}

export function createPersistenceRepository({
  repository,
  entityType,
  idField = "id",
  service = defaultPersistenceService,
}) {
  function list() {
    return service.readRepository(repository);
  }

  function getById(id) {
    return list().find((record) => findRecordId(record, idField) === id) || null;
  }

  function validateRecord(record) {
    return scanPersistencePayload(record);
  }

  function save(record, options = {}) {
    const entityId = findRecordId(record, idField) || createPersistenceId(repository);
    return service.saveRecord(repository, {
      ...record,
      [idField]: record[idField] || entityId,
      schema_version: record.schema_version || SHS_PERSISTENCE_SCHEMA_VERSION,
    }, {
      entity_type: entityType,
      change_summary: options.change_summary,
      notes: options.notes,
    }).record;
  }

  function update(id, patch = {}, options = {}) {
    const current = getById(id);
    return save({ ...(current || { [idField]: id }), ...patch }, {
      change_summary: options.change_summary || "Updated local persistence record",
      notes: options.notes,
    });
  }

  function archive(id) {
    return service.archiveRecord(repository, id, { entity_type: entityType }).record;
  }

  function restore(id, options = {}) {
    if (!options.confirmRestore) {
      return { status: "dry_run", entity_id: id, message: "Restore requires { confirmRestore: true }." };
    }
    return update(id, { archived: false, restored_at: new Date().toISOString() }, { change_summary: "Restored local persistence record" });
  }

  function getHistory(id) {
    return service.getHistory(repository, id);
  }

  function createSnapshot(scope = repository) {
    return createSessionSnapshot(scope, { service });
  }

  return {
    repository,
    entityType,
    list,
    getById,
    save,
    update,
    archive,
    restore,
    getHistory,
    createSnapshot,
    validateRecord,
  };
}

