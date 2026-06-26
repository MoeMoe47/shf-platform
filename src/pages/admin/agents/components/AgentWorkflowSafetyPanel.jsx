import React from "react";

export default function AgentWorkflowSafetyPanel({ run, safety, metrics }) {
  return (
    <section className="agent-workbench-panel agent-workflow-safety" aria-label="Workflow Safety Panel">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Workflow Safety</span>
          <strong>{safety.blocked_items.length ? "Review required" : "Internal safe"}</strong>
        </div>
      </div>
      <div className="agent-workbench-safe-stub__body">
        <p className="agent-workbench-safety-note">
          Workflow Engine V1 can organize, pause, block, advance, and complete local review steps only. Execution remains disabled in V1.
        </p>
        <div className="agent-workbench-flag-grid">
          <div><span>execution_enabled_v1</span><strong>{String(run?.execution_enabled_v1 ?? false)}</strong></div>
          <div><span>Production Action</span><strong>{String(run?.production_action_executed ?? false)}</strong></div>
          <div><span>Report Published</span><strong>{String(run?.report_published ?? false)}</strong></div>
          <div><span>Public Data</span><strong>{String(run?.public_data_mutated ?? false)}</strong></div>
          <div><span>public_approved</span><strong>{String(run?.public_approved_mutated ?? false)}</strong></div>
          <div><span>Warehouse Write</span><strong>{String(run?.warehouse_write_performed ?? false)}</strong></div>
        </div>
        <div className="agent-workbench-metrics">
          <article><span>Blocked Items</span><strong>{safety.blocked_items.length}</strong></article>
          <article><span>Execution Enabled</span><strong>0</strong></article>
          <article><span>Blocked Runs</span><strong>{metrics.blocked_runs}</strong></article>
          <article><span>Blocked Steps</span><strong>{metrics.blocked_steps}</strong></article>
        </div>
      </div>
    </section>
  );
}
