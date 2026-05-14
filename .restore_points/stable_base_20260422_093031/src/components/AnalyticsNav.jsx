// src/components/AnalyticsNav.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function AnalyticsNav({ base="/analytics" }) {
  const items = [
    { to: `${base}`, label: "Overview" },
    { to: `${base}/cohort`, label: "Cohort" },
    { to: `${base}/equity`, label: "Equity Lens" },
    { to: `${base}/funnels`, label: "Funnels" },
    { to: `${base}/exports`, label: "Exports" },
  ];
  return (
    <div className="db-grid" style={{gridTemplateColumns:"repeat(5,minmax(140px,1fr))"}}>
      {items.map(i => <Link key={i.to} className="linkcard" to={i.to}>{i.label}</Link>)}
    </div>
  );
}
