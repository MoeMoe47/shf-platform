import assert from "node:assert/strict";
import test from "node:test";

import {
  COMMAND_CENTER_LAYER_STATE_EVENTS,
  COMMAND_CENTER_QUALIFIED_LAYER_IDS,
  createCommandCenterLayerState,
} from "../src/system/spatial/commandCenter/layerState.js";

test("W8C-LAYER-01 freezes qualified layer IDs from the existing Spatial layer registry", () => {
  assert.deepEqual(COMMAND_CENTER_QUALIFIED_LAYER_IDS, [
    "real-world.counties",
    "metaverse.quick-map.locations",
    "metaverse.regional-scenes",
  ]);
});

test("W8C-LAYER-02 enforces workspace coordinate-space compatibility and fail-closed visibility", () => {
  const layerState = createCommandCenterLayerState({
    workspace: {
      workspaceId: "workspace-quick-map",
      qualifiedClientId: "metaverse-quick-map",
      coordinateFamily: "METAVERSE",
      coordinateSpace: "metaverse.quick-map",
    },
    visibleLayerIds: ["metaverse.quick-map.locations"],
  });

  assert.equal(layerState.ok, true);
  assert.deepEqual(layerState.snapshot.visibleLayerIds, ["metaverse.quick-map.locations"]);
  assert.equal(layerState.setLayerVisibility("metaverse.quick-map.locations", false).ok, true);
  assert.equal(layerState.setLayerVisibility("metaverse.regional-scenes", true).ok, false);
  assert.equal(layerState.setLayerVisibility("metaverse.master-city.traces", true).ok, false);
  assert.equal(layerState.setLayerVisibility("real-world.counties", true).ok, false);
  assert.equal(layerState.setLayerVisibility("unknown.layer", true).ok, false);
});

test("W8C-LAYER-03 exposes immutable presentation-only snapshots without source truth changes", () => {
  assert.deepEqual(COMMAND_CENTER_LAYER_STATE_EVENTS, [
    "LAYER_VISIBILITY_CHANGED",
  ]);

  const layerState = createCommandCenterLayerState({
    workspace: {
      workspaceId: "workspace-iep",
      qualifiedClientId: "iep-ohio-county-map",
      coordinateFamily: "REAL_WORLD",
      coordinateSpace: "real-world.county-geojson",
    },
    visibleLayerIds: ["real-world.counties"],
  });

  assert.equal(Object.isFrozen(layerState.snapshot), true);
  assert.equal(Object.isFrozen(layerState.snapshot.visibleLayerIds), true);
  assert.deepEqual(Object.keys(layerState.snapshot).sort(), [
    "coordinateSpace",
    "visibleLayerIds",
    "workspaceId",
  ]);
  assert.equal("publicationState" in layerState.snapshot, false);
  assert.equal("sourceRecord" in layerState.snapshot, false);
  assert.equal("rawGeometry" in layerState.snapshot, false);
  assert.equal("provenance" in layerState.snapshot, false);
});
