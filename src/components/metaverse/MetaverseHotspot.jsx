import React from "react";
import { unlockStateLabel } from "@/system/metaverse/metaverseUnlockProjection.js";

export default function MetaverseHotspot({
  item,
  unlock,
  selected = false,
  onSelect,
  futurePresenceSlot = null,
}) {
  const label = item.fullLabel || item.label;
  const state = unlock?.decision || "RESTRICTED";
  return (
    <button
      type="button"
      className={`met-hotspot met-hotspot--${state.toLowerCase()} ${selected ? "is-selected" : ""}`}
      style={{ left: `${item.x}%`, top: `${item.y}%` }}
      onClick={() => onSelect(item)}
      aria-pressed={selected}
      aria-label={`${label}. ${unlockStateLabel(state)}. ${item.description || ""} ${unlock?.reason_text || ""}`.trim()}
      data-resource-id={item.id}
      data-unlock-state={state}
    >
      <span className="met-hotspot__pin" aria-hidden="true" />
      <span className="met-hotspot__label">{label}</span>
      <span className="met-hotspot__state">{unlockStateLabel(state)}</span>
      {futurePresenceSlot}
    </button>
  );
}
