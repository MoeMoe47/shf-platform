import React from "react";
import {
  AGENT_EXECUTION_ALLOWED_ACTION_TYPES,
  AGENT_EXECUTION_BLOCKED_ACTION_TYPES,
  AGENT_EXECUTION_DANGEROUS_FLAGS_FALSE,
  evaluateControlledExecutionRequest,
} from "@/data/agents/agentControlledExecutor";

const FLAG_LABELS = [
  ["Production Action", "production_action_executed"],
  ["Report Published", "report_published"],
  ["Public Data", "public_data_mutated"],
  ["public_approved", "public_approved_mutated"],
  ["SHF Impact Data", "shf_impact_data_mutated"],
  ["External Message", "external_message_sent"],
  ["Webhook", "webhook_sent"],
  ["Notification", "notification_sent"],
  ["Warehouse Write", "warehouse_write_performed"],
  ["Auth Modified", "auth_modified"],
];

export default function AgentExecutionSafetyPanel({ previewRequest, context, metrics }) {
  const evaluation = previewRequest
    ? evaluateControlledExecutionRequest(previewRequest, context)
    : { blockers: [], warnings: [], eligible: false, ...AGENT_EXECUTION_DANGEROUS_FLAGS_FALSE };

  return (
    <section className="agent-workbench-panel agent-execution-safety" aria-label="Execution Safety Panel">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Execution Safety</span>
          <strong>{evaluation.eligible ? "Eligible local" : "Guarded"}</strong>
        </div>
      </div>
      <div className="agent-workbench-safe-stub__body">
        <p className="agent-workbench-safety-note">
          Controlled Executor V1 only performs approved local/internal actions. It does not execute production actions, publish reports, mutate SHF Impact Data Spine, mark public_approved, send external messages, write warehouse records, or modify auth.
        </p>
        <div className="agent-workbench-metrics">
          <article><span>Allowed Actions</span><strong>{metrics.allowed_action_count}</strong></article>
          <article><span>Blocked Actions</span><strong>{metrics.blocked_action_count}</strong></article>
          <article><span>Executed Local</span><strong>{metrics.executed_local_records}</strong></article>
          <article><span>Flag Violations</span><strong>{metrics.dangerous_flag_violations}</strong></article>
        </div>
        <div className="agent-workbench-flag-grid">
          {FLAG_LABELS.map(([label, key]) => (
            <div key={key}>
              <span>{label}</span>
              <strong>{String(evaluation[key] ?? false)}</strong>
            </div>
          ))}
        </div>
        <div className="agent-workbench-split">
          <div className="agent-workbench-detail-list">
            <h3>Eligibility Blockers</h3>
            {evaluation.blockers.length ? (
              <ul>{evaluation.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul>
            ) : (
              <p>None</p>
            )}
          </div>
          <div className="agent-workbench-detail-list">
            <h3>Warnings</h3>
            {evaluation.warnings.length ? (
              <ul>{evaluation.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
            ) : (
              <p>None</p>
            )}
          </div>
        </div>
        <div className="agent-executor-list-grid">
          <div className="agent-workbench-detail-list">
            <h3>Allowlisted Action Types</h3>
            <ul>{AGENT_EXECUTION_ALLOWED_ACTION_TYPES.map((action) => <li key={action}>{action}</li>)}</ul>
          </div>
          <div className="agent-workbench-detail-list">
            <h3>Blocked Action Types</h3>
            <ul>{AGENT_EXECUTION_BLOCKED_ACTION_TYPES.map((action) => <li key={action}>{action}</li>)}</ul>
          </div>
        </div>
      </div>
    </section>
  );
}
