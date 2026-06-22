import React from "react";
import {
  filterReadinessForVisibility,
  getExecutiveSummaryFindings,
  getExecutiveSummaryRead,
  getRecommendedNextAction,
  isRestrictedReportVisibility,
  normalizeAuditStatus,
  normalizeLifecycleStatus,
  normalizeShsStatus,
  normalizeSystemHealth,
  safeReportValue,
} from "../shsPremiumReportData";
import ShsExecutiveSummaryMetadataStrip from "./ShsExecutiveSummaryMetadataStrip.jsx";
import ShsExecutiveSummaryStatusCard from "./ShsExecutiveSummaryStatusCard.jsx";
import ShsReportControlStatusPanel from "./ShsReportControlStatusPanel.jsx";
import {
  ShsPremiumReportInteriorPage,
  ShsReportDataStatusBadge,
} from "./ShsPremiumReportShared.jsx";

function readinessRowStatus(report, sourceArea) {
  const row = (report?.readiness || []).find(
    (item) => String(item.sourceArea || "").toLowerCase() === sourceArea.toLowerCase()
  );
  return normalizeShsStatus(row?.status);
}

function reportReadinessValue(report) {
  const explicit = report?.executiveSummary?.reportReadiness;
  if (explicit) return normalizeLifecycleStatus(explicit) === "Missing" ? normalizeShsStatus(explicit) : normalizeLifecycleStatus(explicit);
  return normalizeLifecycleStatus(report?.lifecycleStatus);
}

export default function ShsPremiumExecutiveSummaryPage({ report }) {
  const summary = report?.executiveSummary || {};
  const findings = summary.findings?.length ? summary.findings : getExecutiveSummaryFindings(report);
  const readinessRows = filterReadinessForVisibility(report);
  const restrictedVisibility = isRestrictedReportVisibility(report);
  const systemHealth = normalizeSystemHealth(summary.systemHealth);
  const auditStatus = normalizeAuditStatus(summary.auditStatus);
  const reportReadiness = reportReadinessValue(report);
  const nextAction = getRecommendedNextAction(report);

  const statusCards = [
    {
      icon: "◎",
      title: "System Health",
      value: systemHealth,
      status: readinessRowStatus(report, "ClientOps Center"),
      source: "SHS ClientOps Center",
    },
    {
      icon: "▣",
      title: "Report Readiness",
      value: reportReadiness,
      status: normalizeShsStatus(summary.reportReadiness || report?.dataMode),
      source: "SHS Reports Command readiness engine",
    },
    {
      icon: "◌",
      title: "Audit Status",
      value: auditStatus,
      status: readinessRowStatus(report, "Audit Trail"),
      source: "SHS Audit Trail",
    },
    {
      icon: "↗",
      title: "Next Action",
      value: nextAction,
      status: normalizeShsStatus(report?.lifecycleStatus),
      source: "Report lifecycle/recommendation engine",
    },
  ];

  return (
    <ShsPremiumReportInteriorPage
      report={report}
      pageNumber={2}
      title="Executive Summary"
      subtitle="A leadership overview of system health, operational performance, report readiness, and recommended next actions."
      sidePanel={<ShsReportControlStatusPanel report={report} />}
    >
      <ShsExecutiveSummaryMetadataStrip report={report} />

      <section className="shs-exec-decision-card">
        <div className="shs-exec-decision-card__icon" aria-hidden="true">
          <span>▲</span>
        </div>
        <div>
          <p className="shs-premium-kicker">Leadership Read</p>
          <h2>Executive Decision Summary</h2>
          <p>{getExecutiveSummaryRead(report)}</p>
          {summary.topBlocker ? (
            <div className="shs-exec-decision-card__blocker">
              <strong>Top Blocker</strong>
              <span>{restrictedVisibility ? "Some internal-only details are hidden for this report visibility mode." : safeReportValue(summary.topBlocker)}</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="shs-exec-status-grid" aria-label="Executive summary status cards">
        {statusCards.map((card) => (
          <ShsExecutiveSummaryStatusCard key={card.title} {...card} />
        ))}
      </section>

      <section className="shs-exec-content-grid">
        <div className="shs-exec-panel">
          <div className="shs-exec-panel__header">
            <p className="shs-premium-kicker">Signals</p>
            <h2>Key Findings</h2>
          </div>
          <ol className="shs-exec-findings">
            {findings.map((finding) => (
              <li key={finding}>{finding}</li>
            ))}
          </ol>
          {restrictedVisibility ? (
            <p className="shs-exec-safe-note">Some internal-only details are hidden for this report visibility mode.</p>
          ) : null}
        </div>

        <div className="shs-exec-panel">
          <div className="shs-exec-panel__header">
            <p className="shs-premium-kicker">Readiness</p>
            <h2>Data Readiness Snapshot</h2>
          </div>
          <table className="shs-exec-readiness-table">
            <thead>
              <tr>
                <th>Source Area</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {readinessRows.length ? (
                readinessRows.map((row) => (
                  <tr key={row.sourceArea}>
                    <td>{safeReportValue(row.sourceArea)}</td>
                    <td><ShsReportDataStatusBadge status={row.status} /></td>
                    <td>{safeReportValue(row.notes)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td>Missing</td>
                  <td><ShsReportDataStatusBadge status="Missing" /></td>
                  <td>Readiness data is missing.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="shs-exec-next-move">
        <span aria-hidden="true">◆</span>
        <div>
          <p className="shs-premium-kicker">Recommended Next Move</p>
          <h2>Recommended Next Move</h2>
          <p>{nextAction}</p>
        </div>
      </section>
    </ShsPremiumReportInteriorPage>
  );
}
