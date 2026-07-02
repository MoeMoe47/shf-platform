import {
  SHS_PERSISTENCE_SCHEMA_VERSION,
  createPersistenceId,
  createRecordHash,
  nowIso,
} from "./persistenceTypes";

export const SHS_PERSISTENCE_VERSION_NAMESPACE = "version_history";

export function createPersistenceVersion({
  entity_type = "",
  entity_id = "",
  repository = "",
  record = {},
  previous_hash = "",
  snapshot_ref = "",
  change_summary = "Local persistence update",
  metadata = {},
} = {}) {
  return {
    version_id: createPersistenceId("persist_ver"),
    entity_type,
    entity_id,
    repository,
    version_number: 1,
    schema_version: SHS_PERSISTENCE_SCHEMA_VERSION,
    created_at: nowIso(),
    change_summary,
    record_hash: createRecordHash(record),
    previous_hash,
    snapshot_ref,
    metadata,
  };
}

export function appendVersion(adapter, version) {
  const current = adapter.read(SHS_PERSISTENCE_VERSION_NAMESPACE, []);
  const previousVersions = current.filter((item) => item.repository === version.repository && item.entity_id === version.entity_id);
  const nextVersion = { ...version, version_number: previousVersions.length + 1 };
  adapter.write(SHS_PERSISTENCE_VERSION_NAMESPACE, [...current, nextVersion]);
  return nextVersion;
}

export function listVersions(adapter, filters = {}) {
  const records = adapter.read(SHS_PERSISTENCE_VERSION_NAMESPACE, []);
  return records.filter((record) => {
    if (filters.repository && record.repository !== filters.repository) return false;
    if (filters.entity_id && record.entity_id !== filters.entity_id) return false;
    return true;
  });
}

export function getLatestVersion(adapter, repository, entityId) {
  return listVersions(adapter, { repository, entity_id: entityId }).slice(-1)[0] || null;
}

export function compareVersionMetadata(a = {}, b = {}) {
  return {
    same_record_hash: a.record_hash === b.record_hash,
    same_schema_version: a.schema_version === b.schema_version,
    previous_hash_matches: Boolean(a.record_hash && b.previous_hash && a.record_hash === b.previous_hash),
  };
}

export function previewVersionRollback(version) {
  return {
    status: "blocked_in_v1",
    requires_confirm: true,
    message: "Rollback apply is blocked in Persistence V1 unless an explicit local confirm is passed.",
    version,
  };
}

