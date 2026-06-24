import React from "react";

export default function AgentTaskQueue({ tasks, agentsById, selectedTaskId, onSelectTask, onCreateTask }) {
  return (
    <section className="agent-workbench-panel" aria-label="Task Queue">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Task Queue</span>
          <strong>{tasks.length} visible tasks</strong>
        </div>
        <button type="button" onClick={onCreateTask}>New Safe Task</button>
      </div>
      <div className="agent-workbench-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Agent</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Approval</th>
              <th>Risk</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                key={task.task_id}
                className={selectedTaskId === task.task_id ? "is-selected" : ""}
                onClick={() => onSelectTask(task.task_id)}
              >
                <td>
                  <strong>{task.title}</strong>
                  <small>{task.task_id} · {task.source_system}</small>
                </td>
                <td>{agentsById[task.assigned_agent_id]?.name || task.assigned_agent_id || "Unassigned"}</td>
                <td>{task.priority}</td>
                <td>{task.status}</td>
                <td>{task.approval_status}</td>
                <td><span className={`agent-workbench-risk is-${task.risk_level}`}>{task.risk_level}</span></td>
                <td>{new Date(task.updated_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
