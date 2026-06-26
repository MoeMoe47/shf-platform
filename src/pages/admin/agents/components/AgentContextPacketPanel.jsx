import React from "react";

export default function AgentContextPacketPanel({
  packets,
  selectedTask,
  selectedAgent,
  selectedMemory,
  onCreateContextPacket,
  onAddMemoryToTaskContext,
}) {
  return (
    <section className="agent-workbench-panel agent-context-panel" aria-label="Agent Context Packet Panel">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Context Packets</span>
          <strong>{packets.length} packets</strong>
        </div>
        <button type="button" onClick={onCreateContextPacket} disabled={!selectedTask || !selectedMemory}>
          Create Context Packet
        </button>
      </div>
      <div className="agent-workbench-copy">
        <p>Context packets are internal-only bundles for operator review. They do not authorize execution, public release, or SHF Impact Data Spine mutation.</p>
        <button type="button" onClick={onAddMemoryToTaskContext} disabled={!selectedTask || !selectedMemory}>
          Add Memory To Selected Task Context
        </button>
      </div>
      <div className="agent-context-list">
        {packets.length ? packets.map((packet) => (
          <article key={packet.context_packet_id}>
            <span>{packet.task_id || "no task"} · {packet.agent_id || selectedAgent?.id || "no agent"}</span>
            <strong>{packet.title}</strong>
            <p>{packet.context_summary}</p>
            <small>
              Review required: {String(packet.operator_review_required)} · Stub safe: {String(packet.safe_for_execution_stub)} · Blocked: {packet.blocked_items.length}
            </small>
          </article>
        )) : (
          <p className="agent-workbench-muted">No context packets for this task yet.</p>
        )}
      </div>
    </section>
  );
}
