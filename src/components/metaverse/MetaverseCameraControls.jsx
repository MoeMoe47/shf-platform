import React from "react";

export default function MetaverseCameraControls({
  onZoomIn,
  onZoomOut,
  onReset,
  onBack,
  canGoBack,
  navigatorOpen,
  onToggleNavigator,
}) {
  return (
    <div className="met-controls" aria-label="Camera and navigation controls">
      <button type="button" onClick={onZoomIn} aria-label="Zoom in">+</button>
      <button type="button" onClick={onZoomOut} aria-label="Zoom out">-</button>
      <button type="button" onClick={onReset}>Reset</button>
      <button type="button" onClick={onBack} disabled={!canGoBack}>Back</button>
      <button type="button" onClick={onToggleNavigator} aria-expanded={navigatorOpen}>
        Locations
      </button>
    </div>
  );
}
