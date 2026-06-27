import React from "react";

export default function AgentExecutionRecordTable({ records = [] }) {
  return (
    <section className="agent-workbench-panel agent-execution-records" aria-label="Execution Record Table">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Execution Records</span>
          <strong>{records.length}</strong>
        </div>
      </div>
      <div className="agent-workbench-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Record</th>
              <th>Action</th>
              <th>Status</th>
              <th>Summary</th>
              <th>Local Changes</th>
              <th>Blocked Changes</th>
              <th>Dangerous Flags</th>
            </tr>
          </thead>
          <tbody>
            {records.length ? records.map((record) => (
              <tr key={record.execution_record_id}>
                <td>
                  <strong>{record.execution_record_id}</strong>
                  <small>{record.created_at}</small>
                </td>
                <td>{record.action_type}</td>
                <td><span className={`agent-workbench-flag ${record.status === "executed_local" ? "is-safe" : "is-blocked"}`}>{record.status}</span></td>
                <td>{record.result_summary}</td>
                <td>{record.local_changes?.length ? record.local_changes.join(", ") : "None"}</td>
                <td>{record.blocked_changes?.length ? record.blocked_changes.join(", ") : "None"}</td>
                <td>
                  {[
                    record.production_action_executed,
                    record.report_published,
                    record.public_data_mutated,
                    record.public_approved_mutated,
                    record.shf_impact_data_mutated,
                    record.external_message_sent,
                    record.webhook_sent,
                    record.notification_sent,
                    record.warehouse_write_performed,
                    record.auth_modified,
                  ].every((flag) => flag === false) ? "false" : "review"}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7">No controlled execution records yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
