import React from "react";

export default function AgentCoordinationSafetyPanel({ plan, safety, metrics }) {
  return (
    <section className="agent-workbench-panel agent-coordination-safety" aria-label="Agent Coordination Safety Panel">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Coordination Safety</span>
          <strong>{safety?.blocked_items?.length ? "Review required" : "Internal safe"}</strong>
        </div>
      </div>
      <div className="agent-workbench-safe-stub__body">
        <p className="agent-workbench-safety-note">
          Coordination plans can assign, sequence, handoff, summarize, and review only. Execution remains disabled in V1.
        </p>
        <div className="agent-workbench-flag-grid">
          <div><span>execution_enabled_v1</span><strong>{String(plan?.execution_enabled_v1 ?? false)}</strong></div>
          <div><span>Production Action</span><strong>{String(plan?.production_action_executed ?? false)}</strong></div>
          <div><span>Report Published</span><strong>{String(plan?.report_published ?? false)}</strong></div>
          <div><span>Public Data</span><strong>{String(plan?.public_data_mutated ?? false)}</strong></div>
          <div><span>public_approved</span><strong>{String(plan?.public_approved_mutated ?? false)}</strong></div>
          <div><span>Warehouse Write</span><strong>{String(plan?.warehouse_write_performed ?? false)}</strong></div>
        </div>
        <div className="agent-workbench-kv-grid">
          <div><span>Blocked Items</span><strong>{safety?.blocked_items?.length || 0}</strong></div>
          <div><span>Execution Enabled</span><strong>{metrics.execution_enabled_count}</strong></div>
          <div><span>Blocked Plans</span><strong>{metrics.blocked_plans}</strong></div>
          <div><span>Blocked Handoffs</span><strong>{metrics.blocked_handoffs}</strong></div>
        </div>
      </div>
    </section>
  );
}
