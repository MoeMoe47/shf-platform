import React from "react";
import { safeReportValue } from "../shsPremiumReportData";
import { ShsReportDataStatusBadge } from "./ShsPremiumReportShared.jsx";

function modulesFromReadiness(report = {}) {
  return (Array.isArray(report.readiness) ? report.readiness : []).slice(0, 7).map((row) => ({
    id: row.sourceArea || row.label,
    label: row.label || row.sourceArea,
    sourceArea: row.sourceArea,
    status: row.status,
    note: row.notes,
  }));
}

export default function ShsClientProfileModuleList({ report }) {
  const profileModules = report?.subjectProfile?.activeModules;
  const modules = Array.isArray(profileModules) && profileModules.length
    ? profileModules
    : modulesFromReadiness(report);

  return (
    <section className="shs-profile-card shs-profile-card--wide">
      <div className="shs-profile-card__header">
        <p className="shs-premium-kicker">Operating Modules</p>
        <h2>Active Modules</h2>
      </div>
      <div className="shs-profile-module-list">
        {modules.length ? (
          modules.map((module) => (
            <article key={module.id || module.label} className="shs-profile-module-list__row">
              <div>
                <strong>{safeReportValue(module.label)}</strong>
                <span>{safeReportValue(module.sourceArea)}</span>
              </div>
              <ShsReportDataStatusBadge status={module.status} />
              <p>{safeReportValue(module.note)}</p>
            </article>
          ))
        ) : (
          <article className="shs-profile-module-list__row">
            <div>
              <strong>Missing</strong>
              <span>Missing</span>
            </div>
            <ShsReportDataStatusBadge status="Missing" />
            <p>Missing</p>
          </article>
        )}
      </div>
    </section>
  );
}
