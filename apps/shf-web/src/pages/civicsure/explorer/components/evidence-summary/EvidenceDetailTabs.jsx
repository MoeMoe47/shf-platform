// EvidenceDetailTabs.jsx — Overview / Sources / Coverage /
// Verification / Related Claims / Timeline tab strip. Real local
// tab-switching state (see CivicSureEvidenceSummaryPage.jsx). Same
// role=tablist/role=tab pattern as every other detail page's tab
// strip in this suite — no roving-tabindex keyboard handling,
// consistent with that established convention.
import React from "react";

export default function EvidenceDetailTabs({ tabs, activeKey, onSelect }) {
  return (
    <div className="cse-evs-tabs" role="tablist" aria-label="Evidence summary sections">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          id={`cse-evs-tab-${tab.key}`}
          aria-selected={tab.key === activeKey}
          aria-controls={`cse-evs-tabpanel-${tab.key}`}
          className={`cse-evs-tab${tab.key === activeKey ? " is-active" : ""}`}
          onClick={() => onSelect(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
