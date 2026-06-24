import React from "react";

export default function AgentPerformanceSnapshot({ metrics }) {
  const cards = [
    ["Total Tasks", metrics.total_tasks],
    ["Pending", metrics.pending_tasks],
    ["Approved", metrics.approved_tasks],
    ["Rejected", metrics.rejected_tasks],
    ["Completed", metrics.completed_tasks],
    ["Blocked", metrics.blocked_tasks],
  ];

  return (
    <section className="agent-workbench-panel" aria-label="Performance Snapshot">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Performance Snapshot</span>
          <strong>{metrics.approval_rate === null ? "Approval rate n/a" : `${metrics.approval_rate}% approval`}</strong>
        </div>
      </div>
      <div className="agent-workbench-metrics">
        {cards.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <div className="agent-workbench-agent-counts">
        {metrics.per_agent_task_count.map((row) => (
          <div key={row.agent_id}>
            <span>{row.name}</span>
            <strong>{row.count}</strong>
          </div>
        ))}
      </div>
      <p className="agent-workbench-muted">
        Last activity: {metrics.last_activity ? new Date(metrics.last_activity).toLocaleString() : "No activity yet"}
      </p>
    </section>
  );
}
