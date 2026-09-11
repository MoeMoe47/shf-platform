// FundingDetailTabs.jsx — Overview / Money Flow / Programs /
// Providers / Delivery / Evidence / Outcomes / Timeline tab strip.
// Real local tab-switching state (see CivicSureFundingDetailPage.jsx).
// Same role=tablist/role=tab pattern as every other detail page's tab
// strip in this suite — no roving-tabindex keyboard handling,
// consistent with that established convention.
import React from "react";

export default function FundingDetailTabs({ tabs, activeKey, onSelect }) {
  return (
    <div className="cse-fnd-tabs" role="tablist" aria-label="Funding detail sections">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          id={`cse-fnd-tab-${tab.key}`}
          aria-selected={tab.key === activeKey}
          aria-controls={`cse-fnd-tabpanel-${tab.key}`}
          className={`cse-fnd-tab${tab.key === activeKey ? " is-active" : ""}`}
          onClick={() => onSelect(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
