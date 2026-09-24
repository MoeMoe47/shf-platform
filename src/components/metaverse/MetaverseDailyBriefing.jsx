import React from "react";

const LABELS = {
  today: "Today",
  opportunities: "Opportunities",
  city: "City Today",
  economy: "Economy",
  progress: "Progress",
};

export default function MetaverseDailyBriefing({ briefing, open = false }) {
  const sections = briefing?.sections || {};
  const entries = Object.entries(LABELS).map(([key, label]) => [key, label, sections[key] || []]).filter(([, , items]) => items.length);
  if (!open || !entries.length) return null;
  return (
    <section className="met-briefing" aria-labelledby="met-briefing-title">
      <p className="met-orch-label">Daily City Briefing</p>
      <h2 id="met-briefing-title">Silicon Heartland Today</h2>
      {entries.map(([key, label, items]) => (
        <section key={key} className="met-briefing__section" aria-label={label}>
          <h3>{label}</h3>
          <ul>
            {items.slice(0, 3).map((item) => (
              <li key={item.id || `${item.source_type}:${item.source_ref}`}>
                <span>{item.title}</span>
                <small>{item.summary}</small>
                <em>{item.source_type}</em>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}
