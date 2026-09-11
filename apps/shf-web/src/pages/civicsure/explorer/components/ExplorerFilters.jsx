// ExplorerFilters.jsx — filter toolbar + list/map view toggle.
// Filter controls are bounded to the public projection surface. Search and
// richer geographic filters remain unavailable until their public projections
// exist; they must not query private source data.
import React from "react";
import { ExplorerIcon } from "../explorerIcons.jsx";

const PUBLIC_FILTERS = [
  { key: "category", label: "Category", options: ["All"] },
  { key: "status", label: "Status", options: ["Published"] },
];

export default function ExplorerFilters({ view, onViewChange }) {
  return (
    <div className="cse-filters">
      {PUBLIC_FILTERS.map((filter) => (
        <div className="cse-filter-field" key={filter.key}>
          <label htmlFor={`cse-filter-${filter.key}`}>{filter.label}</label>
          <select id={`cse-filter-${filter.key}`} defaultValue={filter.options[0]}>
            {filter.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      ))}

      <button type="button" className="cse-more-filters">
        <ExplorerIcon name="sliders" />
        More filters
      </button>

      <div className="cse-view-toggle-group">
        <span>View as:</span>
        <div className="cse-view-toggle" role="group" aria-label="Results view">
          <button type="button" className={view === "list" ? "is-active" : ""} aria-pressed={view === "list"} onClick={() => onViewChange?.("list")}>
            <ExplorerIcon name="list" />
            List
          </button>
          <button type="button" className={view === "map" ? "is-active" : ""} aria-pressed={view === "map"} onClick={() => onViewChange?.("map")}>
            <ExplorerIcon name="map" />
            Map
          </button>
        </div>
      </div>
    </div>
  );
}
