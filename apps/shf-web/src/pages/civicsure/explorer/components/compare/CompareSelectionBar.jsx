// CompareSelectionBar.jsx — "N of 4 selected" counter, selected-entity
// chips (each with a real remove control), and a guidance message
// when fewer than the minimum meaningful comparison size is selected.
// Real local state (see CivicSureComparePage.jsx). DEMO / FRAME DATA
// (see ../../compareViewMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import { MAX_COMPARE_ITEMS, MIN_COMPARE_ITEMS } from "../../compareViewMockData.js";

export default function CompareSelectionBar({ selectedEntities, onRemove }) {
  return (
    <div className="cse-cmp-selection-bar">
      <div className="cse-cmp-selection-bar__head">
        <span className="cse-cmp-selection-bar__count">
          {selectedEntities.length} of {MAX_COMPARE_ITEMS} selected
        </span>
      </div>

      {selectedEntities.length > 0 ? (
        <ul className="cse-cmp-selection-bar__chips" aria-label="Selected comparison items">
          {selectedEntities.map((entity) => (
            <li key={entity.id} className="cse-cmp-chip">
              <span>{entity.name}</span>
              <button type="button" className="cse-cmp-chip__remove" onClick={() => onRemove(entity.id)} aria-label={`Remove ${entity.name} from comparison`}>
                <ExplorerIcon name="close" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {selectedEntities.length > 0 && selectedEntities.length < MIN_COMPARE_ITEMS ? (
        <p className="cse-cmp-selection-bar__hint">Choose at least two items to compare.</p>
      ) : null}
    </div>
  );
}
