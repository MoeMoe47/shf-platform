import assert from "node:assert/strict";
import test from "node:test";

async function runtime() {
  return import("../src/system/spatial/clients/regionalScene/RegionalSceneIntelligenceClient.js");
}

test("client exposes only geometric or presentation reasoning", async () => {
  const { ALLOWED_CLIENT_REASONING_CLASSES } = await runtime();
  assert.deepEqual(ALLOWED_CLIENT_REASONING_CLASSES, ["GEOMETRIC_FACT", "PRESENTATION_DERIVATION"]);
});

test("client rejects domain and policy authority requests", async () => {
  const { requestRegionalSceneIntelligence } = await runtime();
  for (const reasoningClass of ["DOMAIN_FACT", "POLICY_DECISION"]) {
    const result = requestRegionalSceneIntelligence({ reasoningClass, operation: "RELATIONSHIP" });
    assert.equal(result.ok, false);
  }
});

test("fixture activation does not navigate or change the scene route", async () => {
  const { createRegionalSceneIntelligenceClient } = await runtime();
  const client = createRegionalSceneIntelligenceClient({ isDev: true, sceneId: "oil-rig", search: "?metaverseDev=1&spatialIntelligenceFixture=oil-rig-contains-point" });
  const result = client.activateInspection();
  assert.equal(result.ok, true);
  assert.equal(result.navigate, undefined);
  assert.equal(result.sceneTransition, undefined);
});

test("fixture activation cannot change geometry or coordinate space", async () => {
  const { createRegionalSceneIntelligenceClient } = await runtime();
  const client = createRegionalSceneIntelligenceClient({ isDev: true, sceneId: "oil-rig", search: "?metaverseDev=1&spatialIntelligenceFixture=oil-rig-contains-point" });
  const result = client.activateInspection();
  assert.equal(result.geometryMutation, undefined);
  assert.equal(result.coordinateSpace, "metaverse.regional-scene");
});

test("fixture output cannot create publication or authorization authority", async () => {
  const { createRegionalSceneIntelligenceClient } = await runtime();
  const result = createRegionalSceneIntelligenceClient({ isDev: true, sceneId: "oil-rig", search: "?metaverseDev=1&spatialIntelligenceFixture=oil-rig-contains-point" }).getInspectionResult();
  for (const field of ["publicationAuthority", "authorization", "eligibilityDecision", "policyDecision", "metricTruth"]) {
    assert.equal(result[field], undefined, field);
  }
});

test("fixture output cannot establish domain assignments or service areas", async () => {
  const { createRegionalSceneIntelligenceClient } = await runtime();
  const result = createRegionalSceneIntelligenceClient({ isDev: true, sceneId: "oil-rig", search: "?metaverseDev=1&spatialIntelligenceFixture=oil-rig-contains-point" }).getInspectionResult();
  assert.equal(result.domainFact, undefined);
  assert.equal(result.serviceArea, undefined);
  assert.equal(result.jurisdiction, undefined);
  assert.equal(result.dispatchDecision, undefined);
});

test("client does not expose cross-space transform behavior", async () => {
  const module = await runtime();
  for (const name of ["transformCoordinates", "convertQuickMapCoordinates", "convertMasterCityCoordinates"]) {
    assert.equal(module[name], undefined, name);
  }
});

test("client inspection remains presentation-only", async () => {
  const { createRegionalSceneIntelligenceClient } = await runtime();
  const result = createRegionalSceneIntelligenceClient({ isDev: true, sceneId: "oil-rig", search: "?metaverseDev=1&spatialIntelligenceFixture=oil-rig-contains-point" }).getInspectionResult();
  assert.equal(result.authorityBoundary, "GEOMETRIC_FACT_ONLY");
  assert.equal(result.navigationAuthority, undefined);
});
