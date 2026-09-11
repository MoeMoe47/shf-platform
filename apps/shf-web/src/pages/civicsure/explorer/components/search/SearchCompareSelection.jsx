// SearchCompareSelection.jsx — "Compare selected" bar. Only enabled
// when 2+ items of the SAME comparable type are selected; mixed types
// show a plain-language explanation instead of silently failing.
// Links to the existing Compare View route (no query-param handoff —
// see docs/ui/CIVICSURE_SEARCH_RESULTS_FRAME.md for why). DEMO / FRAME
// DATA (see ../../searchResultsMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import { getResultTypeLabel } from "../../searchResultsMockData.js";

export default function SearchCompareSelection({ selected, onClear }) {
  if (selected.length === 0) return null;

  const types = new Set(selected.map((s) => s.type));
  const mixedTypes = types.size > 1;
  const canCompare = !mixedTypes && selected.length >= 2;

  return (
    <div className="cse-srch-compare-bar" role="status">
      <span className="cse-srch-compare-bar__count">
        {selected.length} selected{!mixedTypes ? ` (${getResultTypeLabel(selected[0].type)})` : ""}
      </span>

      {mixedTypes ? (
        <span className="cse-srch-compare-bar__warning">Compare requires items of the same type.</span>
      ) : selected.length < 2 ? (
        <span className="cse-srch-compare-bar__warning">Select at least one more item of this type to compare.</span>
      ) : null}

      <div className="cse-srch-compare-bar__actions">
        {canCompare ? (
          <a className="cse-btn cse-btn--primary" href="#/explorer/compare">
            <ExplorerIcon name="arrowRight" />
            Compare selected
          </a>
        ) : (
          <button type="button" className="cse-btn cse-btn--primary" disabled aria-disabled="true">
            <ExplorerIcon name="arrowRight" />
            Compare selected
          </button>
        )}
        <button type="button" className="cse-btn cse-btn--outline" onClick={onClear}>
          <ExplorerIcon name="close" />
          Clear selection
        </button>
      </div>
    </div>
  );
}
