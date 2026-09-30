import React, { useMemo, useState } from "react";

import SpatialContextPanel from "../../components/spatial-command-center/SpatialContextPanel.jsx";
import SpatialWorkspaceHeader from "../../components/spatial-command-center/SpatialWorkspaceHeader.jsx";
import SpatialWorkspaceSwitcher, {
  SPATIAL_COMMAND_CENTER_WORKSPACE_COMPOSITION,
} from "../../components/spatial-command-center/SpatialWorkspaceSwitcher.jsx";
import IepSpatialWorkspace from "../../components/spatial-command-center/workspaces/IepSpatialWorkspace.jsx";
import OilRigSpatialWorkspace from "../../components/spatial-command-center/workspaces/OilRigSpatialWorkspace.jsx";
import QuickMapSpatialWorkspace from "../../components/spatial-command-center/workspaces/QuickMapSpatialWorkspace.jsx";
import {
  createCommandCenterSpatialView,
} from "../../system/spatial/commandCenter/index.js";
import { createCommandCenterLayerState } from "../../system/spatial/commandCenter/layerState.js";
import { createCommandCenterSelectionCoordinator } from "../../system/spatial/commandCenter/selectionCoordinator.js";
import { createCommandCenterWorkspaceState } from "../../system/spatial/commandCenter/workspaceState.js";

export const SPATIAL_COMMAND_CENTER_ROUTE = "/spatial-command-center";

export const SPATIAL_COMMAND_CENTER_UI_FILES = Object.freeze([
  "src/pages/spatial-command-center/SpatialCommandCenterPage.jsx",
  "src/components/spatial-command-center/SpatialWorkspaceSwitcher.jsx",
  "src/components/spatial-command-center/SpatialWorkspaceHeader.jsx",
  "src/components/spatial-command-center/SpatialContextPanel.jsx",
  "src/components/spatial-command-center/workspaces/IepSpatialWorkspace.jsx",
  "src/components/spatial-command-center/workspaces/QuickMapSpatialWorkspace.jsx",
  "src/components/spatial-command-center/workspaces/OilRigSpatialWorkspace.jsx",
]);

export const SPATIAL_COMMAND_CENTER_UI_LAYOUT_CONTRACT = Object.freeze({
  left: "compact workspace switcher",
  center: "dominant spatial workspace canvas",
  right: "temporary contextual panel",
  top: "coordinate-space and qualification context",
  bottom: "compact safe system status",
  avoidsDenseDashboard: true,
  avoidsDecorativeTelemetryCards: true,
  spatialCanvasDominant: true,
});

export const SPATIAL_COMMAND_CENTER_UI_ROUTE_CONTRACT = Object.freeze({
  route: "/spatial-command-center",
  implementedInWave8DContractPhase: false,
  doesNotCollideWithExchangeCommandCenter: true,
  doesNotCollideWithShfCommandCenter: true,
  doesNotCollideWithIepCommandCenter: true,
  noProductionRouteCreatedByContract: true,
});

export const SPATIAL_COMMAND_CENTER_UI_ALLOWED_ACTIONS = Object.freeze([
  "activate workspace",
  "toggle presentation layer visibility",
  "select presentation feature",
  "clear presentation selection",
  "set presentation highlight",
  "clear presentation highlight",
  "open contextual panel",
  "close contextual panel",
]);

export const SPATIAL_COMMAND_CENTER_UI_PROHIBITED_ACTIONS = Object.freeze([
  "authorize",
  "approve",
  "publish",
  "navigate route automatically",
  "change scene",
  "dispatch",
  "route traffic",
  "route water",
  "route transit",
  "transform coordinates",
  "convert coordinate space",
  "assign jurisdiction",
  "assign service area",
  "determine eligibility",
  "mutate domain record",
  "establish metric truth",
]);

export const SPATIAL_COMMAND_CENTER_UI_WORKSPACE_SWITCHING_CONTRACT = Object.freeze({
  usesWave8CWorkspaceState: true,
  automaticallyNavigatesRoutes: false,
  transformsCoordinates: false,
  copiesIncompatibleSelection: false,
  changesQualification: false,
  mutatesSourceState: false,
  selectionRemainsWorkspaceIsolated: true,
});

export const SPATIAL_COMMAND_CENTER_ACCESSIBILITY_CONTRACT = Object.freeze({
  semanticPageLandmarks: true,
  keyboardWorkspaceSwitching: true,
  visibleFocus: true,
  screenReaderWorkspaceLabel: true,
  coordinateSpaceTextEquivalent: true,
  nonColorOnlyQualificationState: true,
  nonColorOnlyIntelligenceState: true,
  semanticLoadingState: true,
  semanticEmptyState: true,
  semanticUnavailableState: true,
  reducedMotionCompatible: true,
  mapSummaryText: true,
  selectedFeatureAnnouncement: true,
  contextualPanelAccessibleLabel: true,
});

export const SPATIAL_COMMAND_CENTER_RESPONSIVE_CONTRACT = Object.freeze({
  desktop: {
    workspaceSwitcherVisible: true,
    spatialCanvasDominant: true,
    contextualPanelOptional: true,
  },
  tablet: {
    compactWorkspaceSwitcher: true,
    contextualPanelCollapsible: true,
  },
  smallScreens: {
    noOverlappingControls: true,
    workspaceRemainsUsable: true,
    contextualPanelDrawerOrStack: true,
    coreTasksRequireHorizontalOverflow: false,
  },
});

const workspaceRecords = SPATIAL_COMMAND_CENTER_WORKSPACE_COMPOSITION.map((workspace) => Object.freeze({
  workspaceId: workspace.workspaceId,
  qualifiedClientId: workspace.qualifiedClientId,
  coordinateFamily: workspace.coordinateFamily,
  coordinateSpace: workspace.coordinateSpace,
  visibleLayerIds: [],
  highlightedFeatureIds: [],
  features: [
    Object.freeze({
      featureId: `${workspace.workspaceId}-presentation-feature`,
      layerId: workspace.coordinateSpace === "real-world.county-geojson"
        ? "real-world.counties"
        : workspace.coordinateSpace === "metaverse.quick-map"
          ? "metaverse.quick-map.locations"
          : "metaverse.regional-scenes",
      coordinateFamily: workspace.coordinateFamily,
      coordinateSpaceId: workspace.coordinateSpace,
      publicationState: "PUBLISHED",
    }),
  ],
}));

function workspaceLayerId(workspace) {
  if (workspace.coordinateSpace === "real-world.county-geojson") return "real-world.counties";
  if (workspace.coordinateSpace === "metaverse.quick-map") return "metaverse.quick-map.locations";
  return "metaverse.regional-scenes";
}

function renderWorkspace(workspace) {
  if (workspace?.qualifiedClientId === "iep-ohio-county-map") return <IepSpatialWorkspace workspace={workspace} />;
  if (workspace?.qualifiedClientId === "metaverse-quick-map") return <QuickMapSpatialWorkspace workspace={workspace} />;
  if (workspace?.qualifiedClientId === "metaverse-regional-scene-oil-rig") return <OilRigSpatialWorkspace workspace={workspace} />;
  return (
    <section role="status" aria-label="Unavailable workspace">
      Unavailable
    </section>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#f8fafc",
  color: "#0f172a",
};

const shellStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(220px, 280px) minmax(0, 1fr) minmax(260px, 320px)",
  gap: 0,
  minHeight: "100vh",
};

const railStyle = {
  borderRight: "1px solid #e2e8f0",
  padding: 20,
  background: "#f8fafc",
};

const centerStyle = {
  padding: 24,
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const statusStyle = {
  borderTop: "1px solid #e2e8f0",
  paddingTop: 12,
  fontSize: 13,
  color: "#475569",
};

export default function SpatialCommandCenterPage() {
  const workspaceState = useMemo(() => createCommandCenterWorkspaceState({
    workspaces: workspaceRecords,
    activeWorkspaceId: "iep-ohio-county-map",
  }), []);
  const selectionCoordinator = useMemo(() => createCommandCenterSelectionCoordinator({
    workspaces: workspaceRecords,
  }), []);

  const [activeWorkspaceId, setActiveWorkspaceId] = useState(workspaceState.activeWorkspaceId);
  const [selectionSnapshot, setSelectionSnapshot] = useState(selectionCoordinator.snapshot());

  const activeWorkspace = SPATIAL_COMMAND_CENTER_WORKSPACE_COMPOSITION.find(
    (workspace) => workspace.workspaceId === activeWorkspaceId,
  ) || SPATIAL_COMMAND_CENTER_WORKSPACE_COMPOSITION[0];

  const layerState = useMemo(() => createCommandCenterLayerState({
    workspace: workspaceRecords.find((workspace) => workspace.workspaceId === activeWorkspace.workspaceId),
    visibleLayerIds: [workspaceLayerId(activeWorkspace)],
  }), [activeWorkspace]);

  const spatialView = createCommandCenterSpatialView({
    viewId: activeWorkspace.workspaceId,
    label: activeWorkspace.label,
    coordinateFamily: activeWorkspace.coordinateFamily,
    coordinateSpace: activeWorkspace.coordinateSpace,
    qualifiedClientId: activeWorkspace.qualifiedClientId,
    clientStatus: activeWorkspace.spatialQualified ? "QUALIFIED" : "UNQUALIFIED",
    layerSummaries: layerState.ok ? layerState.snapshot.visibleLayerIds.map((layerId) => ({ id: layerId, label: layerId })) : [],
    limitations: [
      { id: "transform-policy", label: "No coordinate transform available" },
      { id: "separate-spaces", label: "Workspaces remain separate governed coordinate spaces" },
    ],
    systemStatus: "UNKNOWN",
  });

  function activateWorkspace(workspaceId) {
    const result = workspaceState.activateWorkspace(workspaceId);
    if (result.ok) {
      setActiveWorkspaceId(result.snapshot.activeWorkspaceId);
      setSelectionSnapshot(selectionCoordinator.snapshot());
    }
  }

  function clearSelection() {
    const result = selectionCoordinator.clearSelection("workspace presentation clear");
    setSelectionSnapshot(result.snapshot);
  }

  return (
    <main aria-label="Geographic / Spatial Command Center" style={pageStyle}>
      <style>
        {`
          @media (max-width: 980px) {
            .spatial-command-center-shell {
              grid-template-columns: minmax(0, 1fr) !important;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .spatial-command-center-shell *,
            .spatial-command-center-shell *::before,
            .spatial-command-center-shell *::after {
              scroll-behavior: auto !important;
              transition-duration: 0.001ms !important;
              animation-duration: 0.001ms !important;
            }
          }
        `}
      </style>
      <div className="spatial-command-center-shell" style={shellStyle}>
        <aside style={railStyle} aria-label="Workspace switcher">
          <h1 style={{ margin: "0 0 8px", fontSize: 22 }}>Geographic / Spatial Command Center</h1>
          <p style={{ margin: "0 0 18px", color: "#475569", fontSize: 13 }}>
            Workspaces are separate governed coordinate spaces.
          </p>
          <SpatialWorkspaceSwitcher
            activeWorkspaceId={activeWorkspaceId}
            onActivateWorkspace={activateWorkspace}
          />
        </aside>
        <section style={centerStyle} aria-label="Spatial workspace">
          <SpatialWorkspaceHeader workspace={activeWorkspace} />
          <div role="img" aria-label={`Map summary for ${activeWorkspace.label}: ${activeWorkspace.coordinateSpace}`}>
            {renderWorkspace(activeWorkspace)}
          </div>
          <div role="status" aria-live="polite" style={statusStyle}>
            {selectionSnapshot.activeSelection
              ? `Selected feature ${selectionSnapshot.activeSelection.featureId}`
              : "No presentation selection. Coordinate spaces remain isolated."}
            <div style={{ marginTop: 8 }}>
              <button type="button" onClick={clearSelection}>
                Clear presentation selection
              </button>
            </div>
          </div>
        </section>
        <SpatialContextPanel
          workspace={activeWorkspace}
          spatialView={spatialView}
          selectionSnapshot={selectionSnapshot}
        />
      </div>
    </main>
  );
}
