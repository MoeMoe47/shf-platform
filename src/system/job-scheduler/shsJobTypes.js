export const SHS_JOB_SCHEDULER_VERSION = "shs.bos.job-scheduler.v1";

export const SHS_JOB_SCHEDULER_SAFETY_COPY =
  "SHS BOS Job Scheduler V1 coordinates local admin-safe job previews only. It does not run a cron server, start external workers, execute dangerous automation, mutate production data, publish reports, send webhooks or notifications, write warehouse records, modify auth, or store credentials.";

export const SHS_JOB_TYPES = [
  "maintenance",
  "governance",
  "event_bus",
  "tracking",
  "persistence",
  "registry",
  "report_review",
  "agent_review",
  "direct_connect_review",
  "system",
];

export const SHS_JOB_STATUSES = [
  "queued",
  "delayed",
  "paused",
  "retry_preview",
  "completed",
  "blocked",
];

export const SHS_JOB_RISK_LEVELS = ["low", "medium", "high", "critical"];

export const SHS_JOB_DANGEROUS_CAPABILITIES = Object.freeze({
  cron_server_enabled: false,
  external_worker_enabled: false,
  autonomous_execution_enabled: false,
  production_mutation_enabled: false,
  public_approval_mutation_enabled: false,
  shf_impact_data_mutation_enabled: false,
  report_publish_enabled: false,
  webhook_send_enabled: false,
  notification_send_enabled: false,
  warehouse_write_enabled: false,
  auth_mutation_enabled: false,
  credential_storage_enabled: false,
});

export function createJob(input = {}) {
  return {
    job_id: input.job_id || `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    job_type: input.job_type || "system",
    job_name: input.job_name || "local.scheduler.job",
    source_layer: input.source_layer || "SHS BOS Job Scheduler",
    target_layer: input.target_layer || "SHS BOS",
    entity_type: input.entity_type || "system",
    entity_id: input.entity_id || "",
    schedule_mode: input.schedule_mode || "manual",
    run_at: input.run_at || new Date().toISOString(),
    recurrence: input.recurrence || "none",
    timeout_seconds: Number(input.timeout_seconds || 300),
    max_retries: Number(input.max_retries || 0),
    retry_count: Number(input.retry_count || 0),
    risk_level: input.risk_level || "low",
    status: input.status || "queued",
    local_only: true,
    payload: input.payload && typeof input.payload === "object" ? input.payload : {},
    safety_status: input.safety_status || "needs_review",
    created_at: input.created_at || new Date().toISOString(),
    updated_at: input.updated_at || new Date().toISOString(),
    operator_note: input.operator_note || "",
  };
}

