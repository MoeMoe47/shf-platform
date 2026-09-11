// GeographyMapWorkspace.jsx — the large geography-first map area.
// Reuses the Explorer main page's CSS-gradient map illustration
// classes (.cse-map-panel, .cse-map-panel__illustration,
// .cse-map-panel__labels, .cse-map-highway — all shared primitives in
// civicsure-explorer.css) for the same "real-map-like" cool-blue
// background, but does NOT reuse ExplorerMapPanel.jsx itself: that
// component's API (a single static overlay card) can't cleanly
// support four different mode-dependent marker treatments plus
// clickable clusters without becoming fragile, so this is a fresh,
// dedicated marker layer built on the same visual language instead
// (per this page's brief: "Do not force reuse if doing so would make
// the component fragile"). No map SDK — marker positions are
// percent-based mock coordinates, not real geography. DEMO / FRAME
// DATA (see ../../geographyExplorerMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import { MAP_PLACE_LABELS } from "../../civicsureExplorerMockData.js";
import { MAP_VIEW_MODES } from "../../geographyExplorerMockData.js";
import GeographyLegend from "./GeographyLegend.jsx";
import GeographySelectedAreaPanel from "./GeographySelectedAreaPanel.jsx";

function markerToneForMode(county, mode) {
  if (mode === "funding") return `blue-${county.fundingIntensity === "high" ? "dark" : county.fundingIntensity === "mid" ? "mid" : "light"}`;
  if (mode === "outcomes") return county.outcomePerformance === "above" ? "green" : county.outcomePerformance === "below" ? "blue-light" : "blue";
  if (mode === "evidence") {
    return { verified: "green", partial: "blue", pending: "amber", missing: "red" }[county.evidenceStatus] || "blue";
  }
  // programs mode
  return { verified: "green", "open-exception": "amber", active: "blue" }[county.programsStatus] || "blue";
}

export default function GeographyMapWorkspace({ counties, mode, onModeChange, selectedCounty, onSelectCounty, onSearchThisArea, lastSearchedLabel }) {
  return (
    <div className="cse-geo-map-workspace">
      <div className="cse-geo-map-controls">
        <div className="cse-geo-map-controls__modes" role="group" aria-label="Map view mode">
          {MAP_VIEW_MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`cse-geo-mode-tab${mode === m.key ? " is-active" : ""}`}
              onClick={() => onModeChange(m.key)}
              aria-pressed={mode === m.key}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="cse-geo-map-controls__search">
          {lastSearchedLabel ? <span className="cse-geo-map-controls__search-note">{lastSearchedLabel}</span> : null}
          <button type="button" className="cse-btn cse-btn--outline" onClick={onSearchThisArea}>
            <ExplorerIcon name="search" />
            Search this area
          </button>
        </div>
      </div>

      <div className="cse-map-panel cse-geo-map">
        <div
          className="cse-map-panel__illustration"
          role="img"
          aria-label={`Illustrative map of Central Ohio counties, showing ${mode} for each county. Every county shown here also appears in the results list below.`}
        >
          <div className="cse-map-panel__labels" aria-hidden="true">
            {MAP_PLACE_LABELS.map((place) => (
              <span key={place.key} className={place.emphasis ? "is-emphasis" : undefined} style={{ left: `${place.x}%`, top: `${place.y}%` }}>
                {place.label}
              </span>
            ))}
          </div>

          {counties.map((county) => {
            const tone = markerToneForMode(county, mode);
            const isSelected = county.key === selectedCounty?.key;
            return (
              <button
                key={county.key}
                type="button"
                className={`cse-geo-cluster cse-geo-cluster--${tone}${isSelected ? " is-selected" : ""}`}
                style={{ left: `${county.x}%`, top: `${county.y}%` }}
                onClick={() => onSelectCounty(county.key)}
                aria-pressed={isSelected}
                aria-label={`${county.name}: ${county.clusterCount} programs. Select to preview.`}
              >
                {mode === "programs" ? county.clusterCount : ""}
              </button>
            );
          })}
        </div>

        <GeographySelectedAreaPanel county={selectedCounty} />

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

      <GeographyLegend mode={mode} />
    </div>
  );
}
