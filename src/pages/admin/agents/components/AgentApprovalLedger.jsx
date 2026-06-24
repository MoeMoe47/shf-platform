import React from "react";

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "Not approved";
}

function FlagSummary({ record }) {
  const flags = [
    "execution_allowed_v1",
    "production_action_executed",
    "report_published",
    "public_data_mutated",
    "public_approved_mutated",
    "shf_impact_data_mutated",
    "external_message_sent",
    "webhook_sent",
    "warehouse_write_performed",
  ];

  const allFalse = flags.every((flag) => record?.[flag] === false);
  return <span className={`agent-workbench-flag${allFalse ? " is-safe" : " is-blocked"}`}>{allFalse ? "all false" : "review"}</span>;
}

export default function AgentApprovalLedger({ records = [], agentsById = {} }) {
  return (
    <section className="agent-workbench-panel" aria-label="Approval Ledger">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Approval Ledger</span>
          <strong>{records.length} approval records</strong>
        </div>
      </div>
      <div className="agent-workbench-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Approval</th>
              <th>Task</th>
              <th>Agent</th>
              <th>Status</th>
              <th>Risk</th>
              <th>Approved By</th>
              <th>Approved At</th>
              <th>Stub</th>
              <th>Dangerous Flags</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.approval_id}>
                <td><strong>{record.approval_id}</strong></td>
                <td>{record.task_id}</td>
                <td>{agentsById[record.agent_id]?.name || record.agent_id}</td>
                <td>{record.approval_status}</td>
                <td><span className={`agent-workbench-risk is-${record.risk_level}`}>{record.risk_level}</span></td>
                <td>{record.approved_by || "n/a"}</td>
                <td>{formatDate(record.approved_at)}</td>
                <td>{record.safe_execution_stub_status}</td>
                <td><FlagSummary record={record} /></td>
              </tr>
            ))}
            {!records.length ? (
              <tr>
                <td colSpan={9}>No approval ledger records yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
