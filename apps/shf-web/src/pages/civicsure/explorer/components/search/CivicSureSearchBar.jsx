// CivicSureSearchBar.jsx — the primary search input. Local draft state
// so results only update on submit (Enter key or Search button), not
// on every keystroke — a deliberate, accessible default rather than
// live-filtering as the user types. DEMO / FRAME DATA (see
// ../../searchResultsMockData.js).
import React, { useEffect, useState } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function CivicSureSearchBar({ query, onSubmit }) {
  const [draft, setDraft] = useState(query);

  useEffect(() => {
    setDraft(query);
  }, [query]);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(draft);
  }

  return (
    <form className="cse-srch-bar" role="search" onSubmit={handleSubmit}>
      <label htmlFor="cse-srch-input" className="cse-visually-hidden">
        Search CivicSure
      </label>
      <span className="cse-srch-bar__icon" aria-hidden="true">
        <ExplorerIcon name="search" />
      </span>
      <input
        id="cse-srch-input"
        type="search"
        className="cse-srch-bar__input"
        placeholder="Search programs, providers, counties, funding, outcomes, or keywords..."
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <button type="submit" className="cse-btn cse-btn--primary cse-srch-bar__submit">
        Search
      </button>
    </form>
  );
}
