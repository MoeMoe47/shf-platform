import React from "react";
import { safeReportValue } from "../shsPremiumReportData";
import { ShsReportDataStatusBadge } from "./ShsPremiumReportShared.jsx";

export default function ShsExecutiveSummaryMetadataStrip({ report }) {
  const items = [
    ["Report Type", safeReportValue(report?.reportType)],
    ["Subject", safeReportValue(report?.subjectName)],
    ["Reporting Period", safeReportValue(report?.reportingPeriodLabel)],
    ["Data Mode", safeReportValue(report?.dataMode)],
  ];

  return (
    <section className="shs-exec-metadata" aria-label="Executive summary metadata">
      {items.map(([label, value]) => (
        <div key={label} className="shs-exec-metadata__item">
          <span>{label}</span>
          {label === "Data Mode" ? <ShsReportDataStatusBadge status={value} /> : <strong>{value}</strong>}
        </div>
      ))}
    </section>
  );
}
