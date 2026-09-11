// apps/shf-web/src/pages/civicsure/explorer/CivicSureGeographyExplorerPage.jsx
//
// CivicSure Geography Explorer — public-facing page FRAME.
//
// Scope discipline (see docs/ui/CIVICSURE_GEOGRAPHY_EXPLORER_FRAME.md),
// same phase discipline as the Explorer main page and the Program/
// Provider/County Detail frames: this is a visual/layout build only.
// It does not wire live GPA/CivicSure data, a real map SDK, or a real
// query engine — every fact, marker, and cluster shown here comes
// from geographyExplorerMockData.js, explicitly marked DEMO / FRAME
// DATA. This page does not implement Shared Reporting, Public
// Disclosure, Credential, Truth, or Evidence authority, and does not
// touch any of those systems, or any operator/admin UI.
//
// Local state is intentionally shaped for future URL-addressability
// (selectedCounty, filters.category/fundingSource/assuranceStatus/
// period, mapMode, selectedResult) even though this phase does not
// wire it to the URL — see the "filters" and related state below and
// docs/ui/CIVICSURE_GEOGRAPHY_EXPLORER_FRAME.md's "Shareable state"
// section for why.
import React, { useMemo, useState } from "react";
import "../../../styles/civicsure-explorer.css";
import "../../../styles/civicsure-public-footer.css";
import "../../../styles/civicsure-geography-explorer.css";
import CivicSurePublicNav from "../../../components/civicsure/CivicSurePublicNav.jsx";
import CivicSurePublicFooter from "../../../components/civicsure/CivicSurePublicFooter.jsx";
import GeographyExplorerHeader from "./components/geography-explorer/GeographyExplorerHeader.jsx";
import GeographyContextBar from "./components/geography-explorer/GeographyContextBar.jsx";
import GeographySummaryMetrics from "./components/geography-explorer/GeographySummaryMetrics.jsx";
import GeographyFilterSidebar from "./components/geography-explorer/GeographyFilterSidebar.jsx";
import GeographyMapWorkspace from "./components/geography-explorer/GeographyMapWorkspace.jsx";
import GeographyViewModeToggle from "./components/geography-explorer/GeographyViewModeToggle.jsx";
import GeographyResultsList from "./components/geography-explorer/GeographyResultsList.jsx";
import GeographyAboutData from "./components/geography-explorer/GeographyAboutData.jsx";
import {
  DEFAULT_CONTEXT_CHIPS,
  PROGRAM_CATEGORY_OPTIONS,
  FUNDING_SOURCE_OPTIONS,
  ASSURANCE_STATUS_OPTIONS,
  REPORTING_PERIOD_OPTIONS,
  GEO_COUNTIES,
  GEO_RESULTS,
} from "./geographyExplorerMockData.js";

const DEFAULT_FILTERS = {
  county: null,
  city: null,
  categories: [],
  fundingSource: "all",
  assuranceStatus: "all",
  period: "fy2026",
};

function labelFor(options, key) {
  return options.find((o) => o.key === key)?.label || key;
}

export default function CivicSureGeographyExplorerPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [mapMode, setMapMode] = useState("programs");
  const [viewMode, setViewMode] = useState("map");
  const [selectedCountyKey, setSelectedCountyKey] = useState("franklin-county");
  const [aboutDataOpen, setAboutDataOpen] = useState(false);
  const [lastSearchedLabel, setLastSearchedLabel] = useState(null);

  const selectedCounty = useMemo(() => GEO_COUNTIES.find((c) => c.key === selectedCountyKey) || null, [selectedCountyKey]);

  const handleFilterChange = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const handleToggleCategory = (categoryKey) =>
    setFilters((f) => ({
      ...f,
      categories: f.categories.includes(categoryKey) ? f.categories.filter((c) => c !== categoryKey) : [...f.categories, categoryKey],
    }));

  const categoryChipLabel =
    filters.categories.length === 0
      ? DEFAULT_CONTEXT_CHIPS.category.label
      : filters.categories.length === 1
        ? labelFor(PROGRAM_CATEGORY_OPTIONS, filters.categories[0])
        : `${filters.categories.length} Categories`;

  const chips = [
    DEFAULT_CONTEXT_CHIPS.state,
    { key: "category", label: categoryChipLabel, removable: true },
    { key: "period", label: labelFor(REPORTING_PERIOD_OPTIONS, filters.period), removable: true },
    { key: "status", label: filters.assuranceStatus === "all" ? DEFAULT_CONTEXT_CHIPS.status.label : labelFor(ASSURANCE_STATUS_OPTIONS, filters.assuranceStatus), removable: true },
    ...(filters.fundingSource !== "all" ? [{ key: "fundingSource", label: labelFor(FUNDING_SOURCE_OPTIONS, filters.fundingSource), removable: true }] : []),
    ...(filters.county ? [{ key: "county", label: GEO_COUNTIES.find((c) => c.key === filters.county)?.name, removable: true }] : []),
  ];

  const handleRemoveChip = (key) => {
    if (key === "category") setFilters((f) => ({ ...f, categories: [] }));
    else if (key === "period") setFilters((f) => ({ ...f, period: DEFAULT_FILTERS.period }));
    else if (key === "status") setFilters((f) => ({ ...f, assuranceStatus: "all" }));
    else if (key === "fundingSource") setFilters((f) => ({ ...f, fundingSource: "all" }));
    else if (key === "county") setFilters((f) => ({ ...f, county: null }));
  };

  const handleClearAll = () => setFilters(DEFAULT_FILTERS);

  const handleSearchThisArea = () => setLastSearchedLabel(`Showing results for ${selectedCounty ? selectedCounty.name : "the current map view"} (demo)`);

  const shownResultsCount = GEO_RESULTS.length;

  return (
    <div className="civicsure-geography-explorer">
      <a className="cse-skip-link" href="#csge-main">
        Skip to main content
      </a>

      <CivicSurePublicNav activeKey="explorer" />

      <GeographyExplorerHeader onOpenAboutData={() => setAboutDataOpen(true)} />

      <main id="csge-main">
        <div className="cse-container">
          <GeographyContextBar chips={chips} onRemoveChip={handleRemoveChip} onClearAll={handleClearAll} />
          <GeographySummaryMetrics />

          <div className="cse-geo-layout">
            <GeographyFilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              onToggleCategory={handleToggleCategory}
              selectedCountyKey={selectedCountyKey}
              onSelectCounty={setSelectedCountyKey}
              shownResultsCount={shownResultsCount}
            />

            <div className="cse-geo-workspace">
              <div className="cse-geo-workspace__toolbar">
                <GeographyViewModeToggle viewMode={viewMode} onChange={setViewMode} />
              </div>

              {viewMode === "map" ? (
                <>
                  <GeographyMapWorkspace
                    counties={GEO_COUNTIES}
                    mode={mapMode}
                    onModeChange={setMapMode}
                    selectedCounty={selectedCounty}
                    onSelectCounty={setSelectedCountyKey}
                    onSearchThisArea={handleSearchThisArea}
                    lastSearchedLabel={lastSearchedLabel}
                  />
                  <GeographyResultsList selectedCountyKey={selectedCountyKey} onSelectCounty={setSelectedCountyKey} />
                </>
              ) : (
                <GeographyResultsList selectedCountyKey={selectedCountyKey} onSelectCounty={setSelectedCountyKey} fullWidth />
              )}
            </div>
          </div>
        </div>
      </main>

      <CivicSurePublicFooter />

      <GeographyAboutData open={aboutDataOpen} onClose={() => setAboutDataOpen(false)} />
    </div>
  );
}
