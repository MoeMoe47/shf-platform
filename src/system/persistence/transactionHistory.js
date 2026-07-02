import {
  SHS_PERSISTENCE_SCHEMA_VERSION,
  createPersistenceId,
  createRecordHash,
  nowIso,
} from "./persistenceTypes";

export const SHS_PERSISTENCE_TRANSACTION_NAMESPACE = "transaction_history";

export function createPersistenceTransaction({
  entity_type = "",
  entity_id = "",
  operation = "update",
  repository = "",
  before = null,
  after = null,
  safety_result = {},
  status = "recorded",
  notes = [],
} = {}) {
  return {
    transaction_id: createPersistenceId("persist_txn"),
    entity_type,
    entity_id,
    operation,
    repository,
    actor: "local_operator",
    timestamp: nowIso(),
    schema_version: SHS_PERSISTENCE_SCHEMA_VERSION,
    before_hash: before ? createRecordHash(before) : "",
    after_hash: after ? createRecordHash(after) : "",
    safety_result,
    status,
    notes,
  };
}

export function appendTransaction(adapter, transaction) {
  const current = adapter.read(SHS_PERSISTENCE_TRANSACTION_NAMESPACE, []);
  const next = [...current, transaction];
  adapter.write(SHS_PERSISTENCE_TRANSACTION_NAMESPACE, next);
  return transaction;
}

export function listTransactions(adapter, filters = {}) {
  const records = adapter.read(SHS_PERSISTENCE_TRANSACTION_NAMESPACE, []);
  return records.filter((record) => {
    if (filters.repository && record.repository !== filters.repository) return false;
    if (filters.entity_id && record.entity_id !== filters.entity_id) return false;
    return true;
  });
}

