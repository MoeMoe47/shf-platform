import React, { useEffect, useRef, useState } from "react";
import {
  GHOST_PREVIEW_SPEED_PRESETS,
  TRAFFIC_AUTHORING_MODES,
  TRAFFIC_AUTHORING_ROUTE_STATUSES,
  TRAFFIC_AUTHORING_SPEED_CLASSES,
  TRAFFIC_AUTHORING_VEHICLE_CLASSES,
  TRAFFIC_AUTHORING_VEHICLE_CLASSES_DISABLED_BY_DEFAULT,
  resolveGhostPreviewSpeedLabel,
} from "@/system/metaverse/traffic/metaverseTrafficAuthoringModel.js";
import {
  TRAFFIC_PREVIEW_MAX_VEHICLES_PER_ROUTE,
  TRAFFIC_PREVIEW_SPEED_PRESETS,
  TRAFFIC_PREVIEW_VEHICLE_COUNTS,
  TRAFFIC_PREVIEW_VEHICLE_SCALE_PRESETS,
  resolveTrafficPreviewSpeedLabel,
} from "@/system/metaverse/traffic/metaverseTrafficLivePreviewModel.js";

// MET-16A — Manual Traffic Authoring Tool: developer-only control panel.
//
// Rendered as a fixed, collapsible overlay OUTSIDE the camera-transformed
// box (a sibling of <MetaverseCamera> in MetaverseCityPage.jsx) so it never
// pans/zooms/scales with the city and never covers most of it. The panel and
// MetaverseTrafficAuthoringOverlay share the same `controller` object
// (useMetaverseTrafficAuthoring), so every action here is immediately
// reflected in the in-world overlay and vice versa.
//
// Dev-build + explicit `?trafficAuthor=1` gated — see
// resolveTrafficAuthoringEnabled in the model. Renders nothing when
// `controller.enabled` is false.

const MODE_LABELS = {
  SELECT: "Select",
  DRAW: "Draw Route",
  EDIT: "Edit",
  OCCLUSION: "Occlusion",
  PERSPECTIVE: "Perspective",
  PREVIEW: "Preview",
};

function isTypingInField(target) {
  return target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
}

// MET-16B — Live Traffic Preview controls, rendered inside the existing
// Traffic Authoring panel (Section 2: "extend the existing developer
// traffic authoring mode... inside the existing Traffic Authoring panel").
// Reads/writes only `previewController` (useMetaverseTrafficLivePreview) —
// it never touches a route's own points/perspective/occlusion_segments.
function LiveTrafficPreviewSection({ previewController }) {
  const { status, routeScope, vehicleCount, speedMultiplier, loop, previewVehicleScale, showRouteLine, showControlPoints, showGhost, showRealVehicle, activeRoutes, hasDraftRouteInScope, actions } = previewController;

  return (
    <fieldset>
      <legend>Live Traffic Preview</legend>
      <p className="met-traffic-author-panel__hint">
        Real vehicle sprites moving on the owner-authored route(s) above — preview/calibration only, never wired into production traffic.
      </p>

      <div className="met-traffic-author-panel__button-row">
        <button type="button" onClick={actions.start} disabled={!activeRoutes.length}>Start Traffic Preview</button>
        <button type="button" onClick={actions.pause} disabled={status !== "PLAYING"}>Pause</button>
        <button type="button" onClick={actions.restart} disabled={!activeRoutes.length}>Restart</button>
        <button type="button" onClick={actions.stop} disabled={status === "STOPPED"}>Stop</button>
      </div>
      <p className="met-traffic-author-panel__status" aria-live="polite">Status: <strong>{status}</strong></p>

      {!activeRoutes.length ? (
        <p className="met-traffic-author-panel__hint">
          No route(s) in scope yet — select a route, or mark one CALIBRATED/APPROVED for the "All" scope below.
        </p>
      ) : null}
      {hasDraftRouteInScope ? (
        <p className="met-traffic-author-panel__status met-traffic-author__draft-warning">DRAFT ROUTE — NOT READY FOR PRODUCTION</p>
      ) : null}

      <label>Route scope</label>
      <div className="met-traffic-author-panel__button-row" role="radiogroup" aria-label="Traffic preview route scope">
        <button type="button" aria-pressed={routeScope === "ACTIVE_ONLY"} data-active={routeScope === "ACTIVE_ONLY" ? "true" : "false"} onClick={() => actions.setRouteScope("ACTIVE_ONLY")}>
          Active Route Only
        </button>
        <button type="button" aria-pressed={routeScope === "ALL_CALIBRATED"} data-active={routeScope === "ALL_CALIBRATED" ? "true" : "false"} onClick={() => actions.setRouteScope("ALL_CALIBRATED")}>
          All Approved/Calibrated Routes
        </button>
      </div>

      <label htmlFor="met-traffic-preview-vehicle-count">Vehicle count (max {TRAFFIC_PREVIEW_MAX_VEHICLES_PER_ROUTE} per route)</label>
      <div className="met-traffic-author-panel__button-row" role="radiogroup" aria-label="Vehicle count per route" id="met-traffic-preview-vehicle-count">
        {TRAFFIC_PREVIEW_VEHICLE_COUNTS.map((count) => (
          <button key={count} type="button" aria-pressed={vehicleCount === count} data-active={vehicleCount === count ? "true" : "false"} onClick={() => actions.setVehicleCount(count)}>
            {count}
          </button>
        ))}
      </div>

      <p className="met-traffic-author-panel__status" aria-live="polite">
        Speed: <strong>{speedMultiplier.toFixed(2)}x</strong> — {resolveTrafficPreviewSpeedLabel(speedMultiplier)}
      </p>
      <div className="met-traffic-author-panel__button-row" role="radiogroup" aria-label="Traffic preview speed">
        {TRAFFIC_PREVIEW_SPEED_PRESETS.map((preset) => (
          <button
            key={preset.multiplier}
            type="button"
            aria-pressed={speedMultiplier === preset.multiplier}
            data-active={speedMultiplier === preset.multiplier ? "true" : "false"}
            onClick={() => actions.setSpeedMultiplier(preset.multiplier)}
            title={`${preset.multiplier}x normal`}
          >
            {preset.multiplier}x — {preset.label}
          </button>
        ))}
      </div>
      <label className="met-traffic-author-panel__checkbox">
        <input type="checkbox" checked={loop} onChange={(event) => actions.setLoop(event.target.checked)} />
        Loop (restart cleanly at START after a brief pause; off despawns at END)
      </label>

      <label>Preview vehicle scale (visual only — never affects route geometry)</label>
      <div className="met-traffic-author-panel__button-row" role="radiogroup" aria-label="Preview vehicle scale">
        {TRAFFIC_PREVIEW_VEHICLE_SCALE_PRESETS.map((scale) => (
          <button
            key={scale}
            type="button"
            aria-pressed={previewVehicleScale === scale}
            data-active={previewVehicleScale === scale ? "true" : "false"}
            onClick={() => actions.setPreviewVehicleScale(scale)}
          >
            {scale.toFixed(2)}x
          </button>
        ))}
      </div>

      <fieldset className="met-traffic-author-panel__nested">
        <legend>Active Route Debug</legend>
        <label className="met-traffic-author-panel__checkbox">
          <input type="checkbox" checked={showRouteLine} onChange={(event) => actions.setShowRouteLine(event.target.checked)} />
          Show Route Line
        </label>
        <label className="met-traffic-author-panel__checkbox">
          <input type="checkbox" checked={showControlPoints} onChange={(event) => actions.setShowControlPoints(event.target.checked)} />
          Show Control Points
        </label>
        <label className="met-traffic-author-panel__checkbox">
          <input type="checkbox" checked={showGhost} onChange={(event) => actions.setShowGhost(event.target.checked)} />
          Show Ghost
        </label>
        <label className="met-traffic-author-panel__checkbox">
          <input type="checkbox" checked={showRealVehicle} onChange={(event) => actions.setShowRealVehicle(event.target.checked)} />
          Show Real Vehicle
        </label>
        <p className="met-traffic-author-panel__hint">
          Recommended calibration: Route Line + Real Vehicle on, Ghost off — confirm alignment, then turn Ghost on too and confirm both follow the same spline.
        </p>
      </fieldset>
    </fieldset>
  );
}

export default function MetaverseTrafficAuthoringPanel({ controller, previewController }) {
  const [collapsed, setCollapsed] = useState(false);
  const [newRouteName, setNewRouteName] = useState("");
  const [importText, setImportText] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const fileInputRef = useRef(null);

  const {
    routes,
    activeRoute,
    mode,
    showAllRoutes,
    selectedPointIndex,
    occlusionPick,
    lastClickProgress,
    pendingPerspectiveScale,
    ghost,
    lastSavedAt,
    importErrors,
    statusMessage,
    validationWarnings,
    routeSetWarnings,
    actions,
  } = controller || {};

  // Section 5 keyboard support: Delete/Backspace deletes the selected point
  // (Edit mode only), Escape cancels the current pick/selection state, Enter
  // finishes the current route by dropping back to Select mode. Ignored
  // while the owner is typing in a text field.
  useEffect(() => {
    if (!controller?.enabled) return undefined;
    const handleKeyDown = (event) => {
      if (isTypingInField(event.target)) return;
      if ((event.key === "Delete" || event.key === "Backspace") && mode === "EDIT" && selectedPointIndex !== null) {
        event.preventDefault();
        actions.deleteSelectedPoint();
      } else if (event.key === "Escape") {
        actions.setSelectedPointIndex(null);
        actions.setOcclusionPick({ picking: "START", startT: null, endT: null });
      } else if (event.key === "Enter" && (mode === "DRAW" || mode === "EDIT")) {
        actions.setMode("SELECT");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [controller?.enabled, mode, selectedPointIndex, actions]);

  if (!controller?.enabled) return null;

  const handleImportFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => actions.importRoutesJson(String(reader.result || ""));
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <div className={`met-traffic-author-panel ${collapsed ? "is-collapsed" : ""}`} data-dev-only="true">
      <div className="met-traffic-author-panel__header">
        <strong>TRAFFIC AUTHORING</strong>
        <button type="button" onClick={() => setCollapsed((value) => !value)} aria-expanded={!collapsed} aria-label={collapsed ? "Expand traffic authoring panel" : "Collapse traffic authoring panel"}>
          {collapsed ? "▸" : "▾"}
        </button>
      </div>

      {collapsed ? null : (
        <div className="met-traffic-author-panel__body">
          <p className="met-traffic-author-panel__hint">
            Use fewer points on straight sections. Add points only where the lane bends.
          </p>

          <fieldset>
            <legend>Mode</legend>
            <div className="met-traffic-author-panel__button-row" role="radiogroup" aria-label="Authoring mode">
              {TRAFFIC_AUTHORING_MODES.map((modeOption) => (
                <button
                  key={modeOption}
                  type="button"
                  aria-pressed={mode === modeOption}
                  data-active={mode === modeOption ? "true" : "false"}
                  onClick={() => actions.setMode(modeOption)}
                  disabled={modeOption !== "SELECT" && modeOption !== "PREVIEW" && !activeRoute}
                >
                  {MODE_LABELS[modeOption]}
                </button>
              ))}
            </div>
            <p className="met-traffic-author-panel__status" aria-live="polite">
              Mode: <strong>{MODE_LABELS[mode]}</strong>
              {mode === "DRAW" ? " — click along the visible lane to add a point." : null}
              {mode === "EDIT" ? " — drag a point to move it, Delete to remove the selected point (hold Shift while dragging to keep it level)." : null}
              {mode === "OCCLUSION" ? ` — click the route to pick ${occlusionPick?.picking === "START" ? "the hidden segment's start" : "the hidden segment's end"}.` : null}
              {mode === "PERSPECTIVE" ? " — click the route to capture a position, then assign its scale below." : null}
            </p>
          </fieldset>

          <fieldset>
            <legend>Route</legend>
            <div className="met-traffic-author-panel__row">
              <input
                type="text"
                placeholder="New route name"
                value={newRouteName}
                onChange={(event) => setNewRouteName(event.target.value)}
              />
              <button type="button" onClick={() => { actions.newRoute(newRouteName || undefined); setNewRouteName(""); }}>
                New Route
              </button>
            </div>

            {routes.length ? (
              <>
                <label htmlFor="met-traffic-author-route-select">Active route</label>
                <select id="met-traffic-author-route-select" value={activeRoute?.id || ""} onChange={(event) => actions.selectRoute(event.target.value)}>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name} — {route.status} ({route.points.length} pts)
                    </option>
                  ))}
                </select>
                <label className="met-traffic-author-panel__checkbox">
                  <input type="checkbox" checked={showAllRoutes} onChange={(event) => actions.setShowAllRoutes(event.target.checked)} />
                  Show all routes (default: active route only)
                </label>
              </>
            ) : (
              <p className="met-traffic-author-panel__hint">No routes yet — create one above, then click points on the live city.</p>
            )}

            {activeRoute ? (
              <div className="met-traffic-author-panel__button-row">
                <button type="button" onClick={() => actions.duplicateRoute()}>Duplicate</button>
                <button type="button" onClick={actions.undoLastPoint}>Undo Last Point</button>
                <button type="button" className="met-traffic-author-panel__danger" onClick={() => actions.deleteRoute()}>Delete</button>
              </div>
            ) : null}
          </fieldset>

          {activeRoute ? (
            <>
              <fieldset>
                <legend>Route Properties</legend>
                <label htmlFor="met-traffic-author-name">Route name</label>
                <input
                  id="met-traffic-author-name"
                  type="text"
                  value={activeRoute.name}
                  onChange={(event) => actions.renameActiveRoute(event.target.value)}
                />

                <div className="met-traffic-author-panel__row">
                  <span>Direction: <strong>{activeRoute.direction}</strong></span>
                  <button type="button" onClick={actions.reverseActiveRoute} title="Reverses point order and re-maps perspective/occlusion progress — no redraw needed.">
                    Reverse Route
                  </button>
                </div>

                <fieldset className="met-traffic-author-panel__nested">
                  <legend>Vehicle class</legend>
                  {TRAFFIC_AUTHORING_VEHICLE_CLASSES.map((vehicleClass) => {
                    const disabledByDefault = TRAFFIC_AUTHORING_VEHICLE_CLASSES_DISABLED_BY_DEFAULT.includes(vehicleClass);
                    return (
                      <label key={vehicleClass} className="met-traffic-author-panel__checkbox" title={disabledByDefault ? "Reserved for a future phase — this authoring tool does not wire buses into production." : undefined}>
                        <input
                          type="checkbox"
                          checked={(activeRoute.vehicle_classes || []).includes(vehicleClass)}
                          disabled={disabledByDefault}
                          onChange={() => actions.toggleVehicleClass(vehicleClass)}
                        />
                        {vehicleClass.replace(/_/g, " ")}
                        {disabledByDefault ? " (disabled by default)" : ""}
                      </label>
                    );
                  })}
                </fieldset>

                <label htmlFor="met-traffic-author-speed">Speed class</label>
                <select id="met-traffic-author-speed" value={activeRoute.speed_class} onChange={(event) => actions.setSpeedClass(event.target.value)}>
                  {TRAFFIC_AUTHORING_SPEED_CLASSES.map((speedClass) => (
                    <option key={speedClass} value={speedClass}>{speedClass.replace(/_/g, " ")}</option>
                  ))}
                </select>

                <div className="met-traffic-author-panel__row">
                  <span>Status:</span>
                  {TRAFFIC_AUTHORING_ROUTE_STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      aria-pressed={activeRoute.status === status}
                      data-active={activeRoute.status === status ? "true" : "false"}
                      onClick={() => actions.setStatus(status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <p className="met-traffic-author-panel__hint">
                  APPROVED does not wire this route into production traffic — that only happens in a future phase.
                </p>

                <label htmlFor="met-traffic-author-notes">Notes</label>
                <textarea
                  id="met-traffic-author-notes"
                  rows={2}
                  value={activeRoute.notes}
                  onChange={(event) => actions.setNotes(event.target.value)}
                />
              </fieldset>

              {mode === "PERSPECTIVE" ? (
                <fieldset>
                  <legend>Perspective</legend>
                  <p className="met-traffic-author-panel__hint">
                    Click the route in the city view to capture a position, then assign its scale.
                  </p>
                  <div className="met-traffic-author-panel__row">
                    <span>Progress (t): {lastClickProgress === null ? "—" : lastClickProgress.toFixed(2)}</span>
                  </div>
                  <label htmlFor="met-traffic-author-scale">Scale</label>
                  <input
                    id="met-traffic-author-scale"
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="3"
                    value={pendingPerspectiveScale}
                    onChange={(event) => actions.setPendingPerspectiveScale(Number(event.target.value))}
                  />
                  <button
                    type="button"
                    disabled={lastClickProgress === null}
                    onClick={() => actions.commitPerspectiveKey(lastClickProgress, pendingPerspectiveScale)}
                  >
                    Add Perspective Key
                  </button>
                  <ul className="met-traffic-author-panel__list">
                    {(activeRoute.perspective || []).map((key) => (
                      <li key={key.t}>
                        t={key.t.toFixed(2)} → scale {key.scale.toFixed(2)}
                        <button type="button" onClick={() => actions.deletePerspectiveKey(key.t)}>Remove</button>
                      </li>
                    ))}
                  </ul>
                </fieldset>
              ) : null}

              {mode === "OCCLUSION" ? (
                <fieldset>
                  <legend>Occlusion</legend>
                  <p className="met-traffic-author-panel__hint">
                    Click the route twice: once for the hidden segment's start, once for its end.
                  </p>
                  <p>
                    Start: {occlusionPick?.startT === null || occlusionPick?.startT === undefined ? "not set" : occlusionPick.startT.toFixed(2)}
                    {" · "}
                    End: {occlusionPick?.endT === null || occlusionPick?.endT === undefined ? "not set" : occlusionPick.endT.toFixed(2)}
                  </p>
                  <button
                    type="button"
                    disabled={occlusionPick?.startT === null || occlusionPick?.endT === null || occlusionPick?.startT === undefined || occlusionPick?.endT === undefined}
                    onClick={actions.commitOcclusionSegment}
                  >
                    Mark HIDDEN
                  </button>
                  <ul className="met-traffic-author-panel__list">
                    {(activeRoute.occlusion_segments || []).map((segment) => (
                      <li key={segment.id}>
                        {segment.from.toFixed(2)} – {segment.to.toFixed(2)}
                        <button type="button" onClick={() => actions.deleteOcclusionSegment(segment.id)}>Remove</button>
                      </li>
                    ))}
                  </ul>
                </fieldset>
              ) : null}

              <fieldset>
                <legend>Ghost Preview</legend>
                <div className="met-traffic-author-panel__button-row">
                  <button type="button" onClick={() => actions.setGhostPlaying(true)}>Play</button>
                  <button type="button" onClick={() => actions.setGhostPlaying(false)}>Pause</button>
                  <button type="button" onClick={actions.restartGhost}>Restart</button>
                  <label className="met-traffic-author-panel__checkbox">
                    <input type="checkbox" checked={ghost.loop} onChange={(event) => actions.setGhostLoop(event.target.checked)} />
                    Loop
                  </label>
                </div>
                <p className="met-traffic-author-panel__status" aria-live="polite">
                  Speed: <strong>{ghost.speedMultiplier.toFixed(2)}x</strong> — {resolveGhostPreviewSpeedLabel(ghost.speedMultiplier)}
                </p>
                <div className="met-traffic-author-panel__button-row" role="radiogroup" aria-label="Ghost preview speed">
                  {GHOST_PREVIEW_SPEED_PRESETS.map((preset) => (
                    <button
                      key={preset.multiplier}
                      type="button"
                      aria-pressed={ghost.speedMultiplier === preset.multiplier}
                      data-active={ghost.speedMultiplier === preset.multiplier ? "true" : "false"}
                      onClick={() => actions.setGhostSpeedMultiplier(preset.multiplier)}
                      title={`${preset.multiplier}x normal`}
                    >
                      {preset.multiplier}x — {preset.label}
                    </button>
                  ))}
                </div>
                <p className="met-traffic-author-panel__hint">
                  Authoring-only playback speed for lane-alignment inspection — never affects any production traffic speed.
                </p>
                <p className="met-traffic-author-panel__hint">Progress: {(ghost.progress * 100).toFixed(0)}%</p>
              </fieldset>

              {previewController ? <LiveTrafficPreviewSection previewController={previewController} /> : null}

              {validationWarnings.length ? (
                <fieldset>
                  <legend>Route Validation</legend>
                  <ul className="met-traffic-author-panel__list met-traffic-author-panel__warnings">
                    {validationWarnings.map((warning) => <li key={warning}>{warning}</li>)}
                  </ul>
                </fieldset>
              ) : null}
            </>
          ) : null}

          <fieldset>
            <legend>Save / Export / Import</legend>
            <div className="met-traffic-author-panel__button-row">
              <button type="button" onClick={actions.saveDraft}>Save (local draft)</button>
              <button type="button" onClick={actions.copyAllRoutesToClipboard}>Copy JSON</button>
              <button type="button" onClick={actions.downloadAllRoutesJson}>Download JSON</button>
              <button type="button" onClick={() => setImportOpen((value) => !value)}>Import…</button>
              <button type="button" onClick={actions.loadCanonicalRoutes} title="Merge routes already committed in src/system/metaverse/traffic/metaverseTrafficRoutes.json into this session">
                Load Canonical Routes
              </button>
            </div>
            {lastSavedAt ? <p className="met-traffic-author-panel__hint">Draft saved {new Date(lastSavedAt).toLocaleTimeString()}.</p> : null}
            <p className="met-traffic-author-panel__hint">
              To make routes canonical, paste the exported JSON into{" "}
              <code>src/system/metaverse/traffic/metaverseTrafficRoutes.json</code>.
            </p>

            {importOpen ? (
              <div className="met-traffic-author-panel__import">
                <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportFile} />
                <textarea
                  rows={3}
                  placeholder="…or paste route JSON here"
                  value={importText}
                  onChange={(event) => setImportText(event.target.value)}
                />
                <button type="button" onClick={() => actions.importRoutesJson(importText)} disabled={!importText.trim()}>
                  Load Pasted JSON
                </button>
                {importErrors.length ? (
                  <ul className="met-traffic-author-panel__list met-traffic-author-panel__warnings">
                    {importErrors.map((error) => <li key={error}>{error}</li>)}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </fieldset>

          {routeSetWarnings.length ? (
            <fieldset>
              <legend>All Routes — Validation</legend>
              <ul className="met-traffic-author-panel__list met-traffic-author-panel__warnings">
                {routeSetWarnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            </fieldset>
          ) : null}

          {statusMessage ? <p className="met-traffic-author-panel__status" aria-live="polite">{statusMessage}</p> : null}

          <p className="met-traffic-author-panel__hint">
            Keyboard: Delete/Backspace removes the selected point in Edit mode, Escape cancels the current pick, Enter returns to Select.
          </p>
        </div>
      )}
    </div>
  );
}
