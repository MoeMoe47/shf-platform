import React from "react";

import {
  listCommandCenterQualifiedClients,
} from "../../system/spatial/commandCenter/index.js";

export const SPATIAL_COMMAND_CENTER_WORKSPACE_COMPOSITION = Object.freeze(
  listCommandCenterQualifiedClients().map((client) => Object.freeze({
    workspaceId: client.id,
    qualifiedClientId: client.id,
    label: client.label,
    coordinateFamily: client.coordinateFamily,
    coordinateSpace: client.coordinateSpace,
    spatialQualified: client.spatialQualified === true,
    intelligenceAvailable: client.intelligenceQualified === true,
    transformAvailability: "NONE",
  })),
);

export const SPATIAL_COMMAND_CENTER_WORKSPACE_INTEGRATION_CONTRACT = Object.freeze({
  consumesWave8BQualifiedClientRegistry: true,
  consumesWave8BCoordinateIsolation: true,
  consumesWave8BPrivacyBoundary: true,
  consumesWave8CWorkspaceState: true,
  consumesWave8CLayerState: true,
  consumesWave8CSelectionCoordinator: true,
  recreatesReactStateSystem: false,
  bypassesWave8C: false,
  createsUnifiedCrossSpaceOverlay: false,
});

const switcherStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const buttonBaseStyle = {
  width: "100%",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  borderRadius: 8,
  padding: "12px",
  textAlign: "left",
  cursor: "pointer",
};

const selectedButtonStyle = {
  ...buttonBaseStyle,
  borderColor: "#2563eb",
  background: "#eff6ff",
};

export default function SpatialWorkspaceSwitcher({
  workspaces = SPATIAL_COMMAND_CENTER_WORKSPACE_COMPOSITION,
  activeWorkspaceId,
  onActivateWorkspace,
}) {
  return (
    <nav aria-label="Command Center workspaces" style={switcherStyle}>
      {workspaces.map((workspace) => {
        const selected = workspace.workspaceId === activeWorkspaceId;
        return (
          <button
            key={workspace.workspaceId}
            type="button"
            aria-current={selected ? "page" : undefined}
            aria-pressed={selected}
            onClick={() => onActivateWorkspace?.(workspace.workspaceId)}
            style={selected ? selectedButtonStyle : buttonBaseStyle}
          >
            <strong style={{ display: "block", fontSize: 14 }}>{workspace.label}</strong>
            <span style={{ display: "block", marginTop: 6, fontSize: 12, color: "#475569" }}>
              {workspace.coordinateFamily} / {workspace.coordinateSpace}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
