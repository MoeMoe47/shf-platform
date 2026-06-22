import React from "react";
import { evaluateReportReadiness } from "@/data/shsReports/shsReportReadiness";
import { displayDataStatus } from "@/data/shsReports/shsReportTypes";
import { ShsReportDataStatusBadge } from "./ShsPremiumReportShared.jsx";

export default function ShsReportReadinessPanel({ report }) {
  const readiness = evaluateReportReadiness(report);

  return (
    <section className="shs-report-panel">
      <div className="shs-report-panel__header">
        <p>Readiness Gate</p>
        <h2>Report Data Readiness</h2>
        <span>{readiness.blocked ? "Blocking warnings are active." : "Required source gate is reviewable."}</span>
      </div>
      <div className="shs-report-readiness-grid">
        {readiness.rows.map((row) => (
          <article key={`${row.sourceArea}-${row.label}`} className="shs-report-readiness-row">
            <div>
              <strong>{row.label}</strong>
              <span>{row.notes || "Missing"}</span>
            </div>
            <ShsReportDataStatusBadge status={displayDataStatus(row.status)} />
            {row.blockingReason ? <em>{row.blockingReason}</em> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
