// CountyDetailTabs.jsx — Overview / Programs / Funding / Providers /
// Outcomes / Evidence tab strip. Real local tab-switching state (see
// CivicSureCountyDetailPage.jsx). Same role=tablist/role=tab pattern
// as ExplorerSectionNav.jsx and Program/Provider Detail's tab strips —
// no roving-tabindex keyboard handling, consistent with that
// established convention.
import React from "react";

export default function CountyDetailTabs({ tabs, activeKey, onSelect }) {
  return (
    <div className="cse-cty-tabs" role="tablist" aria-label="County detail sections">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          id={`cse-cty-tab-${tab.key}`}
          aria-selected={tab.key === activeKey}
          aria-controls={`cse-cty-tabpanel-${tab.key}`}
          className={`cse-cty-tab${tab.key === activeKey ? " is-active" : ""}`}
          onClick={() => onSelect(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
