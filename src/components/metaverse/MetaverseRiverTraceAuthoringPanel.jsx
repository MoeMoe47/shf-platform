import React, { useState } from "react";
import { RIVER_FLOW_ZONE_TYPES, RIVER_GEOMETRY_TYPES } from "@/system/metaverse/metaverseRiverTraceModel.js";

const modeLabels = { CENTERLINE: "Centerline", LEFT_BANK: "Left Bank", RIGHT_BANK: "Right Bank" };
const zoneLabels = { NONE: "None", CALM: "Calm", TRANSITION: "Transition", RAPIDS: "Rapids", FAST_CURRENT: "Fast Current" };

export default function MetaverseRiverTraceAuthoringPanel({ enabled, controller, previewController, onResetFraming }) {
  const [copyState, setCopyState] = useState("");
  if (!enabled) return null;
  const { state, mode, geometryType, selectedPointIndex, zoneType, zonePick, actions } = controller;
  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(actions.exportJson());
      setCopyState("Copied");
    } catch {
      setCopyState("Copy unavailable");
    }
    window.setTimeout(() => setCopyState(""), 1800);
  };
  const setSpeed = (event) => actions.updateFlow((flow) => ({ ...flow, baseSpeed: Number(event.target.value) }));
  const preview = previewController;

  return (
    <section className="met-river-trace-panel met-river-trace-panel--expanded" aria-label="River trace developer tools" data-dev-only="true">
      <div className="met-river-trace-panel__header"><strong>Trace Mode</strong><span>Page 1 · DAY</span></div>
      <div className="met-river-trace-panel__modes" role="group" aria-label="Trace domain">
        <button type="button" aria-pressed="true">River</button>
        <a className="met-river-trace-panel__link" href="?metaverseDev=1&trafficAuthor=1">Traffic</a>
      </div>
      <p className="met-river-trace-panel__status" aria-live="polite">
        {state.centerline.length} centerline · {state.banks.left.length} left bank · {state.banks.right.length} right bank
      </p>
      <fieldset>
        <legend>Geometry</legend>
        <div className="met-river-trace-panel__button-row">
          {RIVER_GEOMETRY_TYPES.map((type) => <button key={type} type="button" aria-pressed={geometryType === type} onClick={() => actions.setGeometryType(type)}>{modeLabels[type]}</button>)}
        </div>
      </fieldset>
      <fieldset>
        <legend>Flow Zone</legend>
        <div className="met-river-trace-panel__button-row">
          {RIVER_FLOW_ZONE_TYPES.map((type) => <button key={type} type="button" aria-pressed={zoneType === type} onClick={() => actions.setZoneType(type)}>{zoneLabels[type]}</button>)}
        </div>
        {zoneType !== "NONE" ? (
          <div className="met-river-trace-panel__button-row">
            <button type="button" onClick={() => { actions.setMode("ZONE"); actions.resetZonePick(); }}>
              {zonePick.startT === null ? "Mark zone on image" : "Click zone end"}
            </button>
            <button type="button" onClick={actions.pickSelectedPointForZone} disabled={geometryType !== "CENTERLINE" || selectedPointIndex === null}>
              {zonePick.startT === null ? "Use selected start" : "Use selected end"}
            </button>
          </div>
        ) : null}
      </fieldset>
      <fieldset>
        <legend>Preview</legend>
        <div className="met-river-trace-panel__button-row">
          <button type="button" onClick={preview.actions.play} disabled={preview.status === "PLAYING"}>▶ Play Flow</button>
          <button type="button" onClick={preview.actions.pause} disabled={preview.status !== "PLAYING"}>⏸ Pause</button>
          <button type="button" onClick={preview.actions.stop}>■ Stop</button>
          <button type="button" onClick={preview.actions.restart}>↻ Restart</button>
        </div>
        <label htmlFor="met-river-preview-speed">Preview Speed <strong>{preview.speedMultiplier.toFixed(1)}x</strong></label>
        <input id="met-river-preview-speed" type="range" min="0.1" max="3" step="0.1" value={preview.speedMultiplier} onChange={(event) => preview.actions.setSpeedMultiplier(Number(event.target.value))} />
        <div className="met-river-trace-panel__checks">
          <label><input type="checkbox" checked={preview.showIndicators} onChange={(event) => preview.actions.setShowIndicators(event.target.checked)} /> Flow indicators</label>
          <label><input type="checkbox" checked={preview.showBanks} onChange={(event) => preview.actions.setShowBanks(event.target.checked)} /> Banks</label>
          <label><input type="checkbox" checked={preview.showDirection} onChange={(event) => preview.actions.setShowDirection(event.target.checked)} /> Direction</label>
        </div>
        <button type="button" onClick={() => preview.actions.setReversePreview(!preview.reversePreview)} aria-pressed={preview.reversePreview}>Reverse Preview</button>
        <p className="met-river-trace-panel__hint">Status: {preview.status}. Preview reversal is diagnostic only.</p>
      </fieldset>
      <fieldset>
        <legend>Trace Controls</legend>
        <div className="met-river-trace-panel__button-row">
          <button type="button" aria-pressed={mode === "TRACE"} onClick={() => actions.setMode("TRACE")}>Trace</button>
          <button type="button" aria-pressed={mode === "PAN"} onClick={() => actions.setMode("PAN")}>Pan / Zoom</button>
          <button type="button" onClick={actions.undo} disabled={!controller.hasUndo}>Undo</button>
          <button type="button" onClick={actions.redo} disabled={!controller.hasRedo}>Redo</button>
          <button type="button" onClick={actions.deleteSelectedPoint} disabled={selectedPointIndex === null}>Delete Point</button>
          <button type="button" onClick={actions.clear}>Clear Current</button>
        </div>
        <p className="met-river-trace-panel__hint">Click points to select, drag to adjust, or press Delete. First centerline point is upstream.</p>
      </fieldset>
      <fieldset>
        <legend>Direction / Save</legend>
        <label htmlFor="met-river-base-speed">Base speed multiplier</label>
        <input id="met-river-base-speed" type="number" min="0.1" max="3" step="0.1" value={state.flow.baseSpeed} onChange={setSpeed} />
        <div className="met-river-trace-panel__button-row">
          <button type="button" onClick={actions.reverseDirection}>Reverse River Direction</button>
          <button type="button" onClick={onResetFraming}>Reset framing</button>
          <button type="button" onClick={actions.save}>Save River</button>
          <button type="button" onClick={copyJson}>{copyState || "Export JSON"}</button>
        </div>
        <p className="met-river-trace-panel__hint">Direction reversal is explicit and updates the canonical point order. Save excludes transient playback state.</p>
      </fieldset>
      <small>Trace directly on the live master image. Switch to Pan / Zoom before inspecting the line at another camera scale.</small>
    </section>
  );
}
