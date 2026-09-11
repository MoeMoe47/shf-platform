// OutcomeReportCard.jsx — "Related Assurance Report" panel. This will
// later connect to Shared Reporting / an immutable public report
// route; neither exists yet, so "View Report" renders as a clearly
// labeled, inert demo placeholder rather than faking report
// generation — same convention as Agency Detail's
// AgencyReportsPanel.jsx and Funding Detail's FundingReportCard.jsx.
// DEMO / FRAME DATA (see ../../outcomeDetailMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function OutcomeReportCard({ report }) {
  return (
    <section className="cse-card cse-otc-report" aria-labelledby="cse-otc-report-heading">
      <h3 id="cse-otc-report-heading" className="cse-otc-report__heading">
        Related Assurance Report
      </h3>
      <p className="cse-otc-report__name">{report.name}</p>
      <dl className="cse-otc-report__list">
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
