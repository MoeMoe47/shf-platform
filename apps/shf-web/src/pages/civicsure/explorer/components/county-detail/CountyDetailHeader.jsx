// CountyDetailHeader.jsx — back link, county identity, and header
// actions. DEMO / FRAME DATA (see ../../countyDetailMockData.js).
// "Follow" is a real local toggle (no backend). "Share" has no wired
// destination yet (no share sheet) so it renders as an inert,
// aria-disabled placeholder with an explicit aria-label — same
// convention used on Program Detail's and Provider Detail's headers.
import React, { useState } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function CountyDetailHeader({ county }) {
  const [following, setFollowing] = useState(false);

  return (
    <div className="cse-cty-header">
      <div className="cse-container cse-cty-header__inner">
        <a href="#/explorer" className="cse-cty-back">
          <ExplorerIcon name="chevronLeft" className="cse-cty-back__icon" />
          Back to Explorer
        </a>

        <div className="cse-cty-header__row">
          <div className="cse-cty-header__title-block">
            <h1 className="cse-cty-header__title">{county.name}</h1>
            <p className="cse-cty-header__meta">
              {county.state} | County FIPS: {county.fips}
            </p>
            <p className="cse-cty-header__description">{county.description}</p>
          </div>

          <div className="cse-cty-header__actions">
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
          </div>
        </div>
      </div>
    </div>
  );
}
