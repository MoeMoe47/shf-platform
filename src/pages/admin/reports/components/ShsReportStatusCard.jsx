import React from "react";

export default function ShsReportStatusCard({ label, value, note, tone = "blue" }) {
  return (
    <section className={`shs-report-status-card shs-report-status-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </section>
  );
}
