// SearchFilterPanel.jsx — Geography / Program Category / Status /
// Reporting Period filter controls, plus a real "Clear filters"
// action. Local state only (see CivicSureSearchResultsPage.jsx). DEMO
// / FRAME DATA (see ../../searchResultsMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import { GEOGRAPHY_FILTERS, CATEGORY_FILTERS, STATUS_FILTERS, PERIOD_FILTERS } from "../../searchResultsMockData.js";

function FilterSelect({ id, label, value, options, onChange }) {
  return (
    <div className="cse-srch-filter">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function SearchFilterPanel({ filters, onChange, onClear, hasActiveFilters }) {
  return (
    <section className="cse-card cse-srch-filters" aria-label="Search filters">
      <div className="cse-srch-filters__head">
        <h2>Filters</h2>
        <button type="button" className="cse-srch-filters__clear" onClick={onClear} disabled={!hasActiveFilters}>
          <ExplorerIcon name="close" />
          Clear filters
        </button>
      </div>

      <FilterSelect
        id="cse-srch-filter-geography"
        label="Geography"
        value={filters.geography}
        options={GEOGRAPHY_FILTERS}
        onChange={(v) => onChange({ ...filters, geography: v })}
      />
      <FilterSelect
        id="cse-srch-filter-category"
        label="Program Category"
        value={filters.category}
        options={CATEGORY_FILTERS}
        onChange={(v) => onChange({ ...filters, category: v })}
      />
      <FilterSelect
        id="cse-srch-filter-status"
        label="Status"
        value={filters.status}
        options={STATUS_FILTERS}
        onChange={(v) => onChange({ ...filters, status: v })}
      />
      <FilterSelect
        id="cse-srch-filter-period"
        label="Reporting Period"
        value={filters.period}
        options={PERIOD_FILTERS}
        onChange={(v) => onChange({ ...filters, period: v })}
      />
    </section>
  );
}
