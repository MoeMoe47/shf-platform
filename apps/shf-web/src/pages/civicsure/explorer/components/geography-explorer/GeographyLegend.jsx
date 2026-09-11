// GeographyLegend.jsx — text-based legend for the active map mode.
// Never color-only: every swatch is paired with a text label. DEMO /
// FRAME DATA (see ../../geographyExplorerMockData.js).
import React from "react";
import { MAP_MODE_LEGENDS } from "../../geographyExplorerMockData.js";

export default function GeographyLegend({ mode }) {
  const items = MAP_MODE_LEGENDS[mode] || [];

  return (
    <ul className="cse-geo-legend" aria-label={`Legend for ${mode} map view`}>
      {items.map((item) => (
        <li key={item.key} className="cse-geo-legend__item">
          <span className={`cse-geo-legend__swatch cse-geo-legend__swatch--${item.tone}`} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
