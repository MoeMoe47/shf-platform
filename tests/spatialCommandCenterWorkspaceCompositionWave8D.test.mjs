import assert from "node:assert/strict";
import test from "node:test";

import {
  SPATIAL_COMMAND_CENTER_WORKSPACE_COMPOSITION,
  SPATIAL_COMMAND_CENTER_WORKSPACE_INTEGRATION_CONTRACT,
} from "../src/components/spatial-command-center/SpatialWorkspaceSwitcher.jsx";

test("W8D-WORKSPACE-01 freezes exactly three qualified first-release workspaces", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_WORKSPACE_COMPOSITION.map((workspace) => workspace.qualifiedClientId), [
    "iep-ohio-county-map",
    "metaverse-quick-map",
    "metaverse-regional-scene-oil-rig",
  ]);
  assert.equal(SPATIAL_COMMAND_CENTER_WORKSPACE_COMPOSITION.some((workspace) => workspace.qualifiedClientId === "odot"), false);
  assert.equal(SPATIAL_COMMAND_CENTER_WORKSPACE_COMPOSITION.some((workspace) => workspace.qualifiedClientId.includes("open-sea")), false);
  assert.equal(SPATIAL_COMMAND_CENTER_WORKSPACE_COMPOSITION.some((workspace) => workspace.qualifiedClientId.includes("master-city")), false);
});

test("W8D-WORKSPACE-02 freezes coordinate labels and Oil Rig-only intelligence availability", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_WORKSPACE_COMPOSITION.map((workspace) => ({
    label: workspace.label,
    coordinateFamily: workspace.coordinateFamily,
    coordinateSpace: workspace.coordinateSpace,
    spatialQualified: workspace.spatialQualified,
    intelligenceAvailable: workspace.intelligenceAvailable,
    transformAvailability: workspace.transformAvailability,
  })), [
    {
      label: "IEP Ohio County Map",
      coordinateFamily: "REAL_WORLD",
      coordinateSpace: "real-world.county-geojson",
      spatialQualified: true,
      intelligenceAvailable: false,
      transformAvailability: "NONE",
    },
    {
      label: "Metaverse Quick Map",
      coordinateFamily: "METAVERSE",
      coordinateSpace: "metaverse.quick-map",
      spatialQualified: true,
      intelligenceAvailable: false,
      transformAvailability: "NONE",
    },
    {
      label: "Metaverse Regional Scene - Oil Rig",
      coordinateFamily: "METAVERSE",
      coordinateSpace: "metaverse.regional-scene",
      spatialQualified: true,
      intelligenceAvailable: true,
      transformAvailability: "NONE",
    },
  ]);
});

test("W8D-WORKSPACE-03 requires Wave 8B and Wave 8C state integration", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_WORKSPACE_INTEGRATION_CONTRACT, {
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
});
