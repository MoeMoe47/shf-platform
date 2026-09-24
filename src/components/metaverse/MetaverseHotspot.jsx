import React from "react";
import { unlockStateLabel } from "@/system/metaverse/metaverseUnlockProjection.js";

// UI UPGRADE V1 — PART 1/2: at idle a hotspot shows only its small pin
// (plus the always-on mission/opportunity/market count badges, which are
// themselves already subtle discoverability signals). The full label/
// state/chevron card is revealed only on hover, keyboard focus, or an
// active selection (`selected` — the existing `selectedId === marker.id`
// wiring from MetaverseCamera.jsx, unchanged), and hides again with a
// short graceful fade (no instant snap) once none of those are true.
// This is a CSS-driven reveal (.met-hotspot__card, see metaverse-city.css)
// rather than JS-timer-driven, so no extra hover/leave state or effect
// cleanup is needed here — :hover/:focus/:focus-within/.is-selected
// combined with a transition-delay on the hide path give the "reveal
// instantly, hide gracefully" behavior directly from the cascade, and
// `.is-selected` already keeps the card open regardless of mouse leave.
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
      aria-label={`${label}. ${unlockStateLabel(state)}. ${item.missionCount ? `${item.missionCount} mission${item.missionCount === 1 ? "" : "s"}. ` : ""}${item.opportunityCount ? `${item.opportunityCount} opportunit${item.opportunityCount === 1 ? "y" : "ies"} open. ` : ""}${item.marketCount ? `${item.marketCount} market listing${item.marketCount === 1 ? "" : "s"}. ` : ""}${item.description || ""} ${unlock?.reason_text || ""}`.trim()}
      data-resource-id={item.id}
      data-unlock-state={state}
    >
      <span className="met-hotspot__pin" aria-hidden="true" />
      {/* aria-hidden: the button's own aria-label above already carries
          the full accessible name (label + state + counts + reason), so
          this visual-only card would otherwise double-announce it. */}
      <span className="met-hotspot__card" aria-hidden="true">
        <span className="met-hotspot__label">{label}</span>
        <span className="met-hotspot__state">{unlockStateLabel(state)}</span>
        <span className="met-hotspot__chevron">{"›"}</span>
      </span>
      {item.missionCount ? (
        <span className="met-hotspot__mission-count" aria-hidden="true">{item.missionCount}</span>
      ) : null}
      {item.opportunityCount ? (
        <span className="met-hotspot__opportunity-count" aria-hidden="true">{item.opportunityCount}</span>
      ) : null}
      {item.marketCount ? (
        <span className="met-hotspot__market-count" aria-hidden="true">{item.marketCount}</span>
      ) : null}
      {futurePresenceSlot}
    </button>
  );
}
