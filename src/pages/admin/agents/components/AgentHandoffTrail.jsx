import React from "react";

export default function AgentHandoffTrail({ handoffs, agentsById, onHandoffStatus }) {
  return (
    <section className="agent-workbench-panel agent-handoff-trail" aria-label="Agent Handoff Trail">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Handoff Trail</span>
          <strong>{handoffs.length} records</strong>
        </div>
      </div>
      <ol className="agent-workbench-timeline">
        {handoffs.length ? handoffs.map((handoff) => {
          const canReview = ["draft", "sent_for_review"].includes(handoff.status);
          return (
            <li key={handoff.handoff_id}>
              <span>{handoff.handoff_type} · {handoff.status}</span>
              <strong>{agentsById[handoff.from_agent_id]?.name || handoff.from_agent_id} to {agentsById[handoff.to_agent_id]?.name || handoff.to_agent_id}</strong>
              <small>{handoff.handoff_summary}</small>
              {canReview ? (
                <div className="agent-handoff-actions">
                  <button type="button" onClick={() => onHandoffStatus(handoff.handoff_id, "accepted")}>Accept Handoff</button>
                  <button type="button" onClick={() => onHandoffStatus(handoff.handoff_id, "rejected")}>Reject Handoff</button>
                </div>
              ) : null}
            </li>
          );
        }) : (
          <li>
            <span>Empty</span>
            <strong>No handoffs yet</strong>
            <small>Create a handoff from the selected coordination plan.</small>
          </li>
        )}
      </ol>
    </section>
  );
}
