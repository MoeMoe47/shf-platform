import { createPersistenceAdapter } from "./persistenceAdapters";
import { assertPersistenceSafe, scanPersistencePayload } from "./persistenceSafety";
import {
  SHS_PERSISTENCE_SCHEMA_VERSION,
  createRecordHash,
} from "./persistenceTypes";
import {
  appendTransaction,
  createPersistenceTransaction,
  listTransactions,
} from "./transactionHistory";
import {
  appendVersion,
  createPersistenceVersion,
  getLatestVersion,
  listVersions,
} from "./versionHistory";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function getId(record = {}) {
  return record.id || record.record_id || record.entity_id || record.orchestration_request_id || record.report_id || record.connectionId || record.connection_id;
}

export function createPersistenceService(options = {}) {
  const adapter = options.adapter || createPersistenceAdapter(options.adapterName);

  function readRepository(repository) {
    return asArray(adapter.read(repository, []));
  }

  function writeRepository(repository, records) {
    adapter.write(repository, asArray(records));
    return readRepository(repository);
  }

  function saveRecord(repository, record, metadata = {}) {
    const safety_result = assertPersistenceSafe(record);
    const records = readRepository(repository);
    const entityId = getId(record) || `${repository}_${Date.now()}`;
    const before = records.find((item) => getId(item) === entityId) || null;
    const nextRecord = {
      ...record,
      id: record.id || entityId,
      schema_version: record.schema_version || SHS_PERSISTENCE_SCHEMA_VERSION,
      updated_at: new Date().toISOString(),
      archived: false,
    };
    const nextRecords = before
      ? records.map((item) => (getId(item) === entityId ? nextRecord : item))
      : [...records, nextRecord];

    writeRepository(repository, nextRecords);
    const version = appendVersion(adapter, createPersistenceVersion({
      entity_type: metadata.entity_type || repository,
      entity_id: entityId,
      repository,
      record: nextRecord,
      previous_hash: before ? createRecordHash(before) : "",
      change_summary: metadata.change_summary || (before ? "Updated local persistence record" : "Created local persistence record"),
      metadata,
    }));
    appendTransaction(adapter, createPersistenceTransaction({
      entity_type: metadata.entity_type || repository,
      entity_id: entityId,
      operation: before ? "update" : "create",
      repository,
      before,
      after: nextRecord,
      safety_result,
      notes: metadata.notes || [],
    }));

    return { record: nextRecord, version };
  }

  function archiveRecord(repository, entityId, metadata = {}) {
    const records = readRepository(repository);
    const before = records.find((item) => getId(item) === entityId) || null;
    if (!before) return { record: null };
    const after = { ...before, archived: true, archived_at: new Date().toISOString() };
    assertPersistenceSafe(after);
    writeRepository(repository, records.map((item) => (getId(item) === entityId ? after : item)));
    appendTransaction(adapter, createPersistenceTransaction({
      entity_type: metadata.entity_type || repository,
      entity_id: entityId,
      operation: "archive",
      repository,
      before,
      after,
      safety_result: scanPersistencePayload(after),
      notes: metadata.notes || [],
    }));
    return { record: after };
  }

  return {
    adapter,
    readRepository,
    writeRepository,
    saveRecord,
    archiveRecord,
    scan: scanPersistencePayload,
    getHistory: (repository, entityId) => listTransactions(adapter, { repository, entity_id: entityId }),
    listVersions: (repository, entityId) => listVersions(adapter, { repository, entity_id: entityId }),
    getLatestVersion: (repository, entityId) => getLatestVersion(adapter, repository, entityId),
  };
}

export const defaultPersistenceService = createPersistenceService();

