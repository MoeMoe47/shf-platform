// EvidenceSummaryHeader.jsx — back link, eyebrow/title/status/meta/
// description, and header actions. DEMO / FRAME DATA (see
// ../../evidenceSummaryMockData.js). "Follow" is a real local toggle.
// "View Related Outcome" is a real link to the already-built Outcome
// Detail page. "Share" has no wired destination yet (no share sheet)
// so it renders as an inert, aria-disabled placeholder with an
// explicit aria-label — same convention as every other detail page's
// header in this suite.
import React, { useState } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import StatusBadge from "../StatusBadge.jsx";

export default function EvidenceSummaryHeader({ evidence }) {
  const [following, setFollowing] = useState(false);
  const outcomeId = evidence.relatedClaims.outcome.outcomeId;

  return (
    <div className="cse-evs-header">
      <div className="cse-container cse-evs-header__inner">
        <a href="#/explorer" className="cse-evs-back">
          <ExplorerIcon name="chevronLeft" className="cse-evs-back__icon" />
          Back to Explorer
        </a>

        <div className="cse-evs-header__row">
          <div className="cse-evs-header__title-block">
            <p className="cse-eyebrow">EVIDENCE SUMMARY</p>
            <div className="cse-evs-header__title-row">
              <h1 className="cse-evs-header__title">{evidence.name}</h1>
              <StatusBadge state={evidence.statusState} />
            </div>
            <p className="cse-evs-header__meta">
              {evidence.categoryLabel} | {evidence.reportingPeriodLabel} | Evidence ID: {evidence.evidenceIdLabel}
            </p>
            <p className="cse-evs-header__description">{evidence.description}</p>
          </div>

          <div className="cse-evs-header__actions">
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
            <a className="cse-btn cse-btn--outline" href={`#/explorer/outcomes/${encodeURIComponent(outcomeId)}`}>
              <ExplorerIcon name="arrowRight" />
              View Related Outcome
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
