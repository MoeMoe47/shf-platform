import React from "react";

export default function KpiStrip({ summary }) {
  if (!summary) return null;

  const cards = [
    {
      label: "Total Participants",
      value: summary.total_participants,
    },
    {
      label: "Jobs Placed",
      value: summary.total_jobs_placed,
    },
    {
      label: "Avg Wage (Region)",
      value:
        summary.avg_wage_region != null
          ? `$${summary.avg_wage_region.toFixed(2)}/hr`
          : "—",
    },
    {
      label: "Credentials Awarded",
      value: summary.total_credentials_awarded,
    },
  ];

  return (
    <section className="shf-kpi-strip">
      {cards.map((card) => (
        <div key={card.label} className="shf-kpi-card">
          <div className="shf-kpi-label">{card.label}</div>
          <div className="shf-kpi-value">{card.value}</div>
        </div>
      ))}
    </section>
  );
}
