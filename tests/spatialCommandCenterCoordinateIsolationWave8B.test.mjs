import assert from "node:assert/strict";
import test from "node:test";

import {
  COMMAND_CENTER_CROSS_SPACE_REJECTIONS,
  COMMAND_CENTER_SPATIAL_COORDINATE_SPACES_V1,
  COMMAND_CENTER_TRANSFORM_POLICY,
} from "../src/system/spatial/commandCenter/coordinateIsolation.js";

test("W8B-COORD-01 freezes the current Spatial coordinate spaces", () => {
  assert.deepEqual(COMMAND_CENTER_SPATIAL_COORDINATE_SPACES_V1, [
    "real-world.latlng",
    "real-world.county-geojson",
    "metaverse.quick-map",
    "metaverse.master-city",
    "metaverse.regional-scene",
    "metaverse.camera-world",
  ]);
});

test("W8B-COORD-02 freezes transform availability as NONE", () => {
  assert.deepEqual(COMMAND_CENTER_TRANSFORM_POLICY, {
    transformAvailability: "NONE",
    transformAuthority: null,
    commandCenterMayTransform: false,
  });
});

test("W8B-COORD-03 rejects implicit operations across incompatible coordinate spaces", () => {
  assert.deepEqual(COMMAND_CENTER_CROSS_SPACE_REJECTIONS, [
    "coordinate conversion",
    "cross-space geometry overlay",
    "CONTAINS",
    "WITHIN",
    "INTERSECTS",
    "OVERLAPS",
    "TOUCHES",
    "SAME_LOCATION",
    "distance",
    "cursor synchronization",
  ]);
});
