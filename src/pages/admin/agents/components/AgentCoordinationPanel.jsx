import React from "react";

export default function AgentCoordinationPanel({
  plans,
  metrics,
  agentsById,
  selectedPlanId,
  onSelectPlan,
}) {
  return (
    <section className="agent-workbench-panel agent-coordination-panel" aria-label="Agent Coordination Panel">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Agent Coordination</span>
          <strong>{metrics.total_plans} plans</strong>
        </div>
      </div>
      <div className="agent-memory-boundary">
        Agent Coordination V1 coordinates internal SHS agent work only. It does not execute production actions, publish reports, create public-approved SHF impact data, send external messages, or write warehouse records.
      </div>
      <div className="agent-workbench-agent-counts">
        <div><span>In Review</span><strong>{metrics.in_review_plans}</strong></div>
        <div><span>Approved</span><strong>{metrics.approved_plans}</strong></div>
        <div><span>Blocked</span><strong>{metrics.blocked_plans}</strong></div>
        <div><span>Handoffs</span><strong>{metrics.total_handoffs}</strong></div>
      </div>
      <div className="agent-coordination-list">
        {plans.map((plan) => (
          <button
            type="button"
            key={plan.coordination_plan_id}
            className={plan.coordination_plan_id === selectedPlanId ? "is-active" : ""}
            onClick={() => onSelectPlan(plan.coordination_plan_id)}
          >
            <span>{plan.workflow_type} · {plan.status}</span>
            <strong>{plan.title}</strong>
            <small>Owner: {agentsById[plan.owner_agent_id]?.name || plan.owner_agent_id} · Next: {agentsById[plan.next_best_agent_id]?.name || plan.next_best_agent_id}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
