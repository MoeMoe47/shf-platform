import React from "react";

export default function AgentWorkflowEnginePanel({
  runs,
  templates,
  metrics,
  agentsById,
  selectedRunId,
  coordinationPlans,
  onSelectRun,
  onCreateFromTemplate,
  onCreateFromCoordinationPlan,
}) {
  return (
    <section className="agent-workbench-panel agent-workflow-engine-panel" aria-label="Workflow Engine Panel">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Workflow Engine</span>
          <strong>{runs.length} runs</strong>
        </div>
      </div>
      <p className="agent-memory-boundary">
        Agent Workflow Engine V1 structures multi-agent workflows only. It does not execute production actions, publish reports, create public-approved SHF impact data, send external messages, or write warehouse records.
      </p>
      <div className="agent-workbench-metrics">
        <article><span>Active</span><strong>{metrics.active_runs}</strong></article>
        <article><span>Blocked</span><strong>{metrics.blocked_runs}</strong></article>
        <article><span>Completed</span><strong>{metrics.completed_runs}</strong></article>
        <article><span>Avg Progress</span><strong>{metrics.average_progress_percent}%</strong></article>
      </div>
      <div className="agent-workflow-list">
        {runs.map((run) => (
          <button
            key={run.workflow_run_id}
            className={run.workflow_run_id === selectedRunId ? "is-active" : ""}
            type="button"
            onClick={() => onSelectRun(run.workflow_run_id)}
          >
            <span>{run.workflow_type} · {run.status}</span>
            <strong>{run.title}</strong>
            <small>Owner: {agentsById[run.owner_agent_id]?.name || run.owner_agent_id} · Progress: {run.progress_percent}%</small>
          </button>
        ))}
      </div>
      <div className="agent-template-grid agent-workflow-template-grid">
        {templates.map((template) => (
          <article key={template.workflow_type}>
            <span>{template.workflow_type}</span>
            <strong>{template.display_name}</strong>
            <p>Owner: {agentsById[template.default_owner_agent_id]?.name || template.default_owner_agent_id}</p>
            <small>{template.steps.map((step) => agentsById[step.owning_agent_id]?.name || step.owning_agent_id).join(" -> ")}</small>
            <button type="button" onClick={() => onCreateFromTemplate(template.workflow_type)}>Create Workflow From Template</button>
          </article>
        ))}
      </div>
      <div className="agent-workflow-coordination-create">
        <h3>Create From Coordination Plan</h3>
        <div>
          {coordinationPlans.map((plan) => (
            <button key={plan.coordination_plan_id} type="button" onClick={() => onCreateFromCoordinationPlan(plan.coordination_plan_id)}>
              {plan.title}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
