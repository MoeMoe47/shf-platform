// ExplorerMapPanel.jsx — static visual placeholder standing in for a
// real map SDK (no Google Maps/Mapbox/Leaflet integration in this
// phase — see docs/ui/CIVICSURE_EXPLORER_FRAME.md). Markers, highway
// shields, and place labels are decorative and positioned by percent,
// not real geography. Zoom controls are non-functional.
//
// Also reused (not duplicated) by County Detail's CountyMapPanel.jsx —
// the overlay title/stats and the optional "View County Details"
// action are overridable via props precisely so that reuse works: the
// Explorer main page passes a real link to the County Detail route,
// while County Detail itself (already on that page) omits the action
// rather than linking to itself.
import React from "react";
import { ExplorerIcon } from "../explorerIcons.jsx";
import { COUNTY_SUMMARY, MAP_PLACE_LABELS, MAP_MARKERS, HIGHWAY_MARKERS } from "../civicsureExplorerMockData.js";

export default function ExplorerMapPanel({
  overlayTitle = COUNTY_SUMMARY.name,
  overlayStats = COUNTY_SUMMARY.stats,
  actionHref,
  actionLabel = "View County Details",
  mapLabel = "Illustrative map of Columbus and Franklin County with placeholder program location markers",
}) {
  return (
    <div className="cse-map-panel">
      {/* Decorative map illustration — role="img" summarizes the whole
          visual for assistive tech; it must not contain the real
          interactive controls below (role="img" would hide them from
          the accessibility tree), so they're rendered as siblings. */}
      <div className="cse-map-panel__illustration" role="img" aria-label={mapLabel}>
        <div className="cse-map-panel__labels" aria-hidden="true">
          {MAP_PLACE_LABELS.map((place) => (
            <span key={place.key} className={place.emphasis ? "is-emphasis" : undefined} style={{ left: `${place.x}%`, top: `${place.y}%` }}>
              {place.label}
            </span>
          ))}
        </div>

        {MAP_MARKERS.map((m, i) => (
          <span key={i} className="cse-map-marker" style={{ left: `${m.x}%`, top: `${m.y}%` }} aria-hidden="true" />
        ))}

        {HIGHWAY_MARKERS.map((h) => (
          <span key={h.key} className="cse-map-highway" style={{ left: `${h.x}%`, top: `${h.y}%` }} aria-hidden="true">
            {h.label}
          </span>
        ))}
      </div>

      <div className="cse-map-panel__overlay">
        <h3>{overlayTitle}</h3>
        <ul>
          {overlayStats.map((s) => (
            <li key={s.key}>
              {s.value} {s.label}
            </li>
          ))}
        </ul>
        {actionHref ? (
          <a href={actionHref}>
            {actionLabel} <ExplorerIcon name="arrowRight" />
          </a>
        ) : null}
      </div>

      <div className="cse-map-zoom" role="group" aria-label="Map zoom (not yet functional)">
        <button type="button" aria-label="Zoom in">
          <ExplorerIcon name="plus" />
        </button>
        <button type="button" aria-label="Zoom out">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  );
}
