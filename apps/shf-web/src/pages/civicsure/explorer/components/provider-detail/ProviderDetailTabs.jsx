// ProviderDetailTabs.jsx — Overview / Programs / Funding / Outcomes /
// Evidence / Compliance tab strip. Real local tab-switching state (see
// CivicSureProviderDetailPage.jsx). Same role=tablist/role=tab pattern
// as ExplorerSectionNav.jsx and Program Detail's ProgramDetailTabs.jsx
// — no roving-tabindex keyboard handling, consistent with that
// established convention.
import React from "react";

export default function ProviderDetailTabs({ tabs, activeKey, onSelect }) {
  return (
    <div className="cse-pvd-tabs" role="tablist" aria-label="Provider detail sections">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          id={`cse-pvd-tab-${tab.key}`}
          aria-selected={tab.key === activeKey}
          aria-controls={`cse-pvd-tabpanel-${tab.key}`}
          className={`cse-pvd-tab${tab.key === activeKey ? " is-active" : ""}`}
          onClick={() => onSelect(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
