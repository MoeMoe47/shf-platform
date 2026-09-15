import React from "react";
import { canEnterMetaverseResource, unlockStateLabel } from "@/system/metaverse/metaverseUnlockProjection.js";

export default function MetaverseContextPanel({ selection, unlock, onEnter, onClose }) {
  if (!selection) return null;
  const canEnter = canEnterMetaverseResource(unlock);
  return (
    <aside className="met-context" aria-labelledby="met-context-title">
      <button type="button" className="met-context__close" onClick={onClose} aria-label="Close location details">×</button>
      <p className="met-context__eyebrow">{unlockStateLabel(unlock?.decision)}</p>
      <h2 id="met-context-title">{selection.fullLabel || selection.label}</h2>
      <p>{selection.description || "Metaverse location."}</p>
      <p className="met-context__reason">{unlock?.reason_text}</p>
      {unlock?.next_action ? (
        <a className="met-context__action" href={unlock.next_action.route_reference || "#"}>
          {unlock.next_action.next_action_label}
        </a>
      ) : null}
      <button
        type="button"
        className="met-context__enter"
        onClick={onEnter}
        disabled={!canEnter}
        aria-disabled={!canEnter}
      >
        {canEnter ? "Enter" : "Entry locked"}
      </button>
    </aside>
  );
}
