// src/pages/admin/agent-fabric-command/components/LiveOperationsParts.jsx
// AFCC-3 Phase 7 — small shared presentation parts for Live Operations (and the
// future Simple Command Home). Status is always text + glyph, never colour alone.
import React from "react";
import { display, evidenceCopy, runStateCopy } from "../liveOperationsModel.js";

export function Val({ value, render, quiet = false }) {
  const shown = display(value);
  // quiet: list rows use plain italic gap text so frequent gaps do not add noise.
  if (shown.gap) return <span className={quiet ? "afcc-lo-gap-quiet" : "afcc-gap"} data-gap-text={shown.text}>{shown.text}</span>;
  return render ? render(value) : shown.text;
}

export function RunState({ state, reason }) {
  const copy = runStateCopy(state);
  return (
    <span className={`afcc-pill afcc-tone-${copy.tone} afcc-lo-state`} data-run-state={state} title={reason ? `Derivation: ${reason}` : undefined}>
      <span aria-hidden="true" className="afcc-lo-glyph">{copy.glyph}</span>
      <span className="afcc-sr-only">Run state: </span>
      {copy.label}
    </span>
  );
}

export function EvidenceState({ evidence }) {
  const copy = evidenceCopy(evidence);
  return (
    <span className={`afcc-pill afcc-tone-${copy.tone} afcc-lo-evidence`} data-evidence-state={evidence?.status || "NOT_AVAILABLE"}>
      <span className="afcc-sr-only">Evidence: </span>
      {copy.label}
    </span>
  );
}

