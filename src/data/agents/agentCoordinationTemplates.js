export const AGENT_COORDINATION_WORKFLOW_TYPES = Object.freeze([
  "sales_to_delivery",
  "report_generation",
  "qa_delivery",
  "clientops_review",
  "governance_review",
  "launch_readiness",
  "custom",
]);

export const AGENT_COORDINATION_TEMPLATES_V1 = Object.freeze([
  {
    workflow_type: "sales_to_delivery",
    display_name: "Sales to Delivery",
    default_owner_agent_id: "shs_sales_agent",
    participating_agent_ids: ["shs_sales_agent", "shs_project_agent", "shs_library_agent", "shs_qa_agent", "shs_report_agent", "shs_governance_agent"],
    recommended_sequence: ["shs_sales_agent", "shs_project_agent", "shs_library_agent", "shs_qa_agent", "shs_report_agent", "shs_governance_agent"],
    required_context_types: ["sales", "project", "qa", "report", "governance"],
    required_approval_points: ["operator approves sales handoff", "operator approves delivery readiness"],
    blocked_actions: ["execute_production_action", "publish_report", "send_external_message", "write_warehouse_record"],
    produces: ["internal handoff plan", "operator review packet", "safe next-agent recommendation"],
    cannot_produce: ["client-facing delivery", "published report", "production mutation", "public-approved impact data"],
  },
  {
    workflow_type: "report_generation",
    display_name: "Report Generation",
    default_owner_agent_id: "shs_report_agent",
    participating_agent_ids: ["shs_report_agent", "shs_governance_agent", "shs_executive_agent"],
    recommended_sequence: ["shs_report_agent", "shs_governance_agent", "shs_executive_agent"],
    required_context_types: ["report", "governance", "system"],
    required_approval_points: ["operator approves report readiness review"],
    blocked_actions: ["publish_report", "mark_public_approved", "mutate_shf_impact_data"],
    produces: ["internal report readiness plan", "governance review packet"],
    cannot_produce: ["published report", "public approval", "SHF Impact Data Spine mutation"],
  },
  {
    workflow_type: "qa_delivery",
    display_name: "QA Delivery",
    default_owner_agent_id: "shs_qa_agent",
    participating_agent_ids: ["shs_qa_agent", "shs_project_agent", "shs_clientops_agent", "shs_governance_agent"],
    recommended_sequence: ["shs_qa_agent", "shs_project_agent", "shs_clientops_agent", "shs_governance_agent"],
    required_context_types: ["qa", "project", "client", "governance"],
    required_approval_points: ["operator approves QA readiness", "operator approves ClientOps handoff"],
    blocked_actions: ["execute_production_action", "send_notification", "send_external_message"],
    produces: ["QA blocker summary", "internal delivery handoff"],
    cannot_produce: ["deployment", "client message", "notification"],
  },
  {
    workflow_type: "clientops_review",
    display_name: "ClientOps Review",
    default_owner_agent_id: "shs_clientops_agent",
    participating_agent_ids: ["shs_clientops_agent", "shs_report_agent", "shs_executive_agent", "shs_governance_agent"],
    recommended_sequence: ["shs_clientops_agent", "shs_report_agent", "shs_executive_agent", "shs_governance_agent"],
    required_context_types: ["client", "report", "ops", "governance"],
    required_approval_points: ["operator approves client review packet"],
    blocked_actions: ["mutate_production_record", "send_external_message", "publish_report"],
    produces: ["internal client health summary", "operator briefing"],
    cannot_produce: ["client record mutation", "external client contact", "published report"],
  },
  {
    workflow_type: "governance_review",
    display_name: "Governance Review",
    default_owner_agent_id: "shs_governance_agent",
    participating_agent_ids: ["shs_governance_agent", "shs_executive_agent"],
    recommended_sequence: ["shs_governance_agent", "shs_executive_agent"],
    required_context_types: ["governance", "system"],
    required_approval_points: ["operator approves governance review outcome"],
    blocked_actions: ["bypass_truth_spine", "bypass_policy_engine", "mark_public_approved"],
    produces: ["governance risk summary", "owner review brief"],
    cannot_produce: ["truth verification override", "public approval", "policy bypass"],
  },
  {
    workflow_type: "launch_readiness",
    display_name: "Launch Readiness",
    default_owner_agent_id: "shs_executive_agent",
    participating_agent_ids: ["shs_executive_agent", "shs_governance_agent", "shs_qa_agent", "shs_report_agent", "shs_clientops_agent"],
    recommended_sequence: ["shs_executive_agent", "shs_governance_agent", "shs_qa_agent", "shs_report_agent", "shs_clientops_agent"],
    required_context_types: ["ops", "governance", "qa", "report", "client"],
    required_approval_points: ["operator approves launch readiness summary"],
    blocked_actions: ["execute_production_action", "publish_report", "send_notification", "webhook", "warehouse"],
    produces: ["launch readiness coordination plan", "internal owner briefing"],
    cannot_produce: ["launch execution", "external notification", "warehouse write", "report publishing"],
  },
]);

export function getAgentCoordinationTemplate(workflowType) {
  return AGENT_COORDINATION_TEMPLATES_V1.find((template) => template.workflow_type === workflowType)
    || AGENT_COORDINATION_TEMPLATES_V1[0];
}

export function getNextBestAgentForPlan(plan, handoffs = []) {
  const template = getAgentCoordinationTemplate(plan?.workflow_type);
  const acceptedAgents = new Set(
    (handoffs || [])
      .filter((handoff) => handoff.coordination_plan_id === plan?.coordination_plan_id && handoff.status === "accepted")
      .map((handoff) => handoff.to_agent_id)
  );
  if (plan?.owner_agent_id) acceptedAgents.add(plan.owner_agent_id);
  return template.recommended_sequence.find((agentId) => !acceptedAgents.has(agentId)) || template.recommended_sequence.at(-1) || template.default_owner_agent_id;
}
