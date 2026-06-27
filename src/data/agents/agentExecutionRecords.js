export const AGENT_EXECUTION_REQUEST_STORAGE_KEY = "shs.agentWorkbench.executionRequests.v1";
export const AGENT_EXECUTION_RECORD_STORAGE_KEY = "shs.agentWorkbench.executionRecords.v1";
export const AGENT_EXECUTION_RECOMMENDATION_STORAGE_KEY = "shs.agentWorkbench.executionRecommendations.v1";

export const AGENT_EXECUTION_REQUEST_STATUSES_V1 = [
  "draft",
  "eligible",
  "blocked",
  "executed_local",
  "failed",
];

export const AGENT_EXECUTION_RECORD_STATUSES_V1 = [
  "executed_local",
  "blocked",
  "failed",
];

export const AGENT_CONTROLLED_EXECUTOR_REQUEST_MODEL_V1 = {
  execution_request_id: "exec_req_001",
  task_id: "",
  agent_id: "",
  approval_id: "",
  workflow_run_id: "",
  workflow_step_id: "",
  coordination_plan_id: "",
  handoff_id: "",
  context_packet_id: "",
  action_type: "",
  requested_by: "operator",
  risk_level: "low|medium|high|critical",
  status: "draft|eligible|blocked|executed_local|failed",
  requested_payload: {},
  created_at: "",
  updated_at: "",
  blockers: [],
  warnings: [],
  human_approval_required: true,
  approval_required: true,
  execution_allowed_v1: "eligible_local_only",
  production_action_executed: false,
  report_published: false,
  public_data_mutated: false,
  public_approved_mutated: false,
  shf_impact_data_mutated: false,
  external_message_sent: false,
  webhook_sent: false,
  notification_sent: false,
  warehouse_write_performed: false,
  auth_modified: false,
};

export const AGENT_CONTROLLED_EXECUTOR_RECORD_MODEL_V1 = {
  execution_record_id: "exec_rec_001",
  execution_request_id: "",
  task_id: "",
  agent_id: "",
  approval_id: "",
  action_type: "",
  status: "executed_local|blocked|failed",
  result_summary: "",
  local_changes: [],
  blocked_changes: [],
  audit_events: [],
  created_at: "",
  operator_note: "",
  production_action_executed: false,
  report_published: false,
  public_data_mutated: false,
  public_approved_mutated: false,
  shf_impact_data_mutated: false,
  external_message_sent: false,
  webhook_sent: false,
  notification_sent: false,
  warehouse_write_performed: false,
  auth_modified: false,
};
