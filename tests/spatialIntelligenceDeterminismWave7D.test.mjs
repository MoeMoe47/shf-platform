import assert from "node:assert/strict";
import test from "node:test";

const request = {
  operation: "RELATIONSHIP",
  relationship: "CONTAINS",
  reasoningClass: "GEOMETRIC_FACT",
  projectedAt: "2026-09-29T12:00:00.000Z",
  left: {
    featureId: "oil-rig",
    coordinateFamily: "METAVERSE",
    coordinateSpace: "metaverse.regional-scene",
    eligible: true,
    visibility: "PUBLIC",
    geometry: { type: "Polygon", coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] },
    provenance: { sourceRecordId: "oil-rig", geometryHash: "201e189ef24d2adb" },
  },
  right: {
    featureId: "scene-local-point",
    coordinateFamily: "METAVERSE",
    coordinateSpace: "metaverse.regional-scene",
    eligible: true,
    visibility: "PUBLIC",
    geometry: { type: "Point", coordinates: [5, 5] },
    provenance: { sourceRecordId: "scene-local-point" },
  },
};

async function runtime() {
  return import("../src/system/spatial/intelligence/reasoning.js");
}

test("same qualified inputs produce the same semantic result", async () => {
  const { evaluateSpatialIntelligence, semanticResult } = await runtime();
  const first = semanticResult(evaluateSpatialIntelligence(request));
  const second = semanticResult(evaluateSpatialIntelligence(request));

  assert.deepEqual(second, first);
});

test("projectedAt may vary without changing semantic reasoning", async () => {
  const { evaluateSpatialIntelligence, semanticResult } = await runtime();
  const first = semanticResult(evaluateSpatialIntelligence({ ...request, projectedAt: "2026-09-29T12:00:00.000Z" }));
  const second = semanticResult(evaluateSpatialIntelligence({ ...request, projectedAt: "2026-09-29T13:00:00.000Z" }));

  assert.deepEqual(second, first);
});

test("deterministic intelligence has no probabilistic confidence or random semantic fields", async () => {
  const { evaluateSpatialIntelligence } = await runtime();
  const result = evaluateSpatialIntelligence(request);

  assert.equal(result.confidence, undefined);
  assert.equal(result.randomSeed, undefined);
  assert.equal(result.wallClockDecision, undefined);
  assert.equal(result.derivation.deterministic, true);
});

test("unknown freshness is preserved and never promoted to CURRENT", async () => {
  const { evaluateSpatialIntelligence } = await runtime();
  const result = evaluateSpatialIntelligence({ ...request, freshnessState: "UNKNOWN" });

  assert.equal(result.freshnessState, "UNKNOWN");
  assert.notEqual(result.freshnessState, "CURRENT");
});
