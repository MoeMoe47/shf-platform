import React from "react";

function ListBlock({ title, items }) {
  return (
    <div className="agent-workbench-detail-list">
      <h3>{title}</h3>
      {items?.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p>None</p>}
    </div>
  );
}

export default function AgentMemoryDetail({ memory, safety, onArchive, onNeedsReview }) {
  if (!memory) {
    return (
      <section className="agent-workbench-panel agent-workbench-empty" aria-label="Agent Memory Detail">
        <h2>Memory Detail</h2>
        <p>Select a memory record to inspect source, boundary, references, and safety state.</p>
      </section>
    );
  }

  return (
    <section className="agent-workbench-panel agent-memory-detail" aria-label="Agent Memory Detail">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Memory Detail</span>
          <strong>{memory.title}</strong>
        </div>
        <div className="agent-memory-actions">
          <button type="button" onClick={onNeedsReview}>Mark Needs Review</button>
          <button type="button" onClick={onArchive}>Archive Memory</button>
        </div>
      </div>
      <div className="agent-workbench-detail__body">
        <div className="agent-workbench-kv-grid">
          <div><span>Memory ID</span><strong>{memory.memory_id}</strong></div>
          <div><span>Status</span><strong>{memory.status}</strong></div>
          <div><span>Visibility</span><strong>{memory.visibility}</strong></div>
          <div><span>Confidence</span><strong>{memory.confidence}</strong></div>
          <div><span>Agent</span><strong>{memory.related_agent_id || "n/a"}</strong></div>
          <div><span>Task</span><strong>{memory.related_task_id || "n/a"}</strong></div>
          <div><span>Report</span><strong>{memory.related_report_id || "n/a"}</strong></div>
          <div><span>Public Safe</span><strong>{String(memory.safe_for_public)}</strong></div>
        </div>
        <div className="agent-workbench-copy">
          <h3>Summary</h3>
          <p>{memory.summary}</p>
        </div>
        <div className="agent-workbench-copy">
          <h3>Operator Review</h3>
          <p>{memory.operator_note || safety.risk_summary}</p>
        </div>
        <div className="agent-workbench-split">
          <ListBlock title="Tags" items={memory.tags} />
          <ListBlock title="Safety Flags" items={safety.blocked_items} />
        </div>
      </div>
    </section>
  );
}
