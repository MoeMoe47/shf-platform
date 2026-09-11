// FundingReportCard.jsx — "Assurance Report" section. This will
// later connect to Shared Reporting; no such route exists yet, so
// "View Report" renders as a clearly labeled, inert demo placeholder
// rather than faking report generation. DEMO / FRAME DATA (see
// ../../fundingDetailMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function FundingReportCard({ report }) {
  return (
    <section className="cse-card cse-fnd-report" aria-labelledby="cse-fnd-report-heading">
      <h3 id="cse-fnd-report-heading" className="cse-fnd-report__heading">
        Assurance Report
      </h3>

      <dl className="cse-fnd-report__facts">
        <div>
          <dt>Current report</dt>
          <dd>{report.name}</dd>
        </div>
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
        aria-label="View Report (demo — Shared Reporting connection not yet available)"
        title="Demo — Shared Reporting connection not yet available"
      >
        <ExplorerIcon name="document" />
        View Report
      </button>
    </section>
  );
}
