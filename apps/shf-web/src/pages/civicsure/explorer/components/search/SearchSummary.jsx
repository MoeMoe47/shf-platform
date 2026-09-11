// SearchSummary.jsx — "N results for <query>" + the public-safe scope
// note. DEMO / FRAME DATA (see ../../searchResultsMockData.js).
import React from "react";

export default function SearchSummary({ count, query }) {
  return (
    <div className="cse-srch-summary">
      <p className="cse-srch-summary__count">
        {count} {count === 1 ? "result" : "results"}
        {query.trim() ? ` for “${query.trim()}”` : ""}
      </p>
      <p className="cse-srch-summary__note">Showing public-safe CivicSure records only.</p>
    </div>
  );
}
