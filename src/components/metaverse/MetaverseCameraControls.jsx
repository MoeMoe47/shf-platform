import React from "react";

export default function MetaverseCameraControls({
  onZoomIn,
  onZoomOut,
  onReset,
  onBack,
  canGoBack,
  navigatorOpen,
  onToggleNavigator,
  missionsOpen,
  onToggleMissions,
  missionCount,
  opportunitiesOpen,
  onToggleOpportunities,
  opportunityCount,
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
      {onToggleMissions ? (
        <button type="button" onClick={onToggleMissions} aria-expanded={missionsOpen}>
          Missions{typeof missionCount === "number" ? ` (${missionCount})` : ""}
        </button>
      ) : null}
      {onToggleOpportunities ? (
        <button type="button" onClick={onToggleOpportunities} aria-expanded={opportunitiesOpen}>
          Opportunity Exchange{typeof opportunityCount === "number" ? ` (${opportunityCount})` : ""}
        </button>
      ) : null}
    </div>
  );
}
