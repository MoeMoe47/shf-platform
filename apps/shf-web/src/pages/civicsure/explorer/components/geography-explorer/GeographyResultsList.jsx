// GeographyResultsList.jsx — the map/result synchronization surface.
// Clicking a row selects that row's county (updating the map's
// Selected Geography Panel and highlighting the matching county on
// the map); rows belonging to the currently selected county are
// highlighted here too, so the sync reads both ways without needing a
// real map SDK. Doubles as the map's accessible alternative — every
// program/provider shown as a marker is also a real row here, so the
// map is never the only way to reach this information. "Explore" is
// a REAL link only for rows whose id matches an already-built Program
// or Provider Detail page; the rest render an inert "Not yet
// available" placeholder. DEMO / FRAME DATA (see
// ../../geographyExplorerMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { GEO_RESULTS, RESULTS_TOTAL_COUNT } from "../../geographyExplorerMockData.js";

export default function GeographyResultsList({ selectedCountyKey, onSelectCounty, fullWidth }) {
  return (
    <section className={`cse-geo-results${fullWidth ? " cse-geo-results--full" : ""}`} aria-label="Programs and providers in the current area">
      <div className="cse-geo-results__head">
        <h2>Programs &amp; Providers</h2>
        <p>
          Showing {GEO_RESULTS.length} of {RESULTS_TOTAL_COUNT} results in this demo frame.
        </p>
      </div>

      <ul className="cse-geo-results__list" role="list">
        {GEO_RESULTS.map((result) => {
          const exploreHref = result.programId
            ? `#/explorer/programs/${encodeURIComponent(result.programId)}`
            : result.providerId
              ? `#/explorer/providers/${encodeURIComponent(result.providerId)}`
              : null;

          return (
            <li key={result.key}>
              <article
                className={`cse-card cse-geo-result-row${result.countyKey === selectedCountyKey ? " is-highlighted" : ""}`}
                role="listitem"
              >
                <button type="button" className="cse-geo-result-row__main" onClick={() => onSelectCounty(result.countyKey)}>
                  <div className="cse-geo-result-row__title-row">
                    <span className="cse-geo-result-row__title">{result.name}</span>
                    <StatusBadge state={result.status} />
                  </div>
                  <p className="cse-geo-result-row__meta">
                    {result.category} | {result.countyLabel}
                  </p>
                </button>

                <div className="cse-geo-result-row__aside">
                  <p className="cse-geo-result-row__funding">{result.funding}</p>
                  {exploreHref ? (
                    <a className="cse-geo-result-row__link" href={exploreHref}>
                      Explore
                      <ExplorerIcon name="chevronRight" />
                    </a>
                  ) : (
                    <span className="cse-geo-result-row__link cse-geo-result-row__link--placeholder" aria-disabled="true" title="Coming soon">
                      Not yet available
                    </span>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
