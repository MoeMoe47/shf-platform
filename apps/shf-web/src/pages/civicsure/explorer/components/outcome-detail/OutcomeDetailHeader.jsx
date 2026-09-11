// OutcomeDetailHeader.jsx — back link, eyebrow/title/status/meta/
// description, and header actions. DEMO / FRAME DATA (see
// ../../outcomeDetailMockData.js). "Follow" is a real local toggle.
// "Share" and "View Related Report" have no wired destination yet (no
// share sheet, no immutable public report route) so both render as
// inert, aria-disabled placeholders with explicit aria-labels — same
// convention as every other detail page's header in this suite.
import React, { useState } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import StatusBadge from "../StatusBadge.jsx";

export default function OutcomeDetailHeader({ outcome }) {
  const [following, setFollowing] = useState(false);

  return (
    <div className="cse-otc-header">
      <div className="cse-container cse-otc-header__inner">
        <a href="#/explorer" className="cse-otc-back">
          <ExplorerIcon name="chevronLeft" className="cse-otc-back__icon" />
          Back to Explorer
        </a>

        <div className="cse-otc-header__row">
          <div className="cse-otc-header__title-block">
            <p className="cse-eyebrow">OUTCOME DETAIL</p>
            <div className="cse-otc-header__title-row">
              <h1 className="cse-otc-header__title">{outcome.name}</h1>
              <StatusBadge state={outcome.statusState} />
            </div>
            <p className="cse-otc-header__meta">
              {outcome.categoryLabel} | {outcome.reportingPeriodLabel} | Outcome ID: {outcome.outcomeIdLabel}
            </p>
            <p className="cse-otc-header__description">{outcome.description}</p>
          </div>

          <div className="cse-otc-header__actions">
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
              aria-label="View Related Report (demo — immutable report route not yet available)"
              title="Demo — immutable report route not yet available"
            >
              <ExplorerIcon name="document" />
              View Related Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
