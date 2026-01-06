// src/components/lordOutcomes/summary/KpiStrip.jsx
import React from "react";

export default function KpiStrip({ summary }) {
  if (!summary) return null;

  const cards = [
    {
      label: "Total Participants",
      value: summary.totalParticipants.toLocaleString(),
    },
    {
      label: "Jobs Placed",
      value: summary.jobsPlaced.toLocaleString(),
    },
    {
      label: "Avg Wage (Region)",
      value: `$${summary.avgWage.toFixed(2)}/hr`,
    },
    {
      label: "Credentials Awarded",
      value: summary.credentials.toLocaleString(),
    },
    {
      label: "90-Day Retention",
      value: `${Math.round(summary.retention90Rate * 100)}%`,
    },
  ];

  return (
    <section className="lord-kpis">
      {cards.map((card) => (
        <div key={card.label} className="lord-kpi-card">
          <div className="lord-kpi-label">{card.label}</div>
          <div className="lord-kpi-value">{card.value}</div>
        </div>
      ))}
    </section>
  );
}
