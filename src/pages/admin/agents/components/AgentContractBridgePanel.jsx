import React from "react";

function StatusPill({ status }) {
  return <span className={`agent-workbench-flag is-${status === "blocked" ? "blocked" : "safe"}`}>{status}</span>;
}

function ListBlock({ title, items }) {
  return (
    <div className="agent-workbench-detail-list">
      <h3>{title}</h3>
      {items?.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p>None</p>}
    </div>
  );
}

export default function AgentContractBridgePanel({ summary }) {
  if (!summary) return null;

  return (
    <section className="agent-workbench-panel agent-workbench-contract-bridge" aria-label="Agent Contract Bridge">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Backend Contract Bridge</span>
          <strong>Contract status: {summary.contracts_readable ? "readable" : "unavailable"}</strong>
        </div>
        <StatusPill status={summary.alignment_status} />
      </div>
      <div className="agent-workbench-contract-bridge__body">
        <p className="agent-workbench-safety-note">
          Agent Backend Contract Bridge V1 reads local Agent Fabric contracts only. Execution remains disabled and no production action, public mutation, webhook, notification, warehouse write, or report publishing is enabled.
        </p>
        <div className="agent-workbench-kv-grid">
          <div><span>Canonical Agents</span><strong>{summary.required_agent_count}</strong></div>
          <div><span>Backend Contracts</span><strong>{summary.backend_agent_count}</strong></div>
          <div><span>Matched SHS Agents</span><strong>{summary.matched_agents.length}</strong></div>
          <div><span>Execution Enabled</span><strong>{String(summary.execution_enabled)}</strong></div>
          <div><span>Dangerous Flags</span><strong>{summary.dangerous_flags_enabled.length}</strong></div>
          <div><span>Alignment</span><strong>{summary.alignment_status}</strong></div>
        </div>
        <div className="agent-workbench-split">
          <ListBlock title="Matched Agents" items={summary.matched_agents} />
          <ListBlock title="Missing Backend Agents" items={summary.missing_backend_agents} />
        </div>
        <div className="agent-workbench-split">
          <ListBlock title="Mismatch Warnings" items={[...summary.warnings, ...summary.capability_mismatches.map((item) => `${item.agent_id}: capability boundary review`)]} />
          <ListBlock title="Dangerous Flag Scan" items={summary.dangerous_flags_enabled} />
        </div>
        <ListBlock title="Extra Backend Contracts" items={summary.extra_backend_agents} />
      </div>
    </section>
  );
}
