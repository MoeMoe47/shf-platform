// OutcomeDetailTabs.jsx — Overview / Methodology / Evidence /
// Population / Related Programs / Timeline tab strip. Real local
// tab-switching state (see CivicSureOutcomeDetailPage.jsx). Same
// role=tablist/role=tab pattern as every other detail page's tab
// strip in this suite — no roving-tabindex keyboard handling,
// consistent with that established convention.
import React from "react";

export default function OutcomeDetailTabs({ tabs, activeKey, onSelect }) {
  return (
    <div className="cse-otc-tabs" role="tablist" aria-label="Outcome detail sections">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          id={`cse-otc-tab-${tab.key}`}
          aria-selected={tab.key === activeKey}
          aria-controls={`cse-otc-tabpanel-${tab.key}`}
          className={`cse-otc-tab${tab.key === activeKey ? " is-active" : ""}`}
          onClick={() => onSelect(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
