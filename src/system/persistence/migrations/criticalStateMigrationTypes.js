import { createPersistenceId, createRecordHash, nowIso } from "../persistenceTypes";

export const CRITICAL_STATE_MIGRATION_VERSION = "shs.critical-state-migration.v1";

export const CRITICAL_STATE_MIGRATION_STAGES = Object.freeze([
  "legacy_primary",
  "repository_shadow",
  "repository_primary_with_fallback",
  "repository_only_ready",
]);

export const CRITICAL_STATE_COMPATIBILITY_MODES = Object.freeze([
  "read_fallback",
  "temporary_dual_write",
  "repository_only",
  "repository_primary_with_fallback",
]);

export const CRITICAL_STATE_PRIMARY_DOMAINS = Object.freeze([
  "orchestrator",
  "command_bus",
  "job_scheduler",
  "notification_fabric",
  "tracking_intelligence",
  "executive_command_center",
]);

export function cloneCriticalState(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

export function createMigrationPlan(input = {}) {
  return {
    migration_plan_id: input.migration_plan_id || createPersistenceId("critical_plan"),
    migration_id: input.migration_id || "",
    domain: input.domain || "",
    source_type: input.source_type || "legacy_local_storage",
    source_key: input.source_key || "",
    target_repository: input.target_repository || "",
    target_schema_version: input.target_schema_version || CRITICAL_STATE_MIGRATION_VERSION,
    record_count_detected: Number(input.record_count_detected || 0),
    record_count_valid: Number(input.record_count_valid || 0),
    record_count_blocked: Number(input.record_count_blocked || 0),
    record_count_duplicate: Number(input.record_count_duplicate || 0),
    dry_run: input.dry_run !== false,
    destructive: false,
    backup_required: true,
    rollback_supported: true,
    compatibility_mode: input.compatibility_mode || "repository_primary_with_fallback",
    warnings: input.warnings || [],
    blockers: input.blockers || [],
    safety_result: input.safety_result || {},
    created_at: input.created_at || nowIso(),
  };
}

export function createMigrationRun(input = {}) {
  return {
    migration_run_id: input.migration_run_id || createPersistenceId("critical_run"),
    migration_plan_id: input.migration_plan_id || "",
    domain: input.domain || "",
    started_at: input.started_at || nowIso(),
    completed_at: input.completed_at || "",
    status: input.status || "planned",
    source_count: Number(input.source_count || 0),
    migrated_count: Number(input.migrated_count || 0),
    blocked_count: Number(input.blocked_count || 0),
    duplicate_count: Number(input.duplicate_count || 0),
    verified_count: Number(input.verified_count || 0),
    source_hash: input.source_hash || "",
    target_hash: input.target_hash || "",
    backup_reference: input.backup_reference || "",
    transaction_ids: input.transaction_ids || [],
    version_ids: input.version_ids || [],
    errors: input.errors || [],
    warnings: input.warnings || [],
    operator_note: input.operator_note || "",
  };
}

export function createMigrationVerification(input = {}) {
  return {
    verification_id: input.verification_id || createPersistenceId("critical_verify"),
    migration_run_id: input.migration_run_id || "",
    count_match: Boolean(input.count_match),
    id_set_match: Boolean(input.id_set_match),
    hash_match: Boolean(input.hash_match),
    schema_match: Boolean(input.schema_match),
    unsafe_field_count: Number(input.unsafe_field_count || 0),
    duplicate_count: Number(input.duplicate_count || 0),
    missing_count: Number(input.missing_count || 0),
    extra_count: Number(input.extra_count || 0),
    repository_read_pass: Boolean(input.repository_read_pass),
    legacy_fallback_required: Boolean(input.legacy_fallback_required),
    verified: Boolean(input.verified),
    notes: input.notes || [],
  };
}

export function hashRecordSet(records = [], idField = "id") {
  const normalized = [...records].map((record) => ({
    id: record?.[idField] || record?.id || record?.record_id || "",
    hash: createRecordHash(record),
  })).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return createRecordHash(normalized);
}
