import React from "react";

export default function LifecycleHistory({ items = [] }) {
  if (!items.length) return <p>No lifecycle history is recorded for this authority.</p>;
  return <ol aria-label="Lifecycle history" className="gpa-list">{items.map((item, index) => <li key={item.audit_event_id || item.correlation_id || index}><strong>{item.action_type || item.event_type || "EVENT"}</strong> <span>{item.actor_user_id || item.actor_system_id || item.actor || "system"}</span> <time dateTime={item.event_timestamp || item.created_at}>{new Date(item.event_timestamp || item.created_at).toLocaleString()}</time>{item.previous_state_json ? <small>Previous state recorded</small> : null}{item.reason_code ? <small>Reason: {item.reason_code}</small> : null}{item.correlation_id ? <small>Correlation: {item.correlation_id}</small> : null}</li>)}</ol>;
}
