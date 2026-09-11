// SearchTypeTabs.jsx — All / Programs / Providers / Counties /
// Funding / Agencies / Outcomes / Evidence / Reports, each with a
// live demo count. Real local tab-switching state (see
// CivicSureSearchResultsPage.jsx). Same role=tablist/role=tab pattern
// as every other detail page's tab strip in this suite.
import React from "react";

export default function SearchTypeTabs({ types, counts, activeKey, onSelect }) {
  return (
    <div className="cse-srch-tabs" role="tablist" aria-label="Filter results by type">
      {types.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          id={`cse-srch-tab-${t.key}`}
          aria-selected={t.key === activeKey}
          className={`cse-srch-tab${t.key === activeKey ? " is-active" : ""}`}
          onClick={() => onSelect(t.key)}
        >
          {t.label}
          <span className="cse-srch-tab__count">{counts[t.key] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}
