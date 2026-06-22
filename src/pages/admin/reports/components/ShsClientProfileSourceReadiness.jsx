import React from "react";
import { evaluateReportReadiness } from "@/data/shsReports/shsReportReadiness";
import {
  filterReadinessForVisibility,
  safeReportValue,
} from "../shsPremiumReportData";
import { ShsReportDataStatusBadge } from "./ShsPremiumReportShared.jsx";

function readinessLevel(readiness) {
  if (readiness.blocked) return "Blocked";
  if (readiness.draftOrSample.length) return "Data Review";
  if (readiness.canExport) return "Ready for Export";
  return "Review Needed";
}

export default function ShsClientProfileSourceReadiness({ report }) {
  const readiness = evaluateReportReadiness(report);
  const rows = filterReadinessForVisibility(report).slice(0, 6);
  const summary = [
    ["Verified", readiness.summary.verified],
    ["Approved", readiness.summary.approved],
    ["Draft", readiness.summary.draft],
    ["Sample", readiness.summary.sample],
    ["Missing", readiness.summary.missing],
  ];

  return (
    <section className="shs-profile-card shs-profile-card--wide">
      <div className="shs-profile-card__header shs-profile-card__header--split">
        <div>
          <p className="shs-premium-kicker">Source Readiness</p>
          <h2>Source Readiness Snapshot</h2>
        </div>
        <strong className="shs-profile-readiness-level">{readinessLevel(readiness)}</strong>
      </div>

      <div className="shs-profile-readiness-summary" aria-label="Readiness summary counts">
        {summary.map(([label, value]) => (
          <span key={label}>
            <em>{label}</em>
            <strong>{Number.isFinite(value) ? value : "Missing"}</strong>
          </span>
        ))}
      </div>

      <table className="shs-exec-readiness-table shs-profile-readiness-table">
        <thead>
          <tr>
            <th>Source Area</th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => (
              <tr key={row.sourceArea || row.label}>
                <td>{safeReportValue(row.label || row.sourceArea)}</td>
                <td><ShsReportDataStatusBadge status={row.status} /></td>
                <td>{safeReportValue(row.notes)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td>Missing</td>
              <td><ShsReportDataStatusBadge status="Missing" /></td>
              <td>Missing</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
