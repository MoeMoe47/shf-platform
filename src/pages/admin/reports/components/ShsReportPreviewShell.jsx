import React from "react";
import { Link } from "react-router-dom";
import { getReportRecords } from "@/data/shsReports/shsReportStorage";

export default function ShsReportPreviewShell({
  report,
  selectedReportId,
  onReportChange,
  activePage,
  children,
}) {
  const reports = getReportRecords();
  const pages = [
    { id: "toc", label: "Page 1 - Table of Contents", to: "/ops/reports/premium-preview" },
    { id: "executive-summary", label: "Page 2 - Executive Summary", to: "/ops/reports/premium-preview/executive-summary" },
    { id: "client-profile", label: "Page 3 - Client / Organization Profile", to: "/ops/reports/premium-preview/client-profile" },
  ];

  return (
    <div className="shs-report-preview">
      <header className="shs-report-preview__toolbar">
        <div>
          <p>SHS Reports Command</p>
          <h1>Premium Report Preview</h1>
          <span>Use Save as PDF first, then print the saved PDF if needed.</span>
        </div>
        <div className="shs-report-preview__controls">
          <label>
            Report Record
            <select value={selectedReportId} onChange={(event) => onReportChange(event.target.value)}>
              {reports.map((seed) => (
                <option key={seed.reportId} value={seed.reportId}>
                  {seed.subjectName} - {seed.lifecycleStatus}
                </option>
              ))}
            </select>
          </label>
          <div className="shs-report-preview__page-tabs" aria-label="Premium report pages">
            {pages.map((page) => (
              <Link
                key={page.id}
                to={page.to}
                className={page.id === activePage ? "is-active" : ""}
              >
                {page.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <div className="shs-report-preview__record">
        <span>Subject: <strong>{report.subjectName || "Missing"}</strong></span>
        <span>Report ID: <strong>{report.reportId || "Missing"}</strong></span>
        <span>Mode: <strong>{report.dataMode || "Missing"}</strong></span>
      </div>

      <div className="shs-report-preview__stage">
        {children}
      </div>
    </div>
  );
}
