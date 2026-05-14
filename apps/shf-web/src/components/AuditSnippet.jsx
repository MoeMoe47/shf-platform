import React from "react";

export default function AuditSnippet({ items = [] }) {
  return (
    <div>
      <h4 style={{ marginBottom: 8 }}>Recent Audit</h4>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {items.map((item) => (
          <li key={item.audit_event_id}>
            {item.action_type} — {item.reason_text || "No reason"} — {item.target_object_id}
          </li>
        ))}
      </ul>
    </div>
  );
}
