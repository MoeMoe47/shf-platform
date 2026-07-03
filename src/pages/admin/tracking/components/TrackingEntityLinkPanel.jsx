import React from "react";

export default function TrackingEntityLinkPanel({ links, entityFilter, onEntityFilter }) {
  return (
    <section className="tracking-panel">
      <div className="panel-heading"><p>Entity Links</p><h2>Client / Project / Report / Agent Links</h2></div>
      <input value={entityFilter} onChange={(event) => onEntityFilter(event.target.value)} placeholder="Filter by client, project, report, or agent ID" />
      <div className="tracking-list compact">
        {links.slice(0, 10).map((link) => (
          <article key={link.link_id}>
            <strong>{link.entity_type}</strong>
            <span>{link.entity_id}</span>
            <small>{link.visibility} · {link.safety_status}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

