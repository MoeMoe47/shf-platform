import { CRITICAL_STATE_PRIMARY_DOMAINS } from "./criticalStateMigrationTypes";

export const CRITICAL_STATE_MIGRATION_REGISTRY = Object.freeze([
  {
    migration_id: "critical_state_orchestrator_v1",
    domain: "orchestrator",
    label: "SHS System Orchestrator",
    source_type: "legacy_local_storage",
    source_keys: ["shs.systemOrchestrator.requests.v1", "shs.systemOrchestrator.plans.v1"],
    target_repository: "orchestrator",
    target_schema_version: "shs.critical.orchestrator.v1",
    id_fields: ["orchestration_request_id", "orchestration_plan_id"],
    compatibility_mode: "repository_primary_with_fallback",
    stage: "repository_primary_with_fallback",
    priority: "P0",
  },
  {
    migration_id: "critical_state_command_bus_v1",
    domain: "command_bus",
    label: "SHS BOS Command Bus",
    source_type: "legacy_local_storage",
    source_keys: ["shs_bos_command_bus_v1_commands", "shs_bos_command_bus_v1_history"],
    target_repository: "command_bus",
    target_schema_version: "shs.critical.command-bus.v1",
    id_fields: ["command_id", "history_id"],
    compatibility_mode: "repository_primary_with_fallback",
    stage: "repository_primary_with_fallback",
    priority: "P0",
  },
  {
    migration_id: "critical_state_job_scheduler_v1",
    domain: "job_scheduler",
    label: "SHS BOS Job Scheduler",
    source_type: "legacy_local_storage",
    source_keys: ["shs_bos_job_scheduler_v1_jobs", "shs_bos_job_scheduler_v1_history"],
    target_repository: "job_scheduler",
    target_schema_version: "shs.critical.job-scheduler.v1",
    id_fields: ["job_id", "history_id"],
    compatibility_mode: "repository_primary_with_fallback",
    stage: "repository_primary_with_fallback",
    priority: "P0",
  },
  {
    migration_id: "critical_state_notification_fabric_v1",
    domain: "notification_fabric",
    label: "SHS BOS Notification & Alert Fabric",
    source_type: "legacy_local_storage",
    source_keys: ["shs_bos_notification_fabric_v1_notifications"],
    target_repository: "notification_fabric",
    target_schema_version: "shs.critical.notification-fabric.v1",
    id_fields: ["notification_id"],
    compatibility_mode: "repository_primary_with_fallback",
    stage: "repository_primary_with_fallback",
    priority: "P0",
  },
  {
    migration_id: "critical_state_tracking_intelligence_v1",
    domain: "tracking_intelligence",
    label: "SHS Tracking Intelligence",
    source_type: "legacy_local_storage",
    source_keys: ["shs:tracking:intelligence:v1:events", "shs:tracking:intelligence:v1:reviewed-signals"],
    target_repository: "tracking_intelligence",
    target_schema_version: "shs.critical.tracking.v1",
    id_fields: ["tracking_event_id", "signal_id"],
    compatibility_mode: "repository_primary_with_fallback",
    stage: "repository_primary_with_fallback",
    priority: "P1",
  },
  {
    migration_id: "critical_state_executive_command_center_v1",
    domain: "executive_command_center",
    label: "SHS BOS Executive Command Center",
    source_type: "legacy_local_storage",
    source_keys: [
      "shs_bos_executive_command_center_v1_notes",
      "shs_bos_executive_command_center_v1_reviewed",
      "shs_bos_executive_command_center_v1_snapshots"
    ],
    target_repository: "executive_command_center",
    target_schema_version: "shs.critical.executive-command-center.v1",
    id_fields: ["note_id", "priority_id", "snapshot_id"],
    compatibility_mode: "repository_primary_with_fallback",
    stage: "repository_primary_with_fallback",
    priority: "P0",
  },
]);

export const CRITICAL_STATE_DEFERRED_DOMAINS = Object.freeze([
  { domain: "event_bus", reason: "Event history audited; automatic migration deferred until message fabric persistence strategy is owner-approved." },
  { domain: "system_registry", reason: "Local notes/state audited; registry authority remains Master Layer Registry plus System Registry V1." },
  { domain: "agent_operational_records", reason: "Agent records already have separate safety validators and are deferred for owner review." },
  { domain: "direct_connect_proof_records", reason: "Direct Connect remains direct-source proof only; proof migration is deferred to avoid data ownership drift." },
  { domain: "reports_state", reason: "Reports state remains approval-gated and deferred for reporting owner review." },
  { domain: "production_automation_v2_state", reason: "Production Automation remains local planning only; migration deferred for production owner review." },
]);

export function listCriticalStateMigrations() {
  return CRITICAL_STATE_MIGRATION_REGISTRY.map((entry) => ({ ...entry }));
}

export function getCriticalStateMigration(domainOrId) {
  return CRITICAL_STATE_MIGRATION_REGISTRY.find((entry) => (
    entry.domain === domainOrId || entry.migration_id === domainOrId
  )) || null;
}

export function assertPrimaryDomainsRegistered() {
  const domains = new Set(CRITICAL_STATE_MIGRATION_REGISTRY.map((entry) => entry.domain));
  return CRITICAL_STATE_PRIMARY_DOMAINS.every((domain) => domains.has(domain));
}
