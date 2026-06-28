export const PRODUCTION_AUTOMATION_V2_RUN_STORAGE_KEY = "shs.agentWorkbench.productionAutomationV2Runs.v1";

export const PRODUCTION_AUTOMATION_V2_RUN_STATUSES = [
  "draft",
  "ready",
  "in_review",
  "approved",
  "blocked",
  "completed",
  "archived",
];

export const PRODUCTION_AUTOMATION_V2_RECOMMENDATION_STORAGE_KEY = "shs.agentWorkbench.productionAutomationV2Recommendations.v1";

export const PRODUCTION_AUTOMATION_V2_DANGEROUS_FLAGS_FALSE = {
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

export const PRODUCTION_AUTOMATION_V2_RECIPE_MODEL = {
  automation_recipe_id: "auto_recipe_001",
  title: "",
  recipe_type: "sales_to_delivery|report_readiness|qa_delivery|clientops_review|launch_handoff|daily_governance|private_beta_demo|custom",
  description: "",
  owner_agent_id: "",
  participating_agent_ids: [],
  required_workflow_type: "",
  required_context_types: [],
  allowed_local_actions: [],
  blocked_actions: [],
  required_approval_points: [],
  risk_level: "low|medium|high|critical",
  human_approval_required: true,
  execution_enabled_v2: false,
  external_delivery_enabled: false,
  production_mutation_enabled: false,
  public_publish_enabled: false,
  warehouse_write_enabled: false,
  auth_mutation_enabled: false,
  created_at: "",
  updated_at: "",
};

export const PRODUCTION_AUTOMATION_V2_RUN_MODEL = {
  automation_run_id: "auto_run_001",
  automation_recipe_id: "",
  title: "",
  status: "draft|ready|in_review|approved|blocked|completed|archived",
  risk_level: "low|medium|high|critical",
  owner_agent_id: "",
  related_workflow_run_id: "",
  related_coordination_plan_id: "",
  related_task_ids: [],
  related_memory_ids: [],
  related_context_packet_ids: [],
  related_approval_ids: [],
  related_report_id: "",
  readiness_score: 0,
  blockers: [],
  warnings: [],
  local_actions_planned: [],
  local_actions_completed: [],
  operator_note: "",
  human_approval_required: true,
  approval_required: true,
  execution_enabled_v2: false,
  created_at: "",
  updated_at: "",
  audit_events: [],
  ...PRODUCTION_AUTOMATION_V2_DANGEROUS_FLAGS_FALSE,
};
