export const SHS_COMMAND_BUS_VERSION = "shs.bos.command-bus.v1";

export const SHS_COMMAND_BUS_SAFETY_COPY =
  "SHS BOS Command Bus V1 standardizes internal command requests for validation, approval, routing, preview, dry-run, and audit only. It does not execute autonomous AI, shell commands, Python, external APIs, webhooks, OAuth, banking, payments, report publishing, public approval mutation, SHF Impact mutation, production writes, file deletion, recursive execution, or command chaining without approval.";

export const SHS_COMMAND_TYPES = Object.freeze([
  "system",
  "workflow",
  "tracking",
  "persistence",
  "registry",
  "governance",
  "reports",
  "agent",
  "client_ops",
  "website_studio",
  "production",
  "sales",
  "direct_connect",
  "qa",
  "scheduler",
  "notifications",
  "analytics",
  "identity",
  "security",
]);

export const SHS_COMMAND_REQUIRED_FIELDS = Object.freeze([
  "command_id",
  "command_type",
  "command_name",
  "source_layer",
  "target_layer",
  "requested_by",
  "requested_at",
  "risk_level",
  "approval_required",
  "execution_mode",
  "payload",
  "validation_status",
  "approval_status",
  "execution_status",
  "completion_status",
  "audit_status",
  "notes",
]);

export const SHS_COMMAND_EXECUTION_MODES = Object.freeze(["preview", "dry_run", "manual", "approved", "blocked"]);
export const SHS_COMMAND_RISK_LEVELS = Object.freeze(["low", "medium", "high", "critical"]);
export const SHS_COMMAND_APPROVAL_LEVELS = Object.freeze(["Safe", "Owner Review", "Governance Review", "Blocked"]);
export const SHS_COMMAND_PIPELINE_STEPS = Object.freeze([
  "Receive",
  "Validate",
  "Permission Check",
  "Safety Check",
  "Policy Check",
  "Approval Check",
  "Queue",
  "Dispatch",
  "Dry Run",
  "Preview",
  "Audit",
]);

export const SHS_COMMAND_DANGEROUS_CAPABILITIES = Object.freeze({
  autonomous_execution_enabled: false,
  self_modifying_behavior_enabled: false,
  recursive_execution_enabled: false,
  external_api_enabled: false,
  webhook_send_enabled: false,
  oauth_enabled: false,
  credential_storage_enabled: false,
  banking_enabled: false,
  plaid_enabled: false,
  payment_execution_enabled: false,
  report_publish_enabled: false,
  shf_impact_data_mutation_enabled: false,
  public_approval_mutation_enabled: false,
  production_write_enabled: false,
  shell_execution_enabled: false,
  python_execution_enabled: false,
  file_deletion_enabled: false,
  network_execution_enabled: false,
  unapproved_command_chaining_enabled: false,
});

export function createCommand(input = {}) {
  return {
    command_id: input.command_id || `command_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    command_type: input.command_type || "system",
    command_name: input.command_name || "local.command.preview",
    source_layer: input.source_layer || "SHS BOS Admin",
    target_layer: input.target_layer || "System",
    requested_by: input.requested_by || "shs_admin",
    requested_at: input.requested_at || new Date().toISOString(),
    risk_level: input.risk_level || "low",
    approval_required: input.approval_required ?? false,
    execution_mode: input.execution_mode || "preview",
    payload: input.payload && typeof input.payload === "object" ? input.payload : {},
    validation_status: input.validation_status || "needs_review",
    approval_status: input.approval_status || "not_required",
    execution_status: input.execution_status || "not_executed",
    completion_status: input.completion_status || "preview_only",
    audit_status: input.audit_status || "recorded",
    notes: input.notes || "",
  };
}
