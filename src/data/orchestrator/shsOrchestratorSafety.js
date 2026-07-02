export const SHS_ORCHESTRATOR_SAFETY_COPY =
  "SHS System Orchestrator V1 coordinates approved internal workflows only. It does not execute production changes, publish reports, mutate SHF public data, send external messages, write warehouse records, or modify auth.";

export const SHS_ORCHESTRATOR_DANGEROUS_FLAGS_FALSE = Object.freeze({
  execution_enabled: false,
  production_mutation_enabled: false,
  public_publish_enabled: false,
  public_approved_mutation_enabled: false,
  shf_impact_data_mutation_enabled: false,
  external_delivery_enabled: false,
  warehouse_write_enabled: false,
  auth_mutation_enabled: false,
});

export const SHS_ORCHESTRATOR_BLOCKED_ACTIONS = Object.freeze([
  "production_mutation",
  "public_approval_mutation",
  "shf_impact_data_mutation",
  "report_publishing_without_approval",
  "external_delivery",
  "send_webhook",
  "send_notification",
  "warehouse_write",
  "auth_mutation",
  "live_direct_connect_integration",
  "banking_account_oauth_payment_connection",
  "autonomous_executor_action",
]);

const DANGEROUS_ACTION_PATTERNS = [
  /production\s*mutation/i,
  /public[_ -]?approved|public approval mutation|mark public/i,
  /shf impact data|impact data mutation/i,
  /publish report|report publishing/i,
  /external delivery|external message|send message/i,
  /webhook/i,
  /notification/i,
  /warehouse/i,
  /auth mutation|modify auth|identity mutation/i,
  /live direct connect|live integration|external api/i,
  /bank|account linking|oauth|payment|plaid|credential/i,
  /autonomous|execute production|executor action/i,
];

export function applyShsOrchestratorSafetyDefaults(value = {}) {
  return {
    ...value,
    human_approval_required: true,
    approval_required: true,
    dangerous_actions_blocked: Array.isArray(value.dangerous_actions_blocked)
      ? [...new Set([...value.dangerous_actions_blocked, ...SHS_ORCHESTRATOR_BLOCKED_ACTIONS])]
      : [...SHS_ORCHESTRATOR_BLOCKED_ACTIONS],
    ...SHS_ORCHESTRATOR_DANGEROUS_FLAGS_FALSE,
  };
}

export function findRequestedDangerousActions(request = {}, plan = {}) {
  const haystack = [
    request.operator_intent,
    request.operator_note,
    plan.summary,
    ...(plan.safe_next_actions || []),
    ...(plan.warnings || []),
    ...(plan.blockers || []),
  ].join(" ");
  return SHS_ORCHESTRATOR_BLOCKED_ACTIONS.filter((action, index) => DANGEROUS_ACTION_PATTERNS[index]?.test(haystack));
}

export function buildShsOrchestratorAuditEvent(eventType, note = "") {
  return {
    event_type: eventType,
    occurred_at: new Date().toISOString(),
    actor: "shs_system_orchestrator_v1",
    note,
    execution_enabled: false,
    production_mutation_enabled: false,
    public_approved_mutation_enabled: false,
    shf_impact_data_mutation_enabled: false,
  };
}
