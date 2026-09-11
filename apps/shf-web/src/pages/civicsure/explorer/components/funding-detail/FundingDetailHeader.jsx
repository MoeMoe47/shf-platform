// FundingDetailHeader.jsx — back link, eyebrow/title/status/meta/
// description, and header actions. DEMO / FRAME DATA (see
// ../../fundingDetailMockData.js). "Follow" is a real local toggle.
// "Share" and "View Assurance Report" have no wired destination yet
// (no share sheet, no Shared Reporting connection) so both render as
// inert, aria-disabled placeholders with explicit aria-labels — same
// convention used on every other detail page's header in this suite.
import React, { useState } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function FundingDetailHeader({ funding }) {
  const [following, setFollowing] = useState(false);

  return (
    <div className="cse-fnd-header">
      <div className="cse-container cse-fnd-header__inner">
        <a href="#/explorer" className="cse-fnd-back">
          <ExplorerIcon name="chevronLeft" className="cse-fnd-back__icon" />
          Back to Explorer
        </a>

        <div className="cse-fnd-header__row">
          <div className="cse-fnd-header__title-block">
            <p className="cse-eyebrow">FUNDING DETAIL</p>
            <div className="cse-fnd-header__title-row">
              <h1 className="cse-fnd-header__title">{funding.name}</h1>
              <span className="cse-pill">{funding.status}</span>
            </div>
            <p className="cse-fnd-header__meta">
              {funding.fundingTypeLabel} | {funding.reportingPeriodLabel} | Award ID: {funding.awardIdLabel}
            </p>
            <p className="cse-fnd-header__description">{funding.description}</p>
          </div>

          <div className="cse-fnd-header__actions">
            <button
              type="button"
              className="cse-btn cse-btn--outline"
              aria-disabled="true"
              aria-label="Share (coming soon)"
              title="Coming soon"
            >
              <ExplorerIcon name="arrowRight" />
              Share
            </button>
            <button
              type="button"
              className={`cse-btn ${following ? "cse-btn--primary" : "cse-btn--outline"}`}
              onClick={() => setFollowing((v) => !v)}
              aria-pressed={following}
            >
              <ExplorerIcon name={following ? "shieldCheck" : "plus"} />
              {following ? "Following" : "Follow"}
            </button>
            <button
              type="button"
              className="cse-btn cse-btn--outline"
              aria-disabled="true"
              aria-label="View Assurance Report (demo — report not yet available)"
              title="Demo — report not yet available"
            >
              <ExplorerIcon name="document" />
              View Assurance Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
