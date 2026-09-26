import React from "react";
import { failureLayerLabel, formatTimestamp, gapLabel, stateCopy } from "../commandPresentation.js";

// A value, or the reason it is absent. Never renders "Unknown".
export function GapValue({ field, render }) {
  if (field && field.gap === null && field.value !== null && field.value !== undefined) {
    return render ? render(field.value) : String(field.value);
  }
  return <span className="afcc-gap" data-gap={field?.gap}>{gapLabel(field?.gap)}</span>;
}

// Standalone gap marker for a value that could not be supplied.
export function GapMarker({ gap }) {
  return <span className="afcc-gap" data-gap={gap}>{gapLabel(gap)}</span>;
}

export function StateChip({ state }) {
  const copy = stateCopy(state);
  return <span className={`afcc-pill afcc-tone-${copy.tone}`} data-state={state}>{copy.label}</span>;
}

export function ToneChip({ tone, children }) {
  return <span className={`afcc-pill afcc-tone-${tone}`}>{children}</span>;
}

// Explains why a source has no data: state, endpoint, authority, and message.
export function SourceNotice({ projection, compact = false }) {
  const copy = stateCopy(projection.state);
  const message = projection.source?.message;
  return (
    <div className={`afcc-notice afcc-tone-${copy.tone}${compact ? " is-compact" : ""}`} data-source-state={projection.state}>
      <p className="afcc-notice-title">
        <StateChip state={projection.state} />
        <code>{projection.source?.endpoint}</code>
      </p>
      {!compact ? <p>{copy.detail}</p> : null}
      {message && message !== copy.detail ? <p className="afcc-quiet">{message}</p> : null}
      {failureLayerLabel(projection.source?.failedLayer) ? (
        <p className="afcc-quiet" data-failed-layer={projection.source.failedLayer}>Failed at: {failureLayerLabel(projection.source.failedLayer)}</p>
      ) : null}
      {projection.lastAvailableAt ? (
        <p className="afcc-quiet">Last available {formatTimestamp(projection.lastAvailableAt)}.</p>
      ) : null}
    </div>
  );
}

export function SourceFooter({ projection }) {
  const observed = formatTimestamp(projection.source?.observedAt);
  return (
    <p className="afcc-source-footer">
      <span>Source <code>{projection.source?.endpoint}</code></span>
      <span>Authority {projection.source?.authority}</span>
      {observed ? <span>Observed {observed}</span> : null}
    </p>
  );
}
