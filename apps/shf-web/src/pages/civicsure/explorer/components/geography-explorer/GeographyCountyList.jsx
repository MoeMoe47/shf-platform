// GeographyCountyList.jsx — compact county list in the filter
// sidebar. Real local interaction: clicking a row sets the selected
// county (same state the map clusters and results list read from) —
// a genuine two-way sync, not a route change. Only Franklin County
// has a real County Detail page; that's surfaced in the Selected
// Geography Panel, not here — these rows are plain selection buttons
// for every county, never dead links. DEMO / FRAME DATA (see
// ../../geographyExplorerMockData.js).
import React from "react";

export default function GeographyCountyList({ counties, selectedCountyKey, onSelectCounty }) {
  return (
    <div className="cse-geo-county-list">
      <h3 className="cse-geo-county-list__heading">Counties</h3>
      <ul>
        {counties.map((county) => (
          <li key={county.key}>
            <button
              type="button"
              className={`cse-geo-county-list__row${county.key === selectedCountyKey ? " is-selected" : ""}`}
              onClick={() => onSelectCounty(county.key)}
              aria-pressed={county.key === selectedCountyKey}
            >
              <span className="cse-geo-county-list__name">{county.name}</span>
              <span className="cse-geo-county-list__count">{county.clusterCount} programs</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
