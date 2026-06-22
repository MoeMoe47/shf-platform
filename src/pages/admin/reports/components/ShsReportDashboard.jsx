import React from "react";
import { Link } from "react-router-dom";
import { SHS_REPORT_LAUNCH_POINTS } from "@/data/shsReports/shsReportLaunchPoints";
import { SHS_REPORT_REGISTRY } from "@/data/shsReports/shsReportRegistry";
import { evaluateReportReadiness } from "@/data/shsReports/shsReportReadiness";
import ShsReportStatusCard from "./ShsReportStatusCard.jsx";
import ShsReportTypeCard from "./ShsReportTypeCard.jsx";

export default function ShsReportDashboard({ reports = [] }) {
  const counts = {
    generated: reports.length,
    draft: reports.filter((report) => report.lifecycleStatus === "draft").length,
    dataReview: reports.filter((report) => report.lifecycleStatus === "data-review").length,
    brandReview: reports.filter((report) => report.lifecycleStatus === "brand-review").length,
    auditReview: reports.filter((report) => report.lifecycleStatus === "audit-review").length,
    ready: reports.filter((report) => report.lifecycleStatus === "ready-for-export").length,
    exported: reports.filter((report) => report.lifecycleStatus === "exported").length,
    blocked: reports.filter((report) => report.lifecycleStatus === "blocked").length,
    missingWarnings: reports.reduce((total, report) => total + (report.missingDataWarnings?.length || 0), 0),
    auditExceptions: reports.reduce((total, report) => total + (report.auditExceptions?.filter((item) => item.status !== "resolved").length || 0), 0),
  };

  const statusCards = [
    ["Reports Generated", counts.generated, "Seed and local records", "blue"],
    ["Draft Reports", counts.draft, "Editable records", "slate"],
    ["Data Review", counts.dataReview, "Readiness gate", "gold"],
    ["Brand Review", counts.brandReview, "Branding gate", "violet"],
    ["Audit Review", counts.auditReview, "Audit gate", "gold"],
    ["Ready for Export", counts.ready, "Can prepare PDF", "green"],
    ["Exported Reports", counts.exported, "Locked records", "green"],
    ["Blocked Reports", counts.blocked, "Missing required data", "red"],
    ["Missing Data Warnings", counts.missingWarnings, "Operator follow-up", "red"],
    ["Audit Exceptions", counts.auditExceptions, "Open exceptions", "gold"],
  ];

  return (
    <>
      <section className="shs-reports-hero">
        <div>
          <p>Silicon Heartland OS</p>
          <h1>Reports Command</h1>
          <span>Generate, review, verify, and export SHS-powered reports through Silicon Heartland OS.</span>
        </div>
        <div className="shs-reports-hero__actions">
          <Link to="/ops/reports/create">Create Report</Link>
          <Link to="/ops/reports/premium-preview">Premium Preview</Link>
          <Link to="/ops/reports/history">Report History</Link>
        </div>
      </section>

      <section className="shs-report-status-grid">
        {statusCards.map(([label, value, note, tone]) => (
          <ShsReportStatusCard key={label} label={label} value={value} note={note} tone={tone} />
        ))}
      </section>

      <section className="shs-report-panel">
        <div className="shs-report-panel__header">
          <p>Report Registry</p>
          <h2>Create From Registered Report Types</h2>
          <span>Report rules come from the central registry, not scattered page logic.</span>
        </div>
        <div className="shs-report-type-grid">
          {SHS_REPORT_REGISTRY.filter((type) =>
            ["premium-os-report-book", "client-white-label-report", "audit-report", "monthly-review-report", "qa-delivery-report", "report-history"].includes(type.id) ||
            ["project-status-report", "executive-summary-report", "proposal-report", "build-packet-report", "visual-qa-report", "internal-ops-report"].includes(type.id)
          ).map((type) => (
            <ShsReportTypeCard key={type.id} type={type} />
          ))}
        </div>
      </section>

      <section className="shs-report-panel">
        <div className="shs-report-panel__header">
          <p>Source Trace</p>
          <h2>Recent Report Readiness</h2>
          <span>Every report remains traceable to SHS source areas.</span>
        </div>
        <div className="shs-report-recent-list">
          {reports.slice(0, 6).map((report) => {
            const readiness = evaluateReportReadiness(report);
            return (
              <article key={report.id || report.reportId}>
                <strong>{report.title}</strong>
                <span>{report.subjectName} · {report.reportType}</span>
                <em>{readiness.blocked ? "Blocked by readiness gate" : readiness.canExport ? "Export-ready" : "Review required"}</em>
              </article>
            );
          })}
        </div>
      </section>

      <section className="shs-report-panel">
        <div className="shs-report-panel__header">
          <p>Launch Points</p>
          <h2>Connected SHS Infrastructure</h2>
          <span>Reports originate from or trace back to existing SHS operating surfaces.</span>
        </div>
        <div className="shs-report-launch-grid">
          {SHS_REPORT_LAUNCH_POINTS.map((point) => (
            <article key={point.area}>
              <strong>{point.area}</strong>
              <span>{point.actions.join(" · ")}</span>
              <Link to={point.route}>Open source area</Link>
              {point.todo ? <em>{point.todo}</em> : null}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
