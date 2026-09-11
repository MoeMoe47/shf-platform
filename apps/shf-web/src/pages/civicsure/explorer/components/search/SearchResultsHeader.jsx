// SearchResultsHeader.jsx — eyebrow/headline/supporting copy. DEMO /
// FRAME DATA (see ../../searchResultsMockData.js).
import React from "react";

export default function SearchResultsHeader() {
  return (
    <div className="cse-srch-header">
      <div className="cse-container">
        <p className="cse-eyebrow">SEARCH CIVICSURE</p>
        <h1 className="cse-srch-header__title">Find public programs, funding, providers, outcomes, and evidence.</h1>
        <p className="cse-srch-header__description">
          Search across CivicSure&rsquo;s public-safe records and follow each result to its supporting details, evidence,
          methodology, and reports.
        </p>
      </div>
    </div>
  );
}
