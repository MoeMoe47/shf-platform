import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { MINIMAP_LOCATION_REGISTRY } from "../src/system/metaverse/metaverseMiniMapRegistry.js";
import { resolveCountyFromEntity } from "../src/system/resolvers/entityToCounty.js";

const registrySource = readFileSync(new URL("../src/system/metaverse/metaverseMiniMapRegistry.js", import.meta.url), "utf8");

test("W5B Quick Map preserves nine unmapped districts and six provisional infrastructure markers", () => {
  assert.equal(MINIMAP_LOCATION_REGISTRY.length, 15);
  assert.equal(MINIMAP_LOCATION_REGISTRY.filter((entry) => entry.category === "DISTRICT").length, 9);
  assert.equal(MINIMAP_LOCATION_REGISTRY.filter((entry) => entry.category === "INFRASTRUCTURE").length, 6);
  assert.equal(MINIMAP_LOCATION_REGISTRY.filter((entry) => entry.status === "UNMAPPED").length, 9);
  assert.equal(MINIMAP_LOCATION_REGISTRY.filter((entry) => entry.status === "PROVISIONAL").length, 6);
});

test("W5B Quick Map records no confirmed source mappings", () => {
  assert.match(registrySource, /CONFIRMED_DISTRICT_QUICK_MAP_MAPPINGS = Object\.freeze\(\[\]\)/);
  assert.equal(MINIMAP_LOCATION_REGISTRY.every((entry) => !entry.sourceAuthority), true);
});

test("W5B Quick Map does not turn destination references into source record IDs", () => {
  assert.equal(MINIMAP_LOCATION_REGISTRY.filter((entry) => entry.category === "INFRASTRUCTURE").every((entry) => entry.destinationId === null), true);
  assert.equal(MINIMAP_LOCATION_REGISTRY.filter((entry) => entry.category === "DISTRICT").every((entry) => entry.x === null && entry.y === null), true);
});

test("W5B Quick Map coordinate space remains separate from master-city", () => {
  assert.match(registrySource, /coordinateSpaceId: "quick-map"/);
  assert.match(registrySource, /SEPARATE coordinate space from METAVERSE_DISTRICTS/);
});

test("W5B known Franklin fallback defect is observable and isolated", () => {
  assert.equal(resolveCountyFromEntity("unknown-shf-entity"), "franklin");
  assert.match(readFileSync(new URL("../src/system/resolvers/entityToCounty.js", import.meta.url), "utf8"), /return "franklin"/);
});

test("W5B no legacy map record is silently promoted into a Spatial feature", () => {
  assert.equal(MINIMAP_LOCATION_REGISTRY.every((entry) => !entry.sourceRecordId && !entry.provenance), true);
});
