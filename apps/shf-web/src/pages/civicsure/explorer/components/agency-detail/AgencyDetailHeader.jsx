// AgencyDetailHeader.jsx — back link, eyebrow/title/meta/description,
// and header actions. DEMO / FRAME DATA (see ../../agencyDetailMockData.js).
// "Follow" is a real local toggle. "Share" has no wired destination
// yet (no share sheet) so it renders as an inert, aria-disabled
// placeholder with an explicit aria-label — same convention as every
// other detail page's header in this suite. "View Reports" is a real
// local action (switches to the Reports tab, one click away) rather
// than an inert placeholder, since this page's own Reports tab has
// real content to show.
import React, { useState } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function AgencyDetailHeader({ agency, onViewReports }) {
  const [following, setFollowing] = useState(false);

  return (
    <div className="cse-agy-header">
      <div className="cse-container cse-agy-header__inner">
        <a href="#/explorer" className="cse-agy-back">
          <ExplorerIcon name="chevronLeft" className="cse-agy-back__icon" />
          Back to Explorer
        </a>

        <div className="cse-agy-header__row">
          <div className="cse-agy-header__title-block">
            <p className="cse-eyebrow">AGENCY DETAIL</p>
            <h1 className="cse-agy-header__title">{agency.name}</h1>
            <p className="cse-agy-header__meta">
              {agency.agencyTypeLabel} | {agency.jurisdictionLabel} | Agency ID: {agency.agencyIdLabel}
            </p>
            <p className="cse-agy-header__description">{agency.description}</p>
          </div>

          <div className="cse-agy-header__actions">
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
            <button type="button" className="cse-btn cse-btn--outline" onClick={onViewReports}>
              <ExplorerIcon name="document" />
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
