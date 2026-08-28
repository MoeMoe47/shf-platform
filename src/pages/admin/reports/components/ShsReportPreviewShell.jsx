import React from "react";
import { Link } from "react-router-dom";
export default function ShsReportPreviewShell({
  report,
  reports = [],
  selectedReportId,
  onReportChange,
  activePage,
  children,
}) {
  if (!report) {
    return (
      <main className="shs-report-preview" role="status">
        <h1>Verified report data unavailable</h1>
        <p>No canonical report record is available for preview. Seed and sample records are not shown as institutional reports.</p>
      </main>
    );
  }
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
              {reports.map((item) => (
                <option key={item.reportId} value={item.reportId}>
                  {item.subjectName} - {item.lifecycleStatus}
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
