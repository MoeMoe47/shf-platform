// AgencyDetailTabs.jsx — Overview / Programs / Funding / Providers /
// Outcomes / Evidence / Reports tab strip. Real local tab-switching
// state (see CivicSureAgencyDetailPage.jsx). Same role=tablist/
// role=tab pattern as every other detail page's tab strip in this
// suite — no roving-tabindex keyboard handling, consistent with that
// established convention.
import React from "react";

export default function AgencyDetailTabs({ tabs, activeKey, onSelect }) {
  return (
    <div className="cse-agy-tabs" role="tablist" aria-label="Agency detail sections">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          id={`cse-agy-tab-${tab.key}`}
          aria-selected={tab.key === activeKey}
          aria-controls={`cse-agy-tabpanel-${tab.key}`}
          className={`cse-agy-tab${tab.key === activeKey ? " is-active" : ""}`}
          onClick={() => onSelect(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
