// ExplorerSearch.jsx — hero search field + popular-search links.
// Frame only: submit is disabled-in-spirit (preventDefault, no query
// wiring) — see docs/ui/CIVICSURE_EXPLORER_FRAME.md.
import React from "react";
import { ExplorerIcon } from "../explorerIcons.jsx";
import { POPULAR_SEARCHES } from "../civicsureExplorerMockData.js";

export default function ExplorerSearch() {
  return (
    <div className="cse-hero__search-block">
      <form
        className="cse-search-form"
        role="search"
        aria-label="Search programs, providers, counties, or keywords"
        onSubmit={(e) => e.preventDefault()}
      >
        <span className="cse-search-form__icon">
          <ExplorerIcon name="search" />
        </span>
        <label htmlFor="cse-hero-search" className="cse-visually-hidden" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
          Search programs, providers, counties, or keywords
        </label>
        <input id="cse-hero-search" type="search" placeholder="Search programs, providers, counties, or keywords..." />
        <button type="submit" className="cse-btn cse-btn--primary cse-search-form__submit">
          Search
        </button>
      </form>

      <p className="cse-popular">
        <span className="cse-popular__label">Popular searches:</span>
        {POPULAR_SEARCHES.map((term) => (
          <a key={term} href="#/explorer" className="cse-popular__link">
            {term}
          </a>
        ))}
      </p>
    </div>
  );
}
