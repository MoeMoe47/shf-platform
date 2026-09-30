import assert from "node:assert/strict";
import test from "node:test";

const SCENE_ID = "oil-rig";
const GEOMETRY_HASH = "201e189ef24d2adb";
const COORDINATE_SPACE = "metaverse.regional-scene";
const FIXTURE_SEARCH = "?metaverseDev=1&spatialIntelligenceFixture=oil-rig-contains-point&metSceneTime=DAY";

async function runtime() {
  return import("../src/system/spatial/clients/regionalScene/RegionalSceneIntelligenceClient.js");
}

test("Wave 7E client wrapper exposes the frozen regional-scene contract", async () => {
  const { createRegionalSceneIntelligenceClient } = await runtime();
  assert.equal(typeof createRegionalSceneIntelligenceClient, "function");
});

test("Oil Rig fixture is enabled only in DEV with the exact fixture name", async () => {
  const { resolveRegionalSceneIntelligenceFixture } = await runtime();
  assert.deepEqual(resolveRegionalSceneIntelligenceFixture({ isDev: true, sceneId: SCENE_ID, search: FIXTURE_SEARCH }), {
    sceneId: SCENE_ID,
    geometryHash: GEOMETRY_HASH,
    coordinateSpace: COORDINATE_SPACE,
    fixture: "oil-rig-contains-point",
  });
});

test("missing DEV mode does not activate the fixture", async () => {
  const { resolveRegionalSceneIntelligenceFixture } = await runtime();
  assert.equal(resolveRegionalSceneIntelligenceFixture({ isDev: false, sceneId: SCENE_ID, search: FIXTURE_SEARCH }), null);
});

test("missing or unknown fixture names fail closed", async () => {
  const { resolveRegionalSceneIntelligenceFixture } = await runtime();
  assert.equal(resolveRegionalSceneIntelligenceFixture({ isDev: true, sceneId: SCENE_ID, search: "?metaverseDev=1" }), null);
  assert.equal(resolveRegionalSceneIntelligenceFixture({ isDev: true, sceneId: SCENE_ID, search: "?metaverseDev=1&spatialIntelligenceFixture=unknown" }), null);
});

test("the fixture does not activate on non-Oil-Rig scenes", async () => {
  const { resolveRegionalSceneIntelligenceFixture } = await runtime();
  assert.equal(resolveRegionalSceneIntelligenceFixture({ isDev: true, sceneId: "open-sea", search: FIXTURE_SEARCH }), null);
});

test("Open Sea remains ineligible for this production-qualified fixture", async () => {
  const { resolveRegionalSceneIntelligenceFixture } = await runtime();
  assert.equal(resolveRegionalSceneIntelligenceFixture({ isDev: true, sceneId: "open-sea", search: FIXTURE_SEARCH }), null);
});

test("the wrapper returns the sanitized Oil Rig CONTAINS result", async () => {
  const { createRegionalSceneIntelligenceClient } = await runtime();
  const client = createRegionalSceneIntelligenceClient({ isDev: true, sceneId: SCENE_ID, search: FIXTURE_SEARCH });
  const result = client.getInspectionResult();
  assert.equal(result.kind, "SPATIAL_INTELLIGENCE");
  assert.equal(result.resultType, "SPATIAL_INTELLIGENCE");
  assert.equal(result.reasoningClass, "GEOMETRIC_FACT");
  assert.equal(result.operation, "RELATIONSHIP");
  assert.equal(result.relationship, "CONTAINS");
  assert.equal(result.value, true);
  assert.equal(result.coordinateSpace, COORDINATE_SPACE);
});

test("the client wrapper exposes no automatic navigation behavior", async () => {
  const { createRegionalSceneIntelligenceClient } = await runtime();
  const client = createRegionalSceneIntelligenceClient({ isDev: true, sceneId: SCENE_ID, search: FIXTURE_SEARCH });
  assert.equal(typeof client.navigate, "undefined");
  assert.equal(typeof client.changeScene, "undefined");
});
