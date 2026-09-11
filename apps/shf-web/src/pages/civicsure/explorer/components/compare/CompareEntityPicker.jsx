// CompareEntityPicker.jsx — accessible add/remove picker for the
// current compare type's demo entity set. A single toggle button per
// entity acts as both "add" and "remove" (aria-pressed reflects
// selection), which also covers "replace" — remove one, then add
// another. Deliberately not a full autocomplete/search widget, per
// the brief's "do not implement a complicated autocomplete system"
// instruction. DEMO / FRAME DATA (see ../../compareViewMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import { MAX_COMPARE_ITEMS } from "../../compareViewMockData.js";

export default function CompareEntityPicker({ entities, selectedIds, onToggle }) {
  const atMax = selectedIds.length >= MAX_COMPARE_ITEMS;

  return (
    <div className="cse-cmp-picker" role="list" aria-label="Available items to compare">
      {entities.map((entity) => {
        const selected = selectedIds.includes(entity.id);
        const disabled = !selected && atMax;
        return (
          <div className={`cse-cmp-picker-card${selected ? " is-selected" : ""}`} role="listitem" key={entity.id}>
            <div>
              <p className="cse-cmp-picker-card__name">{entity.name}</p>
              <p className="cse-cmp-picker-card__meta">
                {entity.category} | {entity.geography}
              </p>
            </div>
            <button
              type="button"
              className={`cse-btn ${selected ? "cse-btn--primary" : "cse-btn--outline"} cse-cmp-picker-card__toggle`}
              onClick={() => onToggle(entity.id)}
              aria-pressed={selected}
              disabled={disabled}
              title={disabled ? `Maximum ${MAX_COMPARE_ITEMS} — remove one first` : undefined}
            >
              <ExplorerIcon name={selected ? "shieldCheck" : "plus"} />
              {selected ? "Added" : "Add"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
