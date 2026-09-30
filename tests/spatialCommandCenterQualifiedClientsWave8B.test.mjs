import assert from "node:assert/strict";
import test from "node:test";

import {
  SPATIAL_COMMAND_CENTER_QUALIFIED_CLIENTS_V1,
  SPATIAL_COMMAND_CENTER_QUALIFIED_INTELLIGENCE_V1,
} from "../src/system/spatial/commandCenter/qualifiedClientRegistry.js";

test("W8B-QUAL-01 freezes exactly the current Spatial V1 qualified clients", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_QUALIFIED_CLIENTS_V1.map((client) => client.id), [
    "iep-ohio-county-map",
    "metaverse-quick-map",
    "metaverse-regional-scene-oil-rig",
  ]);
});

test("W8B-QUAL-02 freezes client qualification labels and coordinate spaces", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_QUALIFIED_CLIENTS_V1.map((client) => ({
    id: client.id,
    label: client.label,
    coordinateSpace: client.coordinateSpace,
    active: client.active,
  })), [
    {
      id: "iep-ohio-county-map",
      label: "IEP Ohio County Map",
      coordinateSpace: "real-world.county-geojson",
      active: true,
    },
    {
      id: "metaverse-quick-map",
      label: "Metaverse Quick Map",
      coordinateSpace: "metaverse.quick-map",
      active: true,
    },
    {
      id: "metaverse-regional-scene-oil-rig",
      label: "Metaverse Regional Scene - Oil Rig",
      coordinateSpace: "metaverse.regional-scene",
      active: true,
    },
  ]);
});

test("W8B-QUAL-03 freezes governed intelligence qualification to Oil Rig only", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_QUALIFIED_INTELLIGENCE_V1, [
    {
      clientId: "metaverse-regional-scene-oil-rig",
      label: "Metaverse Regional Scene - Oil Rig",
      coordinateSpace: "metaverse.regional-scene",
      intelligenceQualified: true,
    },
  ]);
});

test("W8B-QUAL-04 excludes ODOT, Open Sea, deferred systems, and blocked systems", () => {
  const qualifiedIds = SPATIAL_COMMAND_CENTER_QUALIFIED_CLIENTS_V1.map((client) => client.id);
  assert.equal(qualifiedIds.includes("odot"), false);
  assert.equal(qualifiedIds.includes("metaverse-regional-scene-open-sea"), false);
  assert.equal(qualifiedIds.some((id) => id.includes("deferred") || id.includes("blocked")), false);
  assert.equal(SPATIAL_COMMAND_CENTER_QUALIFIED_CLIENTS_V1.some((client) => client.intelligenceQualified === true && client.id !== "metaverse-regional-scene-oil-rig"), false);
});
