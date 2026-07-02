import { scanPersistencePayload } from "./persistenceSafety";
import {
  PERSISTENCE_REPOSITORIES,
  PERSISTENCE_SNAPSHOT_SCOPES,
  SHS_PERSISTENCE_SCHEMA_VERSION,
  createPersistenceId,
  createRecordHash,
  nowIso,
} from "./persistenceTypes";
import { defaultPersistenceService } from "./persistenceService";

export const SHS_PERSISTENCE_SNAPSHOT_NAMESPACE = "session_snapshots";

function repositoriesForScope(scope) {
  if (scope === "all_safe") return PERSISTENCE_REPOSITORIES.map((item) => item.repository);
  return PERSISTENCE_REPOSITORIES.some((item) => item.repository === scope) ? [scope] : [];
}

export function validateSnapshot(snapshot) {
  const safety = scanPersistencePayload(snapshot);
  return {
    valid: Boolean(snapshot?.snapshot_id && snapshot?.schema_version === SHS_PERSISTENCE_SCHEMA_VERSION && safety.safe),
    safety_result: safety,
  };
}

export function createSessionSnapshot(scope = "all_safe", options = {}) {
  const service = options.service || defaultPersistenceService;
  const repositories = repositoriesForScope(scope);
  const payload = repositories.reduce((acc, repository) => {
    acc[repository] = service.readRepository(repository);
    return acc;
  }, {});
  const snapshot = {
    snapshot_id: createPersistenceId("persist_snapshot"),
    scope,
    repositories,
    schema_version: SHS_PERSISTENCE_SCHEMA_VERSION,
    created_at: nowIso(),
    record_hash: createRecordHash(payload),
    payload,
    dry_run_restore_default: true,
  };
  const validation = validateSnapshot(snapshot);
  if (!validation.valid) return { ...snapshot, status: "blocked", validation };
  const current = service.adapter.read(SHS_PERSISTENCE_SNAPSHOT_NAMESPACE, []);
  service.adapter.write(SHS_PERSISTENCE_SNAPSHOT_NAMESPACE, [...current, snapshot]);
  return { ...snapshot, status: "recorded", validation };
}

export function listSessionSnapshots(options = {}) {
  const service = options.service || defaultPersistenceService;
  return service.adapter.read(SHS_PERSISTENCE_SNAPSHOT_NAMESPACE, []);
}

export function restoreSessionSnapshot(snapshotId, options = {}) {
  const service = options.service || defaultPersistenceService;
  const snapshot = listSessionSnapshots({ service }).find((item) => item.snapshot_id === snapshotId);
  if (!snapshot) return { status: "not_found", snapshot_id: snapshotId };
  const validation = validateSnapshot(snapshot);
  if (!validation.valid) return { status: "blocked", snapshot_id: snapshotId, validation };
  if (!options.confirmRestore) {
    return { status: "dry_run", snapshot_id: snapshotId, repositories: snapshot.repositories, validation };
  }
  snapshot.repositories.forEach((repository) => {
    service.writeRepository(repository, snapshot.payload[repository] || []);
  });
  return { status: "restored_local", snapshot_id: snapshotId, repositories: snapshot.repositories, validation };
}

export function compareSnapshots(a = {}, b = {}) {
  return {
    same_hash: a.record_hash === b.record_hash,
    same_scope: a.scope === b.scope,
    same_schema_version: a.schema_version === b.schema_version,
    repositories_added: (b.repositories || []).filter((item) => !(a.repositories || []).includes(item)),
    repositories_removed: (a.repositories || []).filter((item) => !(b.repositories || []).includes(item)),
  };
}

export function getSnapshotScopes() {
  return [...PERSISTENCE_SNAPSHOT_SCOPES];
}

