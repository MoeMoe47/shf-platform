import assert from "node:assert/strict";
import test from "node:test";

const NOW = "2026-09-29T12:00:00.000Z";
const scene = {
  featureId: "spatial:metaverse-regional:regional-scene:registry:oil-rig",
  sceneId: "oil-rig",
  coordinateFamily: "METAVERSE",
  coordinateSpace: "metaverse.regional-scene",
  eligible: true,
  visibility: "PUBLIC",
  geometry: { type: "Polygon", coordinates: [[[95.52457739934192, 20.389571245573055], [10.71207896918092, 20.775374877552558], [9.104563835932987, 89.83422500188381], [95.52457739934192, 89.73777409388893], [95.52457739934192, 20.389571245573055]]] },
  provenance: { sourceRecordId: "oil-rig", geometryHash: "201e189ef24d2adb" },
};
const point = {
  featureId: "spatial:metaverse-regional:point:registry:scene-local-point",
  coordinateFamily: "METAVERSE",
  coordinateSpace: "metaverse.regional-scene",
  eligible: true,
  visibility: "PUBLIC",
  geometry: { type: "Point", coordinates: [50, 50] },
  provenance: { sourceRecordId: "scene-local-point" },
};

async function runtime() {
  return import("../src/system/spatial/intelligence/reasoning.js");
}

function request(overrides = {}) {
  return {
    operation: "RELATIONSHIP",
    relationship: "CONTAINS",
    reasoningClass: "GEOMETRIC_FACT",
    left: scene,
    right: point,
    projectedAt: NOW,
    evidenceReferences: [{ sourceAuthority: "silicon-heartland-metaverse-regional-geometry-registry", sourceRecordId: "oil-rig" }],
    ...overrides,
  };
}

test("Oil Rig Polygon CONTAINS scene-local Point as a governed result", async () => {
  const { evaluateSpatialIntelligence } = await runtime();
  const result = evaluateSpatialIntelligence(request());

  assert.equal(result.ok, true);
  assert.equal(result.resultType, "SPATIAL_INTELLIGENCE");
  assert.equal(result.reasoningClass, "GEOMETRIC_FACT");
  assert.equal(result.relationship, "CONTAINS");
  assert.equal(result.value, true);
  assert.equal(result.coordinateSpace, "metaverse.regional-scene");
});

test("result composes evidence, temporal context, freshness, and derivation metadata", async () => {
  const { evaluateSpatialIntelligence } = await runtime();
  const result = evaluateSpatialIntelligence(request({ freshnessState: "CURRENT" }));

  assert.ok(Array.isArray(result.evidenceReferences));
  assert.equal(result.temporalContext.projectedAt, NOW);
  assert.equal(result.freshnessState, "CURRENT");
  assert.equal(result.derivation.deterministic, true);
  assert.equal(result.authorityBoundary, "GEOMETRIC_FACT_ONLY");
});

test("reasoning result does not expose probabilistic confidence for deterministic topology", async () => {
  const { evaluateSpatialIntelligence } = await runtime();
  const result = evaluateSpatialIntelligence(request());

  assert.equal(result.confidence, undefined);
});

test("cross-space reasoning fails closed without transform fallback", async () => {
  const { evaluateSpatialIntelligence } = await runtime();
  const result = evaluateSpatialIntelligence(request({ right: { ...point, coordinateSpace: "metaverse.quick-map" } }));

  assert.equal(result.ok, false);
  assert.match(result.reason, /coordinate space|transform/i);
});

test("unsupported ADJACENT_TO reasoning fails closed", async () => {
  const { evaluateSpatialIntelligence } = await runtime();
  const result = evaluateSpatialIntelligence(request({ relationship: "ADJACENT_TO" }));

  assert.equal(result.ok, false);
  assert.equal(result.reason, "UNSUPPORTED_IN_V1");
});

test("reasoning references source evidence without cloning source records", async () => {
  const { evaluateSpatialIntelligence } = await runtime();
  const result = evaluateSpatialIntelligence(request({ sourceRecord: { secret: "must not copy" } }));

  assert.equal(result.sourceRecord, undefined);
  assert.equal(result.geometry, undefined);
  assert.ok(Array.isArray(result.evidenceReferences));
});

test("invalid, ineligible, or unpublished inputs fail closed", async () => {
  const { evaluateSpatialIntelligence } = await runtime();
  for (const left of [
    { ...scene, eligible: false },
    { ...scene, publicationState: "NOT_PUBLISHED" },
    { ...scene, geometry: null },
  ]) {
    const result = evaluateSpatialIntelligence(request({ left }));
    assert.equal(result.ok, false);
  }
});

test("result limitations preserve the no-navigation boundary", async () => {
  const { evaluateSpatialIntelligence } = await runtime();
  const result = evaluateSpatialIntelligence(request());

  assert.ok(Array.isArray(result.limitations));
  assert.equal(result.navigationAuthority, undefined);
  assert.equal(result.policyDecision, undefined);
});
