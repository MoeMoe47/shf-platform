// ProgramDetailHeader.jsx — back link, program title/status, and
// header actions. DEMO / FRAME DATA (see ../../programDetailMockData.js).
// "Follow" is a real local toggle (no backend). "Share" and "Download
// Report" have no wired destination yet (no share sheet, no Report
// system) so they render as inert, aria-disabled placeholders rather
// than fake actions — same convention as CivicSurePublicFooter's
// placeholder links.
import React, { useState } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function ProgramDetailHeader({ program }) {
  const [following, setFollowing] = useState(false);

  return (
    <div className="cse-pd-header">
      <div className="cse-container cse-pd-header__inner">
        <a href="#/explorer" className="cse-pd-back">
          <ExplorerIcon name="chevronLeft" className="cse-pd-back__icon" />
          Back to Explorer
        </a>

        <div className="cse-pd-header__row">
          <div className="cse-pd-header__title-block">
            <div className="cse-pd-header__title-row">
              <h1 className="cse-pd-header__title">{program.name}</h1>
              <span className="cse-pill">{program.status}</span>
            </div>
            <p className="cse-pd-header__meta">
              {program.county} | {program.category} | {program.programIdLabel}
            </p>
          </div>

          <div className="cse-pd-header__actions">
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
              className="cse-btn cse-btn--outline"
              aria-disabled="true"
              aria-label="Download Report (coming soon)"
              title="Coming soon"
            >
              <ExplorerIcon name="document" />
              Download Report
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
