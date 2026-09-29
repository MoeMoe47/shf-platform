import assert from "node:assert/strict";
import test from "node:test";

const OIL_RIG_COORDINATES = [[
  [95.52457739934192, 20.389571245573055],
  [10.71207896918092, 20.775374877552558],
  [9.104563835932987, 89.83422500188381],
  [95.52457739934192, 89.73777409388893],
  [95.52457739934192, 20.389571245573055],
]];

const scene = {
  featureId: "spatial:metaverse-regional:regional-scene:registry:oil-rig",
  sceneId: "oil-rig",
  coordinateFamily: "METAVERSE",
  coordinateSpace: "metaverse.regional-scene",
  eligible: true,
  visibility: "PUBLIC",
  geometry: { type: "Polygon", coordinates: OIL_RIG_COORDINATES },
  provenance: { geometryHash: "201e189ef24d2adb", sourceRecordId: "oil-rig" },
};

const pointInside = {
  featureId: "spatial:metaverse-regional:point:registry:scene-local-point",
  coordinateFamily: "METAVERSE",
  coordinateSpace: "metaverse.regional-scene",
  eligible: true,
  visibility: "PUBLIC",
  geometry: { type: "Point", coordinates: [50, 50] },
  provenance: { sourceRecordId: "scene-local-point" },
};

const pointOnBoundary = {
  ...pointInside,
  featureId: "spatial:metaverse-regional:point:registry:boundary-point",
  geometry: { type: "Point", coordinates: [95.52457739934192, 20.389571245573055] },
};

const pointOutside = {
  ...pointInside,
  featureId: "spatial:metaverse-regional:point:registry:outside-point",
  geometry: { type: "Point", coordinates: [0, 0] },
};

async function runtime() {
  return import("../src/system/spatial/intelligence/relationships.js");
}

test("relationship vocabulary is frozen to the Wave 7C set", async () => {
  const { RELATIONSHIP_TYPES } = await runtime();

  assert.deepEqual(Object.values(RELATIONSHIP_TYPES).sort(), [
    "ADJACENT_TO",
    "CONTAINS",
    "DISJOINT",
    "INTERSECTS",
    "OVERLAPS",
    "SAME_LOCATION",
    "TOUCHES",
    "WITHIN",
  ]);
});

test("approved Oil Rig Polygon CONTAINS a same-space scene-local Point", async () => {
  const { evaluateRelationship } = await runtime();
  const result = evaluateRelationship(scene, pointInside, "CONTAINS");

  assert.equal(result.ok, true);
  assert.equal(result.relationship, "CONTAINS");
  assert.equal(result.resultType, "GEOMETRIC_FACT");
});

test("same-space Point WITHIN Polygon is the inverse geometric fact", async () => {
  const { evaluateRelationship } = await runtime();
  const result = evaluateRelationship(pointInside, scene, "WITHIN");

  assert.equal(result.ok, true);
  assert.equal(result.relationship, "WITHIN");
});

test("strictly outside Point is DISJOINT from the Oil Rig Polygon", async () => {
  const { evaluateRelationship } = await runtime();
  const result = evaluateRelationship(scene, pointOutside, "DISJOINT");

  assert.equal(result.ok, true);
  assert.equal(result.relationship, "DISJOINT");
});

test("boundary Point is not classified as strictly contained", async () => {
  const { evaluateRelationship } = await runtime();
  const contains = evaluateRelationship(scene, pointOnBoundary, "CONTAINS");
  const touches = evaluateRelationship(scene, pointOnBoundary, "TOUCHES");

  assert.equal(contains.ok, false);
  assert.equal(touches.ok, true);
  assert.equal(touches.relationship, "TOUCHES");
});

test("Polygon and Polygon support the bounded topology vocabulary", async () => {
  const { evaluateRelationship } = await runtime();
  const overlapping = { ...scene, featureId: "spatial:metaverse-regional:polygon:registry:overlap", geometry: {
    type: "Polygon",
    coordinates: [[[50, 40], [100, 40], [100, 70], [50, 70], [50, 40]]],
  } };

  for (const relationship of ["INTERSECTS", "OVERLAPS", "TOUCHES", "DISJOINT", "CONTAINS", "WITHIN"]) {
    const result = evaluateRelationship(scene, overlapping, relationship);
    assert.equal(result.relationship, relationship);
  }
});

test("same inputs and geometry versions produce deterministic results", async () => {
  const { evaluateRelationship } = await runtime();
  const first = evaluateRelationship(scene, pointInside, "CONTAINS");
  const second = evaluateRelationship(scene, pointInside, "CONTAINS");

  assert.deepEqual(second, first);
});

test("invalid or ineligible operands fail closed", async () => {
  const { evaluateRelationship } = await runtime();
  const result = evaluateRelationship({ ...scene, eligible: false }, pointInside, "CONTAINS");

  assert.equal(result.ok, false);
});

test("SAME_LOCATION uses geometry equivalence, never labels", async () => {
  const { evaluateRelationship } = await runtime();
  const sameGeometry = { ...pointInside, label: "different label" };
  const same = evaluateRelationship(pointInside, sameGeometry, "SAME_LOCATION");
  const labelOnly = evaluateRelationship(pointInside, { ...pointOutside, label: pointInside.label }, "SAME_LOCATION");

  assert.equal(same.ok, true);
  assert.equal(labelOnly.ok, false);
});

test("ADJACENT_TO is explicitly unsupported when V1 tooling cannot prove it", async () => {
  const { evaluateRelationship } = await runtime();
  const result = evaluateRelationship(scene, pointInside, "ADJACENT_TO");

  assert.equal(result.ok, false);
  assert.equal(result.reason, "UNSUPPORTED_IN_V1");
});

test("relationship output is a geometric fact and cannot grant domain authority", async () => {
  const { evaluateRelationship } = await runtime();
  const result = evaluateRelationship(scene, pointInside, "CONTAINS");

  assert.equal(result.resultType, "GEOMETRIC_FACT");
  assert.equal(result.domainFact, undefined);
  assert.equal(result.policyDecision, undefined);
  assert.equal(result.publicationAuthority, undefined);
});

test("hidden, restricted, and unpublished operands fail closed without leaking identifiers", async () => {
  const { evaluateRelationship } = await runtime();

  for (const visibility of ["HIDDEN", "RESTRICTED"]) {
    const result = evaluateRelationship({ ...scene, visibility }, pointInside, "CONTAINS");
    assert.equal(result.ok, false);
    assert.equal(result.featureId, undefined);
  }
  const unpublished = evaluateRelationship({ ...scene, publicationState: "NOT_PUBLISHED" }, pointInside, "CONTAINS");
  assert.equal(unpublished.ok, false);
  assert.equal(unpublished.featureId, undefined);
});
