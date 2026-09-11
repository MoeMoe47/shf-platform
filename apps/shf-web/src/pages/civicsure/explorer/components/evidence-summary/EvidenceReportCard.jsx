// EvidenceReportCard.jsx — "Related Assurance Report" panel. This
// will later connect to Shared Reporting / an immutable public report
// route; neither exists yet, so "View Report" renders as a clearly
// labeled, inert demo placeholder rather than faking report
// generation — same convention as Outcome Detail's
// OutcomeReportCard.jsx. DEMO / FRAME DATA (see
// ../../evidenceSummaryMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function EvidenceReportCard({ report }) {
  return (
    <section className="cse-card cse-evs-report" aria-labelledby="cse-evs-report-heading">
      <h3 id="cse-evs-report-heading" className="cse-evs-report__heading">
        Related Assurance Report
      </h3>
      <p className="cse-evs-report__name">{report.name}</p>
      <dl className="cse-evs-report__list">
        <div>
          <dt>Version</dt>
          <dd>{report.version}</dd>
        </div>
        <div>
          <dt>Reporting period</dt>
          <dd>{report.reportingPeriod}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <span className="cse-pill">{report.status}</span>
          </dd>
        </div>
      </dl>
      <button
        type="button"
        className="cse-btn cse-btn--outline"
        aria-disabled="true"
        aria-label={`View ${report.name} (demo — immutable report route not yet available)`}
        title="Demo — immutable report route not yet available"
      >
        <ExplorerIcon name="document" />
        View Report
      </button>
    </section>
  );
}
