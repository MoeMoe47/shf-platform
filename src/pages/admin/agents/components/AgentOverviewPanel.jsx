import React from "react";

function formatList(items = []) {
  return items.slice(0, 3).join(", ") || "None";
}

export default function AgentOverviewPanel({ agents, selectedAgentId, onSelectAgent }) {
  return (
    <section className="agent-workbench-panel agent-workbench-overview" aria-label="Agent Overview">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Agent Overview</span>
          <strong>{agents.length} SHS V1 agents</strong>
        </div>
      </div>
      <div className="agent-workbench-agent-grid">
        {agents.map((agent) => (
          <button
            className={`agent-workbench-agent-card${selectedAgentId === agent.id ? " is-active" : ""}`}
            key={agent.id}
            type="button"
            onClick={() => onSelectAgent(agent.id)}
          >
            <span className={`agent-workbench-risk is-${agent.risk_level}`}>{agent.risk_level}</span>
            <strong>{agent.name}</strong>
            <small>{agent.id}</small>
            <p>{agent.role}</p>
            <dl>
              <div><dt>Status</dt><dd>{agent.status}</dd></div>
              <div><dt>Owner</dt><dd>{agent.owner}</dd></div>
              <div><dt>Allowed</dt><dd>{formatList(agent.allowed_capabilities)}</dd></div>
              <div><dt>Blocked</dt><dd>{formatList(agent.blocked_capabilities)}</dd></div>
            </dl>
          </button>
        ))}
      </div>
    </section>
  );
}
