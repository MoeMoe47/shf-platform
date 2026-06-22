import React from "react";
import { safeReportValue } from "../shsPremiumReportData";

export default function ShsClientProfileInfoCard({ title, eyebrow, rows = [] }) {
  const safeRows = rows.length ? rows : [["Missing", "Missing"]];

  return (
    <section className="shs-profile-card">
      <div className="shs-profile-card__header">
        <p className="shs-premium-kicker">{safeReportValue(eyebrow)}</p>
        <h2>{safeReportValue(title)}</h2>
      </div>
      <dl className="shs-profile-info-list">
        {safeRows.map(([label, value]) => (
          <div key={label}>
            <dt>{safeReportValue(label)}</dt>
            <dd>{safeReportValue(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
