export const AGENT_WORKFLOW_TYPES = Object.freeze([
  "sales_to_delivery",
  "report_generation",
  "qa_delivery",
  "clientops_review",
  "governance_review",
  "launch_readiness",
  "custom",
]);

export const AGENT_WORKFLOW_TEMPLATES_V1 = Object.freeze([
  {
    workflow_type: "sales_to_delivery",
    display_name: "Sales to Delivery Workflow",
    default_owner_agent_id: "shs_sales_agent",
    participating_agent_ids: ["shs_sales_agent", "shs_project_agent", "shs_library_agent", "shs_qa_agent", "shs_report_agent", "shs_governance_agent", "shs_executive_agent"],
    required_approval_points: ["operator reviews sales handoff", "operator reviews delivery readiness", "operator reviews executive summary"],
    blocked_actions: ["execute_production_action", "publish_report", "send_external_message", "write_warehouse_record"],
    produces: ["internal multi-agent workflow", "operator review packet", "safe next-step recommendation"],
    cannot_produce: ["client-facing delivery", "published report", "production mutation", "public-approved impact data"],
    steps: [
      ["Sales intake review", "shs_sales_agent", "intake"],
      ["Project setup review", "shs_project_agent", "review"],
      ["Library packet review", "shs_library_agent", "review"],
      ["QA readiness review", "shs_qa_agent", "qa"],
      ["Report readiness review", "shs_report_agent", "report"],
      ["Governance boundary review", "shs_governance_agent", "governance"],
      ["Executive handoff summary", "shs_executive_agent", "summary"],
    ],
  },
  {
    workflow_type: "report_generation",
    display_name: "Report Generation Workflow",
    default_owner_agent_id: "shs_report_agent",
    participating_agent_ids: ["shs_report_agent", "shs_governance_agent", "shs_executive_agent"],
    required_approval_points: ["operator reviews report readiness", "operator reviews governance boundary", "operator reviews executive summary"],
    blocked_actions: ["publish_report", "mark_public_approved", "mutate_shf_impact_data"],
    produces: ["internal report workflow", "premium preview review packet", "governance summary"],
    cannot_produce: ["published report", "public approval", "SHF Impact Data Spine mutation"],
    steps: [
      ["Report readiness review", "shs_report_agent", "report"],
      ["Premium preview review", "shs_report_agent", "review"],
      ["Governance boundary review", "shs_governance_agent", "governance"],
      ["Executive summary review", "shs_executive_agent", "summary"],
    ],
  },
  {
    workflow_type: "qa_delivery",
    display_name: "QA Delivery Workflow",
    default_owner_agent_id: "shs_qa_agent",
    participating_agent_ids: ["shs_qa_agent", "shs_project_agent", "shs_clientops_agent", "shs_governance_agent"],
    required_approval_points: ["operator reviews QA readiness", "operator reviews ClientOps handoff"],
    blocked_actions: ["execute_production_action", "send_notification", "send_external_message"],
    produces: ["QA checklist workflow", "project blocker review", "internal delivery handoff"],
    cannot_produce: ["deployment", "client message", "notification"],
    steps: [
      ["QA checklist review", "shs_qa_agent", "qa"],
      ["Project blocker review", "shs_project_agent", "review"],
      ["ClientOps handoff review", "shs_clientops_agent", "handoff"],
      ["Governance readiness review", "shs_governance_agent", "governance"],
    ],
  },
  {
    workflow_type: "clientops_review",
    display_name: "ClientOps Review Workflow",
    default_owner_agent_id: "shs_clientops_agent",
    participating_agent_ids: ["shs_clientops_agent", "shs_report_agent", "shs_executive_agent", "shs_governance_agent"],
    required_approval_points: ["operator reviews client health packet", "operator reviews executive briefing"],
    blocked_actions: ["mutate_production_record", "send_external_message", "publish_report"],
    produces: ["internal client health workflow", "upgrade opportunity summary", "operator briefing"],
    cannot_produce: ["client record mutation", "external client contact", "published report"],
    steps: [
      ["Client health review", "shs_clientops_agent", "review"],
      ["Upgrade opportunity review", "shs_clientops_agent", "review"],
      ["Report summary review", "shs_report_agent", "report"],
      ["Executive briefing", "shs_executive_agent", "summary"],
    ],
  },
  {
    workflow_type: "governance_review",
    display_name: "Governance Review Workflow",
    default_owner_agent_id: "shs_governance_agent",
    participating_agent_ids: ["shs_governance_agent", "shs_executive_agent"],
    required_approval_points: ["operator reviews daily audit", "operator reviews policy boundary"],
    blocked_actions: ["bypass_truth_spine", "bypass_policy_engine", "mark_public_approved"],
    produces: ["governance workflow", "policy boundary summary", "owner review brief"],
    cannot_produce: ["truth verification override", "public approval", "policy bypass"],
    steps: [
      ["Daily audit review", "shs_governance_agent", "governance"],
      ["Policy boundary review", "shs_governance_agent", "governance"],
      ["Executive signoff summary", "shs_executive_agent", "summary"],
    ],
  },
  {
    workflow_type: "launch_readiness",
    display_name: "Launch Readiness Workflow",
    default_owner_agent_id: "shs_executive_agent",
    participating_agent_ids: ["shs_executive_agent", "shs_governance_agent", "shs_qa_agent", "shs_report_agent", "shs_clientops_agent"],
    required_approval_points: ["operator reviews launch readiness", "operator reviews owner approval packet"],
    blocked_actions: ["execute_production_action", "publish_report", "send_notification", "webhook", "warehouse"],
    produces: ["launch readiness workflow", "internal owner briefing", "operator approval packet"],
    cannot_produce: ["launch execution", "external notification", "warehouse write", "report publishing"],
    steps: [
      ["Readiness overview", "shs_executive_agent", "summary"],
      ["Governance audit review", "shs_governance_agent", "governance"],
      ["QA smoke review", "shs_qa_agent", "qa"],
      ["Report handoff review", "shs_report_agent", "report"],
      ["ClientOps readiness review", "shs_clientops_agent", "review"],
      ["Owner approval packet", "shs_executive_agent", "approval"],
    ],
  },
].map((template) => ({
  ...template,
  steps: template.steps.map(([title, owning_agent_id, step_type], index) => ({
    sequence_index: index + 1,
    title,
    owning_agent_id,
    step_type,
    description: `${title} for internal operator review only.`,
  })),
})));

export function getAgentWorkflowTemplate(workflowType) {
  return AGENT_WORKFLOW_TEMPLATES_V1.find((template) => template.workflow_type === workflowType)
    || AGENT_WORKFLOW_TEMPLATES_V1[0];
}

export function getNextRecommendedWorkflowStep(steps = []) {
  return [...steps]
    .sort((a, b) => a.sequence_index - b.sequence_index)
    .find((step) => !["completed", "skipped"].includes(step.status)) || null;
}
