// CompareSectionNav.jsx — Overview / Funding / Delivery / Outcomes /
// Evidence / Assurance / Methodology section tabs. Real local
// tab-switching state (see CivicSureComparePage.jsx). Same
// role=tablist/role=tab pattern as every other detail page's tab
// strip in this suite.
import React from "react";

export default function CompareSectionNav({ sections, activeKey, onSelect }) {
  return (
    <div className="cse-cmp-section-nav" role="tablist" aria-label="Comparison sections">
      {sections.map((section) => (
        <button
          key={section.key}
          type="button"
          role="tab"
          id={`cse-cmp-tab-${section.key}`}
          aria-selected={section.key === activeKey}
          aria-controls={`cse-cmp-tabpanel-${section.key}`}
          className={`cse-cmp-section-tab${section.key === activeKey ? " is-active" : ""}`}
          onClick={() => onSelect(section.key)}
        >
          {section.label}
        </button>
      ))}
    </div>
  );
}
