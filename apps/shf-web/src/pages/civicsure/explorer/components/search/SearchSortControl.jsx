// SearchSortControl.jsx — "Sort by" control. Local/demo behavior
// only; does not imply a production search ranking policy. DEMO /
// FRAME DATA (see ../../searchResultsMockData.js).
import React from "react";
import { SORT_OPTIONS } from "../../searchResultsMockData.js";

export default function SearchSortControl({ sortKey, onChange }) {
  return (
    <div className="cse-srch-sort">
      <label htmlFor="cse-srch-sort-select">Sort by</label>
      <select id="cse-srch-sort-select" value={sortKey} onChange={(e) => onChange(e.target.value)}>
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.key} value={opt.key}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
