import { defaultPersistenceService } from "../persistenceService";
import { createRecordHash } from "../persistenceTypes";
import { getCriticalStateMigration } from "./criticalStateMigrationRegistry";
import { sanitizeCriticalStateRecord } from "./criticalStateMigrationSafety";

function canUseLegacyStorage() {
  try {
    return Boolean(globalThis?.localStorage);
  } catch {
    return false;
  }
}

export function readLegacyCriticalState(key, fallback = []) {
  if (!canUseLegacyStorage()) return Array.isArray(fallback) ? [...fallback] : fallback;
  try {
    const value = globalThis.localStorage.getItem(key);
    if (!value) return Array.isArray(fallback) ? [...fallback] : fallback;
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return Array.isArray(fallback) ? [...fallback] : fallback;
  }
}

export function preserveLegacyCriticalState(key, value) {
  if (!canUseLegacyStorage()) return value;
  globalThis.localStorage.setItem(key, JSON.stringify(Array.isArray(value) ? value : []));
  return value;
}

export function normalizeCriticalRecord(domain, record = {}, idField = "id", schemaVersion = "") {
  const entityId = record[idField] || record.id || record.record_id || record.entity_id || `${domain}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    ...record,
    [idField]: entityId,
    id: record.id || entityId,
    critical_state_domain: domain,
    schema_version: record.schema_version || schemaVersion || `shs.critical.${domain}.v1`,
    migrated_via_persistence_layer: true,
    persistence_boundary: "SHS Durable Persistence Layer V1",
  };
}

export function splitValidCriticalRecords(domain, records = [], idField = "id", schemaVersion = "") {
  const seen = new Set();
  const valid = [];
  const blocked = [];
  const duplicates = [];
  records.forEach((record) => {
    const normalized = normalizeCriticalRecord(domain, record, idField, schemaVersion);
    const entityId = normalized[idField] || normalized.id;
    const safety = sanitizeCriticalStateRecord(normalized);
    if (seen.has(entityId)) {
      duplicates.push(normalized);
      return;
    }
    seen.add(entityId);
    if (safety.blocked) {
      blocked.push({ record: normalized, safety_result: safety.safety_result });
      return;
    }
    valid.push(normalized);
  });
  return { valid, blocked, duplicates };
}

export function readCriticalStateRepository(repository, fallback = []) {
  return defaultPersistenceService.readRepository(repository) || fallback;
}

export function saveCriticalStateRepository(repository, records = [], metadata = {}) {
  return records.map((record) => defaultPersistenceService.saveRecord(repository, record, {
    entity_type: metadata.entity_type || `${repository}_critical_record`,
    change_summary: metadata.change_summary || "Critical-state repository write",
    notes: metadata.notes || [],
  }).record);
}

export function readCriticalStateRecords(domain, legacyKey, fallback = [], options = {}) {
  const migration = getCriticalStateMigration(domain);
  const repository = options.repository || migration?.target_repository || domain;
  const repoRecords = readCriticalStateRepository(repository, []);
  if (repoRecords.length) return repoRecords;
  const legacyRecords = readLegacyCriticalState(legacyKey, fallback);
  const idField = options.idField || migration?.id_fields?.[0] || "id";
  const schemaVersion = options.schemaVersion || migration?.target_schema_version || "";
  const { valid } = splitValidCriticalRecords(domain, legacyRecords, idField, schemaVersion);
  return valid.length ? valid : legacyRecords;
}

export function writeCriticalStateRecords(domain, legacyKey, records = [], options = {}) {
  const migration = getCriticalStateMigration(domain);
  const repository = options.repository || migration?.target_repository || domain;
  const idField = options.idField || migration?.id_fields?.[0] || "id";
  const schemaVersion = options.schemaVersion || migration?.target_schema_version || "";
  const { valid } = splitValidCriticalRecords(domain, records, idField, schemaVersion);
  const saved = saveCriticalStateRepository(repository, valid, {
    entity_type: `${domain}_critical_record`,
    change_summary: options.change_summary || "Critical-state feature write through repository",
    notes: ["repository_primary_with_fallback", ...(options.notes || [])],
  });
  if (options.mirrorLegacy !== false) preserveLegacyCriticalState(legacyKey, records);
  return saved;
}

export function createLegacyBackup(domain, sourceKey, records = []) {
  return {
    backup_id: `critical_backup_${domain}_${Date.now()}`,
    domain,
    source_key: sourceKey,
    record_count: records.length,
    source_hash: createRecordHash(records),
    schema_version: getCriticalStateMigration(domain)?.target_schema_version || "",
    created_at: new Date().toISOString(),
    unsafe_fields_excluded: true,
    records,
  };
}
