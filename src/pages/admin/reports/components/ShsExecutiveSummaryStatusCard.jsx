import React from "react";
import { safeReportValue } from "../shsPremiumReportData";
import { ShsReportDataStatusBadge } from "./ShsPremiumReportShared.jsx";

export default function ShsExecutiveSummaryStatusCard({
  icon,
  title,
  value,
  status,
  source,
}) {
  const displayValue = safeReportValue(value);

  return (
    <article className={`shs-exec-status-card shs-exec-status-card--${String(status || "Missing").toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="shs-exec-status-card__icon" aria-hidden="true">
        {icon}
      </div>
      <div className="shs-exec-status-card__body">
        <div className="shs-exec-status-card__top">
          <h3>{title}</h3>
          <ShsReportDataStatusBadge status={status} />
        </div>
        <strong>{displayValue}</strong>
        <span>Source: {safeReportValue(source)}</span>
      </div>
    </article>
  );
}
