import React from "react";

export default function ActivityFeedCard({ items = [] }) {
  if (!items.length) return <p className="sh-muted">No recent activity.</p>;

  return (
    <ul className="dash-plainList">
      {items.map((it) => (
        <li className="dash-row" key={it.id}>
          <span className="app-ico" aria-hidden>
            {iconFor(it.kind)}
          </span>
          <div className="dash-rowMain">
            <div className="dash-title">{it.title}</div>
            <div className="dash-sub">{it.when}</div>
          </div>
          <button className="sh-btn sh-btn--secondary sh-btn--tiny">View</button>
        </li>
      ))}
    </ul>
  );
}

function iconFor(kind){
  switch(kind){
    case "artifact": return "📄";
    case "badge":    return "🏅";
    case "proof":    return "🔗";
    default:         return "📌";
  }
}
