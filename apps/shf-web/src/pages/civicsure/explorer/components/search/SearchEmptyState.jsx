// SearchEmptyState.jsx — the no-results state. Never a dead end: real
// "Clear Search" and "Open Explorer" actions, plus plain-language
// suggestions for what to try next. DEMO / FRAME DATA (see
// ../../searchResultsMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

const SUGGESTIONS = ["Check spelling", "Try a broader term", "Remove filters", "Search by county", "Explore all programs"];

export default function SearchEmptyState({ onClearSearch }) {
  return (
    <div className="cse-card cse-srch-empty" aria-labelledby="cse-srch-empty-heading">
      <h2 id="cse-srch-empty-heading">No public CivicSure records matched your search.</h2>
      <ul className="cse-srch-empty__suggestions">
        {SUGGESTIONS.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <div className="cse-srch-empty__actions">
        <button type="button" className="cse-btn cse-btn--outline" onClick={onClearSearch}>
          <ExplorerIcon name="close" />
          Clear Search
        </button>
        <a className="cse-btn cse-btn--primary" href="#/explorer">
          <ExplorerIcon name="arrowRight" />
          Open Explorer
        </a>
      </div>
    </div>
  );
}
