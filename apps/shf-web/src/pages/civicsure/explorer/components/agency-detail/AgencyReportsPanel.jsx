// AgencyReportsPanel.jsx — Reports tab: public-facing immutable
// reports associated with this agency. This will later connect to
// Shared Reporting; no such route exists yet, so "View Report" on
// every card renders as a clearly labeled, inert demo placeholder
// rather than faking report generation — same convention as Funding
// Detail's FundingReportCard.jsx. DEMO / FRAME DATA (see
// ../../agencyDetailMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function AgencyReportsPanel({ agency }) {
  return (
    <div className="cse-agy-panel" role="tabpanel" id="cse-agy-tabpanel-reports" aria-labelledby="cse-agy-tab-reports">
      <div className="cse-agy-report-list" role="list" aria-label={`Reports associated with ${agency.name} (demo data)`}>
        {agency.reports.map((report) => (
          <article className="cse-card cse-agy-report-card" role="listitem" key={report.key}>
            <h3>{report.name}</h3>
            <dl>
              <div>
                <dt>Status</dt>
                <dd>
                  <span className="cse-pill">{report.status}</span>
                </dd>
              </div>
              <div>
                <dt>Version</dt>
                <dd>{report.version}</dd>
              </div>
              <div>
                <dt>Reporting period</dt>
                <dd>{report.reportingPeriod}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="cse-btn cse-btn--outline"
              aria-disabled="true"
              aria-label={`View ${report.name} (demo — Shared Reporting connection not yet available)`}
              title="Demo — Shared Reporting connection not yet available"
            >
              <ExplorerIcon name="document" />
              View Report
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
