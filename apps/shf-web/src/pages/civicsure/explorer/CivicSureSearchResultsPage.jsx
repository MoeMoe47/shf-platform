// apps/shf-web/src/pages/civicsure/explorer/CivicSureSearchResultsPage.jsx
//
// CivicSure Search Results — public-facing page FRAME.
//
// Scope discipline (see docs/ui/CIVICSURE_SEARCH_RESULTS_FRAME.md),
// same phase discipline as every other page in this suite: this is a
// visual/layout build only. It does not wire a live search API or
// backend indexing — every record, count, and match shown here comes
// from searchResultsMockData.js, explicitly marked DEMO / FRAME DATA.
// This page is a public-safe surface only: it never searches or
// returns private/operator content, and a search result never itself
// creates or implies an assurance claim. This page does not implement
// Shared Reporting, Public Disclosure, Credential, Truth, Evidence, or
// Metric Registry authority, and does not touch any of those systems,
// or any operator/admin UI.
//
// State is deliberately structured so a future version could mirror
// it into the URL without a rewrite: `query`, `activeType`, `filters`,
// and `sortKey` are the four pieces that would become query params
// (e.g. `?q=workforce&type=program&geography=...&sort=funding`) — none
// of that syncing is implemented in this frame, per the brief's "do
// not implement production URL syncing unless trivial and safe"
// instruction.
import React, { useMemo, useState } from "react";
import "../../../styles/civicsure-explorer.css";
import "../../../styles/civicsure-public-footer.css";
import "../../../styles/civicsure-search.css";
import CivicSurePublicNav from "../../../components/civicsure/CivicSurePublicNav.jsx";
import CivicSurePublicFooter from "../../../components/civicsure/CivicSurePublicFooter.jsx";
import SearchResultsHeader from "./components/search/SearchResultsHeader.jsx";
import CivicSureSearchBar from "./components/search/CivicSureSearchBar.jsx";
import SearchSuggestionList from "./components/search/SearchSuggestionList.jsx";
import SearchSummary from "./components/search/SearchSummary.jsx";
import SearchTypeTabs from "./components/search/SearchTypeTabs.jsx";
import SearchFilterPanel from "./components/search/SearchFilterPanel.jsx";
import SearchSortControl from "./components/search/SearchSortControl.jsx";
import SearchResultList from "./components/search/SearchResultList.jsx";
import SearchEmptyState from "./components/search/SearchEmptyState.jsx";
import SearchPublicLimitNotice from "./components/search/SearchPublicLimitNotice.jsx";
import SearchCompareSelection from "./components/search/SearchCompareSelection.jsx";
import SearchAboutPanel from "./components/search/SearchAboutPanel.jsx";
import { ExplorerIcon } from "./explorerIcons.jsx";
import {
  RESULT_TYPES,
  SEARCH_SUGGESTIONS,
  DEFAULT_QUERY,
  DEFAULT_FILTERS,
  PUBLIC_LIMIT_NOTICE,
  searchResults,
  countsByType,
  sortResults,
} from "./searchResultsMockData.js";

export default function CivicSureSearchResultsPage() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [activeType, setActiveType] = useState("all");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState("relevance");
  const [selection, setSelection] = useState([]);
  const [aboutOpen, setAboutOpen] = useState(false);

  const queriedResults = useMemo(() => searchResults(query, filters), [query, filters]);
  const counts = useMemo(() => countsByType(queriedResults), [queriedResults]);
  const typedResults = useMemo(
    () => (activeType === "all" ? queriedResults : queriedResults.filter((r) => r.type === activeType)),
    [queriedResults, activeType]
  );
  const sortedResults = useMemo(() => sortResults(typedResults, sortKey), [typedResults, sortKey]);

  const hasActiveFilters = Object.keys(DEFAULT_FILTERS).some((k) => filters[k] !== DEFAULT_FILTERS[k]);
  const selectedKeys = useMemo(() => new Set(selection.map((s) => `${s.type}:${s.id}`)), [selection]);

  function handleSubmit(nextQuery) {
    setQuery(nextQuery);
    setActiveType("all");
  }

  function handleClearSearch() {
    setQuery("");
    setFilters(DEFAULT_FILTERS);
    setActiveType("all");
  }

  function handleToggleSelect(result) {
    setSelection((prev) => {
      const key = `${result.type}:${result.id}`;
      const exists = prev.some((s) => `${s.type}:${s.id}` === key);
      if (exists) return prev.filter((s) => `${s.type}:${s.id}` !== key);
      if (prev.length >= 4) return prev;
      return [...prev, result];
    });
  }

  return (
    <div className="civicsure-search">
      <a className="cse-skip-link" href="#cssr-main">
        Skip to main content
      </a>

      <CivicSurePublicNav activeKey="explorer" />

      <SearchResultsHeader />

      <main id="cssr-main">
        <div className="cse-container">
          <CivicSureSearchBar query={query} onSubmit={handleSubmit} />
          <SearchSuggestionList suggestions={SEARCH_SUGGESTIONS} onSelect={handleSubmit} />

          <div className="cse-srch-summary-row">
            <SearchSummary count={queriedResults.length} query={query} />
            <button type="button" className="cse-srch-about-trigger" onClick={() => setAboutOpen(true)}>
              <ExplorerIcon name="infoCircle" />
              About search
            </button>
          </div>

          <SearchPublicLimitNotice message={PUBLIC_LIMIT_NOTICE} />

          <SearchTypeTabs types={RESULT_TYPES} counts={counts} activeKey={activeType} onSelect={setActiveType} />

          <div className="cse-srch-layout">
            <SearchFilterPanel filters={filters} onChange={setFilters} onClear={() => setFilters(DEFAULT_FILTERS)} hasActiveFilters={hasActiveFilters} />

            <div className="cse-srch-main">
              <div className="cse-srch-toolbar">
                <SearchSortControl sortKey={sortKey} onChange={setSortKey} />
              </div>

              <SearchCompareSelection selected={selection} onClear={() => setSelection([])} />

              {sortedResults.length === 0 ? (
                <SearchEmptyState onClearSearch={handleClearSearch} />
              ) : (
                <SearchResultList results={sortedResults} query={query} selectedKeys={selectedKeys} onToggleSelect={handleToggleSelect} />
              )}
            </div>
          </div>
        </div>
      </main>

      <CivicSurePublicFooter />

      <SearchAboutPanel open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}
