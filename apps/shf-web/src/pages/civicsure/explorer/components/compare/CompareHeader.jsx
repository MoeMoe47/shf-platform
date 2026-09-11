// CompareHeader.jsx — eyebrow/headline/supporting copy + header
// actions. DEMO / FRAME DATA (see ../../compareViewMockData.js).
// "Clear Comparison" is a real local action (clears all selected
// entities). "Share Comparison" has no wired destination yet (no
// share sheet) so it renders as an inert, aria-disabled placeholder.
// "About Comparison" opens the CompareAboutPanel drawer.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function CompareHeader({ hasSelection, onClear, onAboutOpen }) {
  return (
    <div className="cse-cmp-header">
      <div className="cse-container cse-cmp-header__inner">
        <p className="cse-eyebrow">COMPARE</p>
        <h1 className="cse-cmp-header__title">Compare public programs and results with the context that matters.</h1>
        <p className="cse-cmp-header__description">
          See funding, delivery, outcomes, evidence, and assurance information side by side — while CivicSure highlights when the
          data can and cannot be compared fairly.
        </p>

        <div className="cse-cmp-header__actions">
          <button
            type="button"
            className="cse-btn cse-btn--outline"
            aria-disabled="true"
            aria-label="Share Comparison (coming soon)"
            title="Coming soon"
          >
            <ExplorerIcon name="arrowRight" />
            Share Comparison
          </button>
          <button
            type="button"
            className="cse-btn cse-btn--outline"
            onClick={onClear}
            disabled={!hasSelection}
            aria-label="Clear comparison"
          >
            <ExplorerIcon name="close" />
            Clear Comparison
          </button>
          <button type="button" className="cse-btn cse-btn--outline" onClick={onAboutOpen}>
            <ExplorerIcon name="infoCircle" />
            About Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
