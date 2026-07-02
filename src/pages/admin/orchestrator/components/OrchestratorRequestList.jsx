import React from "react";

export default function OrchestratorRequestList({ requests, selectedRequestId, onSelectRequest, onAnalyze, onAction }) {
  return (
    <section className="orch-card">
      <div className="orch-section-head">
        <div>
          <span>Requests</span>
          <h2>Operator Intent</h2>
        </div>
        <strong>{requests.length}</strong>
      </div>
      <div className="orch-request-list">
        {requests.map((request) => (
          <button
            type="button"
            key={request.orchestration_request_id}
            className={request.orchestration_request_id === selectedRequestId ? "is-active" : ""}
            onClick={() => onSelectRequest(request.orchestration_request_id)}
          >
            <span>{request.status}</span>
            <strong>{request.title}</strong>
            <small>{request.operator_intent}</small>
          </button>
        ))}
      </div>
      <div className="orch-action-row">
        <button type="button" onClick={() => onAnalyze(selectedRequestId)}>Analyze</button>
        <button type="button" onClick={() => onAction("ready")}>Ready For Review</button>
        <button type="button" onClick={() => onAction("block")}>Block</button>
        <button type="button" onClick={() => onAction("complete")}>Complete Local</button>
      </div>
    </section>
  );
}
