import assert from "node:assert/strict";
import test from "node:test";

const baseFeature = {
  featureId: "spatial:test:feature:authority:record",
  coordinateFamily: "METAVERSE",
  coordinateSpace: "metaverse.regional-scene",
  eligible: true,
  visibility: "PUBLIC",
  geometry: { type: "Point", coordinates: [50, 50] },
  provenance: { sourceRecordId: "record" },
};

async function runtime() {
  return import("../src/system/spatial/intelligence/relationships.js");
}

async function assertRejected(left, right) {
  const { evaluateRelationship } = await runtime();
  const result = evaluateRelationship(left, right, "SAME_LOCATION");

  assert.equal(result.ok, false);
  assert.match(result.reason, /coordinate space|transform|compatible/i);
  assert.equal(result.featureId, undefined);
}

test("regional-scene rejects Quick Map relationships", async () => {
  await assertRejected(baseFeature, { ...baseFeature, coordinateSpace: "metaverse.quick-map" });
});

test("regional-scene rejects master-city relationships", async () => {
  await assertRejected(baseFeature, { ...baseFeature, coordinateSpace: "metaverse.master-city" });
});

test("regional-scene rejects camera-world relationships", async () => {
  await assertRejected(baseFeature, { ...baseFeature, coordinateSpace: "metaverse.camera-world" });
});

test("METAVERSE rejects REAL_WORLD relationships", async () => {
  await assertRejected(baseFeature, {
    ...baseFeature,
    coordinateFamily: "REAL_WORLD",
    coordinateSpace: "real-world.latlng",
  });
});

test("county GeoJSON rejects lat/lng relationships without an approved compatibility rule", async () => {
  await assertRejected({
    ...baseFeature,
    coordinateFamily: "REAL_WORLD",
    coordinateSpace: "real-world.county-geojson",
    geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] },
  }, {
    ...baseFeature,
    coordinateFamily: "REAL_WORLD",
    coordinateSpace: "real-world.latlng",
  });
});

test("cross-space rejection does not create an implicit transform", async () => {
  const { evaluateRelationship } = await runtime();
  const result = evaluateRelationship(baseFeature, { ...baseFeature, coordinateSpace: "metaverse.quick-map" }, "CONTAINS");

  assert.equal(result.ok, false);
  assert.equal(result.transformApplied, undefined);
  assert.equal(result.transformAuthority, undefined);
});
