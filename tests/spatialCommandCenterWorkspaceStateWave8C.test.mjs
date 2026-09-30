import assert from "node:assert/strict";
import test from "node:test";

import {
  COMMAND_CENTER_WORKSPACE_EVENTS,
  COMMAND_CENTER_WORKSPACE_STATE_ALLOWED_FIELDS,
  COMMAND_CENTER_WORKSPACE_STATUS,
  createCommandCenterWorkspaceState,
} from "../src/system/spatial/commandCenter/workspaceState.js";

test("W8C-WORKSPACE-01 freezes qualified workspace identity and coordinate space binding", () => {
  const state = createCommandCenterWorkspaceState({
    workspaces: [
      {
        workspaceId: "workspace-iep",
        qualifiedClientId: "iep-ohio-county-map",
        coordinateFamily: "REAL_WORLD",
        coordinateSpace: "real-world.county-geojson",
      },
      {
        workspaceId: "workspace-quick-map",
        qualifiedClientId: "metaverse-quick-map",
        coordinateFamily: "METAVERSE",
        coordinateSpace: "metaverse.quick-map",
      },
      {
        workspaceId: "workspace-oil-rig",
        qualifiedClientId: "metaverse-regional-scene-oil-rig",
        coordinateFamily: "METAVERSE",
        coordinateSpace: "metaverse.regional-scene",
      },
    ],
    activeWorkspaceId: "workspace-quick-map",
  });

  assert.deepEqual(COMMAND_CENTER_WORKSPACE_STATE_ALLOWED_FIELDS, [
    "workspaceId",
    "qualifiedClientId",
    "coordinateFamily",
    "coordinateSpace",
    "active",
    "visibleLayerIds",
    "selectedFeatureId",
    "highlightedFeatureIds",
    "panelState",
    "status",
  ]);
  assert.deepEqual(state.workspaces.map((workspace) => ({
    workspaceId: workspace.workspaceId,
    qualifiedClientId: workspace.qualifiedClientId,
    coordinateSpace: workspace.coordinateSpace,
    active: workspace.active,
    status: workspace.status,
  })), [
    {
      workspaceId: "workspace-iep",
      qualifiedClientId: "iep-ohio-county-map",
      coordinateSpace: "real-world.county-geojson",
      active: false,
      status: COMMAND_CENTER_WORKSPACE_STATUS.AVAILABLE,
    },
    {
      workspaceId: "workspace-quick-map",
      qualifiedClientId: "metaverse-quick-map",
      coordinateSpace: "metaverse.quick-map",
      active: true,
      status: COMMAND_CENTER_WORKSPACE_STATUS.AVAILABLE,
    },
    {
      workspaceId: "workspace-oil-rig",
      qualifiedClientId: "metaverse-regional-scene-oil-rig",
      coordinateSpace: "metaverse.regional-scene",
      active: false,
      status: COMMAND_CENTER_WORKSPACE_STATUS.AVAILABLE,
    },
  ]);
});

test("W8C-WORKSPACE-02 rejects unqualified, unavailable, unknown, and incompatible workspaces", () => {
  assert.equal(createCommandCenterWorkspaceState({
    workspaces: [{
      workspaceId: "workspace-odot",
      qualifiedClientId: "odot",
      coordinateFamily: "REAL_WORLD",
      coordinateSpace: "real-world.latlng",
    }],
  }).ok, false);

  assert.equal(createCommandCenterWorkspaceState({
    workspaces: [{
      workspaceId: "workspace-open-sea",
      qualifiedClientId: "metaverse-regional-scene-open-sea",
      coordinateFamily: "METAVERSE",
      coordinateSpace: "metaverse.regional-scene",
    }],
  }).ok, false);

  assert.equal(createCommandCenterWorkspaceState({
    workspaces: [{
      workspaceId: "workspace-quick-map-wrong-space",
      qualifiedClientId: "metaverse-quick-map",
      coordinateFamily: "METAVERSE",
      coordinateSpace: "metaverse.regional-scene",
    }],
  }).ok, false);
});

test("W8C-WORKSPACE-03 keeps active workspace changes deterministic and presentation-only", () => {
  assert.deepEqual(COMMAND_CENTER_WORKSPACE_EVENTS, [
    "WORKSPACE_ACTIVATED",
  ]);

  const state = createCommandCenterWorkspaceState({
    workspaces: [
      {
        workspaceId: "workspace-quick-map",
        qualifiedClientId: "metaverse-quick-map",
        coordinateFamily: "METAVERSE",
        coordinateSpace: "metaverse.quick-map",
        selectedFeatureId: "spatial:metaverse:location:quick-map-a",
        highlightedFeatureIds: ["spatial:metaverse:location:quick-map-a"],
      },
      {
        workspaceId: "workspace-oil-rig",
        qualifiedClientId: "metaverse-regional-scene-oil-rig",
        coordinateFamily: "METAVERSE",
        coordinateSpace: "metaverse.regional-scene",
      },
    ],
    activeWorkspaceId: "workspace-quick-map",
  });

  const result = state.activateWorkspace("workspace-oil-rig");

  assert.equal(result.ok, true);
  assert.equal(result.snapshot.activeWorkspaceId, "workspace-oil-rig");
  assert.equal(result.snapshot.workspaces.find((workspace) => workspace.workspaceId === "workspace-oil-rig").selectedFeatureId, null);
  assert.equal(result.snapshot.workspaces.find((workspace) => workspace.workspaceId === "workspace-quick-map").selectedFeatureId, "spatial:metaverse:location:quick-map-a");
  assert.equal("navigationTarget" in result, false);
  assert.equal("coordinateTransform" in result, false);
  assert.equal("domainMutation" in result, false);
});
