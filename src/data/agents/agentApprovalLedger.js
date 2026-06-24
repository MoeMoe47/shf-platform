export const AGENT_APPROVAL_LEDGER_STORAGE_KEY = "shs.agentWorkbench.approvalLedger.v1";

export const AGENT_APPROVAL_STATUSES_V1 = ["pending", "approved", "rejected", "revoked"];
export const AGENT_SAFE_EXECUTION_STUB_STATUSES_V1 = ["not_checked", "eligible", "blocked", "simulated"];

export const AGENT_DANGEROUS_EXECUTION_FLAGS_FALSE = {
  execution_allowed_v1: false,
  production_action_executed: false,
  report_published: false,
  public_data_mutated: false,
  public_approved_mutated: false,
  shf_impact_data_mutated: false,
  external_message_sent: false,
  webhook_sent: false,
  warehouse_write_performed: false,
};

function canUseStorage() {
  try {
    return Boolean(globalThis?.localStorage);
  } catch {
    return false;
  }
}

function cloneRecords(records) {
  return JSON.parse(JSON.stringify(records || []));
}

function nowIso() {
  return new Date().toISOString();
}

function makeLedgerEvent(approvalId, eventType, message, actor = "shs_operator") {
  return {
    event_id: `apevt_${approvalId}_${Date.now()}`,
    event_type: eventType,
    actor,
    message,
    created_at: nowIso(),
  };
}

export function getAgentApprovalLedger() {
  if (!canUseStorage()) return [];

  try {
    const stored = globalThis.localStorage.getItem(AGENT_APPROVAL_LEDGER_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAgentApprovalLedger(records) {
  const safeRecords = Array.isArray(records) ? records : [];
  if (canUseStorage()) {
    globalThis.localStorage.setItem(AGENT_APPROVAL_LEDGER_STORAGE_KEY, JSON.stringify(safeRecords));
  }
  return safeRecords;
}

export function resetAgentApprovalLedger() {
  return saveAgentApprovalLedger([]);
}

export function getLatestApprovalForTask(taskId, records = getAgentApprovalLedger()) {
  return [...(records || [])]
    .filter((record) => record.task_id === taskId)
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))[0] || null;
}

export function getApprovedLedgerRecordForTask(taskId, records = getAgentApprovalLedger()) {
  return [...(records || [])]
    .filter((record) => record.task_id === taskId && record.approval_status === "approved")
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))[0] || null;
}

function makeGovernanceRefs(task, agent) {
  const refs = [
    "docs/AI_SWARM_GUARDRAILS_V1.md",
    "docs/POLICY_ENGINE_LAYER_V1.md",
    "docs/READINESS_GATE_LAYER_V1.md",
    "docs/AUDIT_VERIFICATION_LAYER_V1.md",
    "docs/PRODUCTION_AUTOMATION_LAYER_V1.md",
    "docs/NOTIFICATION_ALERT_LAYER_V1.md",
    "docs/TRUTH_SPINE_GUARDRAILS.md",
    "docs/AGENT_CANONICAL_WORKFORCE_CAPABILITY_MATRIX_V1.json",
  ];

  if (task?.source_system === "shs_reports" || agent?.id === "shs_report_agent") {
    refs.push("reports_layer_review_required");
  }
  if (task?.source_system === "clientops" || agent?.id === "shs_clientops_agent") {
    refs.push("docs/SHS_SPINE_FORMALIZATION_V1.md");
  }

  return refs;
}

export function createAgentApprovalLedgerRecord({ task, agent, approvalStatus, approvedBy = "shs_operator", operatorNote = "" }) {
  const createdAt = nowIso();
  const approvalId = `approval_${task?.task_id || "unknown"}_${Date.now().toString(36)}`;
  const approved = approvalStatus === "approved";

  return {
    approval_id: approvalId,
    task_id: task?.task_id || "",
    agent_id: agent?.id || task?.assigned_agent_id || "",
    requested_action: task?.task_type || task?.intended_action || "",
    approval_status: AGENT_APPROVAL_STATUSES_V1.includes(approvalStatus) ? approvalStatus : "pending",
    approved_by: approved ? approvedBy : "",
    approved_at: approved ? createdAt : "",
    risk_level: task?.risk_level || "medium",
    requires_human_approval: true,
    governance_refs: makeGovernanceRefs(task, agent),
    operator_note: operatorNote || task?.operator_note || "",
    safe_execution_stub_status: approved ? "not_checked" : "blocked",
    ...AGENT_DANGEROUS_EXECUTION_FLAGS_FALSE,
    created_at: createdAt,
    updated_at: createdAt,
    audit_events: [
      makeLedgerEvent(
        approvalId,
        "approval_recorded",
        approved
          ? "Human approval recorded for safe V1 readiness review only. No production action executed."
          : "Approval rejection recorded. Safe execution remains blocked."
      ),
    ],
  };
}

export function recordAgentApprovalDecision(options) {
  const records = getAgentApprovalLedger();
  const record = createAgentApprovalLedgerRecord(options);
  return saveAgentApprovalLedger([record, ...records]);
}

export function updateApprovalStubStatus(approvalId, safeExecutionStubStatus, message) {
  const updatedAt = nowIso();
  const records = getAgentApprovalLedger().map((record) => {
    if (record.approval_id !== approvalId) return record;
    return {
      ...record,
      safe_execution_stub_status: AGENT_SAFE_EXECUTION_STUB_STATUSES_V1.includes(safeExecutionStubStatus)
        ? safeExecutionStubStatus
        : "blocked",
      ...AGENT_DANGEROUS_EXECUTION_FLAGS_FALSE,
      updated_at: updatedAt,
      audit_events: [
        ...(Array.isArray(record.audit_events) ? record.audit_events : []),
        makeLedgerEvent(record.approval_id, "safe_execution_stub_recorded", message || "Safe execution stub result recorded."),
      ],
    };
  });
  return saveAgentApprovalLedger(records);
}
