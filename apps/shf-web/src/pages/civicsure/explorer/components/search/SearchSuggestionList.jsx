// SearchSuggestionList.jsx — starting suggestions. Clicking a
// suggestion updates the query and re-runs the search immediately
// (real local behavior, not just a text-fill). DEMO / FRAME DATA (see
// ../../searchResultsMockData.js).
import React from "react";

export default function SearchSuggestionList({ suggestions, onSelect }) {
  return (
    <div className="cse-srch-suggestions">
      <span className="cse-srch-suggestions__label">Try:</span>
      <ul>
        {suggestions.map((s) => (
          <li key={s}>
            <button type="button" className="cse-srch-suggestion" onClick={() => onSelect(s)}>
              {s}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
