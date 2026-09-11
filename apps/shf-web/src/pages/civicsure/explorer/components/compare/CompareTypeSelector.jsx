// CompareTypeSelector.jsx — "Compare: Programs | Providers | Counties
// | Outcomes" segmented control. Real local state (see
// CivicSureComparePage.jsx). Switching type swaps the available
// entity set; unlike entity types can never share one comparison, so
// this is a single-select control, not a multi-select. DEMO / FRAME
// DATA (see ../../compareViewMockData.js).
import React from "react";

export default function CompareTypeSelector({ types, activeKey, onSelect }) {
  return (
    <div className="cse-cmp-type-selector" role="radiogroup" aria-label="Compare entity type">
      <span className="cse-cmp-type-selector__label">Compare:</span>
      <div className="cse-cmp-type-selector__options">
        {types.map((t) => (
          <button
            key={t.key}
            type="button"
            role="radio"
            aria-checked={t.key === activeKey}
            className={`cse-cmp-type-option${t.key === activeKey ? " is-active" : ""}`}
            onClick={() => onSelect(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
