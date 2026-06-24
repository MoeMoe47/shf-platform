import React from "react";
import { evaluateSafeExecutionEligibility } from "@/data/agents/agentSafeExecutionStub";

function ListBlock({ title, items }) {
  return (
    <div className="agent-workbench-detail-list">
      <h3>{title}</h3>
      {items?.length ? (
        <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
      ) : (
        <p>None</p>
      )}
    </div>
  );
}

function FlagGrid({ result }) {
  const flags = [
    ["Execution Allowed", "execution_allowed_v1"],
    ["Production Action", "production_action_executed"],
    ["Report Published", "report_published"],
    ["Public Data", "public_data_mutated"],
    ["public_approved", "public_approved_mutated"],
    ["SHF Data Spine", "shf_impact_data_mutated"],
    ["External Message", "external_message_sent"],
    ["Webhook", "webhook_sent"],
    ["Warehouse Write", "warehouse_write_performed"],
  ];

  return (
    <div className="agent-workbench-flag-grid">
      {flags.map(([label, key]) => (
        <div key={key}>
          <span>{label}</span>
          <strong>{String(result?.[key] ?? false)}</strong>
        </div>
      ))}
    </div>
  );
}

export default function AgentSafeExecutionPanel({ task, agent, approvalLedger, latestStubRun, onRunStub }) {
  if (!task) {
    return null;
  }

  const eligibility = evaluateSafeExecutionEligibility({ task, agent, approvalLedger });

  return (
    <section className="agent-workbench-panel agent-workbench-safe-stub" aria-label="Safe Execution Panel">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Safe Execution Panel</span>
          <strong>{eligibility.eligible ? "Simulation available" : "Blocked"}</strong>
        </div>
        <button type="button" onClick={onRunStub}>Run Safe Execution Stub</button>
      </div>
      <div className="agent-workbench-safe-stub__body">
        <p className="agent-workbench-safety-note">
          Safe Execution Stub V1 simulates readiness only. No production action, report publishing, public data mutation, webhook, notification, warehouse write, or SHF Impact Data Spine mutation occurs.
        </p>
        <div className="agent-workbench-kv-grid">
          <div><span>Approval Exists</span><strong>{eligibility.approval ? "Yes" : "No"}</strong></div>
          <div><span>Stub Can Run</span><strong>{eligibility.eligible ? "Yes" : "No"}</strong></div>
          <div><span>Task Risk</span><strong>{task.risk_level}</strong></div>
          <div><span>Last Stub</span><strong>{latestStubRun?.stub_status || "not_checked"}</strong></div>
        </div>
        <div className="agent-workbench-split">
          <ListBlock title="Eligibility Checks" items={eligibility.eligibility_checks} />
          <ListBlock title="Blocked Reasons" items={eligibility.blocked_reasons} />
        </div>
        <ListBlock title="Simulated Steps" items={latestStubRun?.simulated_steps || []} />
        <p className="agent-workbench-safety-note">No production action executed in V1.</p>
        <FlagGrid result={latestStubRun} />
      </div>
    </section>
  );
}
