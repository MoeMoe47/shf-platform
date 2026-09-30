import assert from "node:assert/strict";
import test from "node:test";

import {
  SPATIAL_COMMAND_CENTER_ROUTE,
  SPATIAL_COMMAND_CENTER_UI_FILES,
  SPATIAL_COMMAND_CENTER_UI_LAYOUT_CONTRACT,
  SPATIAL_COMMAND_CENTER_UI_ROUTE_CONTRACT,
} from "../src/pages/spatial-command-center/SpatialCommandCenterPage.jsx";

test("W8D-UI-ARCH-01 freezes the future page route and implementation boundary", () => {
  assert.equal(SPATIAL_COMMAND_CENTER_ROUTE, "/spatial-command-center");
  assert.deepEqual(SPATIAL_COMMAND_CENTER_UI_FILES, [
    "src/pages/spatial-command-center/SpatialCommandCenterPage.jsx",
    "src/components/spatial-command-center/SpatialWorkspaceSwitcher.jsx",
    "src/components/spatial-command-center/SpatialWorkspaceHeader.jsx",
    "src/components/spatial-command-center/SpatialContextPanel.jsx",
    "src/components/spatial-command-center/workspaces/IepSpatialWorkspace.jsx",
    "src/components/spatial-command-center/workspaces/QuickMapSpatialWorkspace.jsx",
    "src/components/spatial-command-center/workspaces/OilRigSpatialWorkspace.jsx",
  ]);
});

test("W8D-UI-ARCH-02 freezes institutional layout boundaries without a dense dashboard", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_UI_LAYOUT_CONTRACT, {
    left: "compact workspace switcher",
    center: "dominant spatial workspace canvas",
    right: "temporary contextual panel",
    top: "coordinate-space and qualification context",
    bottom: "compact safe system status",
    avoidsDenseDashboard: true,
    avoidsDecorativeTelemetryCards: true,
    spatialCanvasDominant: true,
  });
});

test("W8D-UI-ARCH-03 freezes route behavior as future-only and non-colliding", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_UI_ROUTE_CONTRACT, {
    route: "/spatial-command-center",
    implementedInWave8DContractPhase: false,
    doesNotCollideWithExchangeCommandCenter: true,
    doesNotCollideWithShfCommandCenter: true,
    doesNotCollideWithIepCommandCenter: true,
    noProductionRouteCreatedByContract: true,
  });
});
