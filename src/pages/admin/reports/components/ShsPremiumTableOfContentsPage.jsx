import React from "react";
import { ShsPremiumReportInteriorPage } from "./ShsPremiumReportShared.jsx";

const CONTENT_ROWS = [
  ["01", "Executive Summary", "Leadership overview and control status"],
  ["02", "Client / Organization Profile", "Subject context and operating profile"],
  ["03", "System Overview", "System architecture and service scope"],
  ["04", "Performance Snapshot", "KPI and activity review"],
  ["05", "Actual vs. Target Performance", "Operational comparison and variance"],
  ["06", "Trend Analysis", "Movement over the reporting period"],
  ["07", "ClientOps Health Report", "ClientOps readiness and health signals"],
  ["08", "Support & Maintenance Summary", "Support activity and maintenance work"],
  ["09", "Audit Report & Verification Trail", "Trust, exceptions, and review evidence"],
  ["10", "Operational Risk Analysis", "Risks, blockers, and owner actions"],
  ["11", "Version History & Change Log", "Change record and export lifecycle"],
  ["12", "Upgrade Opportunities", "Recommended upgrades and follow-up"],
  ["13", "90-Day Action Plan", "Near-term action plan"],
  ["14", "Appendix & Export Metadata", "Source and export metadata"],
];

function HowToReadPanel() {
  return (
    <aside className="shs-report-control-panel" aria-label="How to read this report">
      <div className="shs-report-control-panel__header">
        <span>Guide</span>
        <h2>How to Read This Report</h2>
      </div>
      <div className="shs-report-control-panel__trust">
        <p>This report is generated from SHS operating infrastructure and should be read as an operational, performance, and verification document.</p>
      </div>
      <div className="shs-report-control-panel__rows">
        <div><span>Report Sources</span><strong>SHS ClientOps Center, SHS Reporting Layer, SHS Internal Ops System, SHS QA + Delivery Records, SHS Support & Maintenance Records, SHS Version History, SHS Audit Trail, Silicon Heartland OS Export Metadata</strong></div>
        <div><span>Report Modes</span><strong>Premium Report Mode, Executive View, Client White-Label View</strong></div>
        <div><span>Trust Status Meanings</span><strong>Verified, Approved, Draft, Sample, Missing</strong></div>
      </div>
    </aside>
  );
}

export default function ShsPremiumTableOfContentsPage({ report }) {
  return (
    <ShsPremiumReportInteriorPage
      report={report}
      pageNumber={1}
      title="Table of Contents"
      subtitle="A premium operational report generated through Silicon Heartland OS."
      sidePanel={<HowToReadPanel />}
    >
      <section className="shs-toc-panel">
        <p className="shs-premium-kicker">Report Structure</p>
        <h2>Premium Report Book Pages</h2>
        <div className="shs-toc-list">
          {CONTENT_ROWS.map(([page, title, description]) => (
            <div key={page} className="shs-toc-list__row">
              <strong>{page}</strong>
              <span>{title}</span>
              <em>{description}</em>
            </div>
          ))}
        </div>
      </section>
    </ShsPremiumReportInteriorPage>
  );
}
