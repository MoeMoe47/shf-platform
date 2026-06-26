import React from "react";

export default function AgentMemoryPanel({
  records,
  selectedMemoryId,
  onSelectMemory,
  onCreateManualMemory,
  metrics,
}) {
  const [note, setNote] = React.useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onCreateManualMemory(note);
    setNote("");
  }

  return (
    <section className="agent-workbench-panel agent-memory-panel" aria-label="Agent Memory Panel">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Agent Memory</span>
          <strong>{metrics.total_memory_records} records</strong>
        </div>
      </div>
      <div className="agent-memory-boundary">
        Agent Memory V1 is internal SHS operational memory. It does not publish to SHF public surfaces and does not create public-approved impact data.
      </div>
      <div className="agent-workbench-agent-counts">
        <div><span>Active</span><strong>{metrics.active_memory_records}</strong></div>
        <div><span>Needs Review</span><strong>{metrics.needs_review_records}</strong></div>
        <div><span>Archived</span><strong>{metrics.archived_memory_records}</strong></div>
        <div><span>Blocked Items</span><strong>{metrics.blocked_item_count}</strong></div>
      </div>
      <form className="agent-memory-form" onSubmit={handleSubmit}>
        <label>
          Manual memory note
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add internal operator context. Secret-like or public-risk text will be flagged needs_review."
            rows={3}
          />
        </label>
        <button type="submit">Add Manual Memory Note</button>
      </form>
      <div className="agent-memory-list">
        {records.map((record) => (
          <button
            type="button"
            key={record.memory_id}
            className={record.memory_id === selectedMemoryId ? "is-active" : ""}
            onClick={() => onSelectMemory(record.memory_id)}
          >
            <span>{record.memory_type} · {record.source_system}</span>
            <strong>{record.title}</strong>
            <small>{record.status} · {record.sensitivity} sensitivity</small>
          </button>
        ))}
      </div>
    </section>
  );
}
