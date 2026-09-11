// SearchResultList.jsx — renders the current page of result cards.
// DEMO / FRAME DATA (see ../../searchResultsMockData.js).
import React from "react";
import SearchResultCard from "./SearchResultCard.jsx";

export default function SearchResultList({ results, query, selectedKeys, onToggleSelect }) {
  return (
    <div className="cse-srch-results" role="list" aria-label="Search results">
      {results.map((result) => (
        <div role="listitem" key={result.id}>
          <SearchResultCard
            result={result}
            query={query}
            isSelected={selectedKeys.has(`${result.type}:${result.id}`)}
            onToggleSelect={onToggleSelect}
          />
        </div>
      ))}
    </div>
  );
}
