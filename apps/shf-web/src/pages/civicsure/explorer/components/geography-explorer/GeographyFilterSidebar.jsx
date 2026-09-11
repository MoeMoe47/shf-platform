// GeographyFilterSidebar.jsx — the ~28–32% desktop left column:
// Geography (state/county/city), Program Category, Funding Source,
// Assurance Status, Reporting Period, and the County Quick List.
// DEMO / FRAME DATA (see ../../geographyExplorerMockData.js).
//
// Real local interaction, but no live query: every control is a
// genuine controlled input reflecting local filter state (and the
// County select feeds the same selectedCounty state as the map and
// results list), but none of it re-queries a backend or changes what
// the results list/map actually render — per this page's brief
// ("No live query execution yet" / only "Search this area" would, in
// a real implementation, trigger a re-query).
import React from "react";
import {
  PROGRAM_CATEGORY_OPTIONS,
  FUNDING_SOURCE_OPTIONS,
  ASSURANCE_STATUS_OPTIONS,
  REPORTING_PERIOD_OPTIONS,
  CITY_OPTIONS,
  GEO_COUNTIES,
  RESULTS_TOTAL_COUNT,
} from "../../geographyExplorerMockData.js";
import GeographyCountyList from "./GeographyCountyList.jsx";

export default function GeographyFilterSidebar({ filters, onFilterChange, onToggleCategory, selectedCountyKey, onSelectCounty, shownResultsCount }) {
  return (
    <aside className="cse-geo-sidebar" aria-label="Filter results">
      <section className="cse-geo-filter-section">
        <h2 className="cse-geo-filter-section__heading">Geography</h2>

        <div className="cse-geo-filter-field">
          <span className="cse-geo-filter-field__label">State</span>
          <span className="cse-geo-filter-field__static">Ohio</span>
        </div>

        <div className="cse-geo-filter-field">
          <label htmlFor="cse-geo-county-select">County</label>
          <select id="cse-geo-county-select" value={filters.county || ""} onChange={(e) => onFilterChange("county", e.target.value || null)}>
            <option value="">All Counties</option>
            {GEO_COUNTIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="cse-geo-filter-field">
          <label htmlFor="cse-geo-city-select">City / Municipality</label>
          <select id="cse-geo-city-select" value={filters.city || ""} onChange={(e) => onFilterChange("city", e.target.value || null)}>
            <option value="">All Cities</option>
            {CITY_OPTIONS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="cse-geo-filter-section">
        <h2 className="cse-geo-filter-section__heading">Program Category</h2>
        <div className="cse-geo-checkbox-list">
          {PROGRAM_CATEGORY_OPTIONS.map((cat) => (
            <label key={cat.key} className="cse-geo-checkbox">
              <input type="checkbox" checked={filters.categories.includes(cat.key)} onChange={() => onToggleCategory(cat.key)} />
              {cat.label}
            </label>
          ))}
        </div>
      </section>

      <section className="cse-geo-filter-section">
        <h2 className="cse-geo-filter-section__heading">Funding Source</h2>
        <div className="cse-geo-filter-field">
          <label htmlFor="cse-geo-funding-select" className="cse-visually-hidden">
            Funding source
          </label>
          <select id="cse-geo-funding-select" value={filters.fundingSource} onChange={(e) => onFilterChange("fundingSource", e.target.value)}>
            {FUNDING_SOURCE_OPTIONS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="cse-geo-filter-section">
        <h2 className="cse-geo-filter-section__heading">Assurance Status</h2>
        <div className="cse-geo-filter-field">
          <label htmlFor="cse-geo-status-select" className="cse-visually-hidden">
            Assurance status
          </label>
          <select id="cse-geo-status-select" value={filters.assuranceStatus} onChange={(e) => onFilterChange("assuranceStatus", e.target.value)}>
            {ASSURANCE_STATUS_OPTIONS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="cse-geo-filter-section">
        <h2 className="cse-geo-filter-section__heading">Reporting Period</h2>
        <div className="cse-geo-filter-field">
          <label htmlFor="cse-geo-period-select" className="cse-visually-hidden">
            Reporting period
          </label>
          <select id="cse-geo-period-select" value={filters.period} onChange={(e) => onFilterChange("period", e.target.value)}>
            {REPORTING_PERIOD_OPTIONS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <p className="cse-geo-sidebar__results-note">
        Showing {shownResultsCount} of {RESULTS_TOTAL_COUNT} results in current area.
      </p>

      <GeographyCountyList counties={GEO_COUNTIES} selectedCountyKey={selectedCountyKey} onSelectCounty={onSelectCounty} />
    </aside>
  );
}
