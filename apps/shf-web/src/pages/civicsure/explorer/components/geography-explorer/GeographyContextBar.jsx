// GeographyContextBar.jsx — visible chip row summarizing current
// geographic/filter state (e.g. "Ohio × All Program Categories ×
// FY2026 × Active"). Real local interaction: each removable chip's
// "x" clears just that filter, and "Clear all" resets every
// removable filter back to its default — no backend query, just
// local state (see CivicSureGeographyExplorerPage.jsx). DEMO / FRAME
// DATA (see ../../geographyExplorerMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function GeographyContextBar({ chips, onRemoveChip, onClearAll }) {
  const hasRemovableChips = chips.some((c) => c.removable);

  return (
    <div className="cse-geo-context-bar" role="group" aria-label="Current geography filters">
      <ul className="cse-geo-context-bar__chips">
        {chips.map((chip) => (
          <li key={chip.key} className="cse-geo-chip">
            <span>{chip.label}</span>
            {chip.removable ? (
              <button type="button" className="cse-geo-chip__remove" onClick={() => onRemoveChip(chip.key)} aria-label={`Remove ${chip.label} filter`}>
                <ExplorerIcon name="close" />
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      {hasRemovableChips ? (
        <button type="button" className="cse-geo-context-bar__clear" onClick={onClearAll}>
          Clear all
        </button>
      ) : null}
    </div>
  );
}
