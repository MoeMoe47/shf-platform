// ProgramDetailTabs.jsx — Overview / Money / Delivery / Outcomes /
// Evidence / Providers / Timeline tab strip. Real local tab-switching
// state (see CivicSureProgramDetailPage.jsx) — only the Overview
// panel has full content in this phase; the rest render an honest
// "not built yet" placeholder (ProgramDetailPlaceholderTab.jsx).
import React from "react";

export default function ProgramDetailTabs({ tabs, activeKey, onSelect }) {
  return (
    <div className="cse-pd-tabs" role="tablist" aria-label="Program detail sections">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          id={`cse-pd-tab-${tab.key}`}
          aria-selected={tab.key === activeKey}
          aria-controls={`cse-pd-tabpanel-${tab.key}`}
          className={`cse-pd-tab${tab.key === activeKey ? " is-active" : ""}`}
          onClick={() => onSelect(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
