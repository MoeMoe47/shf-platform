// ProviderDetailHeader.jsx — back link, provider identity, and header
// actions. DEMO / FRAME DATA (see ../../providerDetailMockData.js).
// "Follow" is a real local toggle (no backend). "Share" has no wired
// destination yet (no share sheet) so it renders as an inert,
// aria-disabled placeholder — same convention used on Program Detail's
// header.
import React, { useState } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function ProviderDetailHeader({ provider }) {
  const [following, setFollowing] = useState(false);

  return (
    <div className="cse-pvd-header">
      <div className="cse-container cse-pvd-header__inner">
        <a href="#/explorer" className="cse-pvd-back">
          <ExplorerIcon name="chevronLeft" className="cse-pvd-back__icon" />
          Back to Explorer
        </a>

        <div className="cse-pvd-header__row">
          <div className="cse-pvd-header__title-block">
            <div className="cse-pvd-header__title-row">
              <h1 className="cse-pvd-header__title">{provider.name}</h1>
              <span className="cse-pill">{provider.status}</span>
            </div>
            <p className="cse-pvd-header__meta">
              {provider.providerType} | {provider.headquarters} | Provider ID: {provider.providerIdLabel}
            </p>
            <p className="cse-pvd-header__description">{provider.description}</p>
          </div>

          <div className="cse-pvd-header__actions">
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
