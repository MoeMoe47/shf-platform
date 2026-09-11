// GeographyViewModeToggle.jsx — "Map | List" workspace view toggle.
// Map is active by default; switching to List hides the map and shows
// a full-width GeographyResultsList instead — local state only, no
// route change. Real buttons, keyboard-accessible (native <button>,
// no custom key handling needed).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

const VIEWS = [
  { key: "map", label: "Map", icon: "map" },
  { key: "list", label: "List", icon: "list" },
];

export default function GeographyViewModeToggle({ viewMode, onChange }) {
  return (
    <div className="cse-view-toggle" role="group" aria-label="Workspace view">
      {VIEWS.map((v) => (
        <button key={v.key} type="button" className={viewMode === v.key ? "is-active" : ""} onClick={() => onChange(v.key)} aria-pressed={viewMode === v.key}>
          <ExplorerIcon name={v.icon} />
          {v.label}
        </button>
      ))}
    </div>
  );
}
