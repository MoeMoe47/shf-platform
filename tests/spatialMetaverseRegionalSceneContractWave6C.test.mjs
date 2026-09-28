import assert from "node:assert/strict";
import test from "node:test";

import {
  getImplementedRegionalSceneSlugs,
  getRegionalSceneBySlug,
  REGIONAL_ROUTE_SEQUENCE,
  validateRegionalSceneRegistry,
} from "../src/system/metaverse/regionalSceneRegistry.js";
import { createSpatialFeatureId } from "../src/shared/spatial/contracts/featureIds.js";

const EXPECTED_MISSING_ADAPTER = "EXPECTED_MISSING_ADAPTER";
const ADAPTER_ENTRY = new URL("../src/system/spatial/adapters/metaverseRegionalSceneAdapter.js", import.meta.url);
const DOMAIN = "metaverse-regional";
const FEATURE_TYPE = "regional-scene";
const SOURCE_AUTHORITY = "silicon-heartland-metaverse-regional-scene-registry";
const SPACE = "metaverse.regional-scene";

async function loadAdapter() {
  try {
    return await import(ADAPTER_ENTRY.href);
  } catch (error) {
    if (error?.code === "ERR_MODULE_NOT_FOUND") {
      throw new Error(`${EXPECTED_MISSING_ADAPTER}: ${ADAPTER_ENTRY.pathname}`);
    }
    throw error;
  }
}

function sourceRecord(overrides = {}) {
  const scene = getRegionalSceneBySlug(overrides.sceneId || "oil-rig");
  return {
    sceneId: scene?.id || overrides.sceneId,
    label: scene?.title,
    coordinateFamily: "METAVERSE",
    coordinateSpaceId: SPACE,
    implementationStatus: scene ? "IMPLEMENTED" : "UNIMPLEMENTED",
    publicationStatus: scene ? "PUBLIC_PRESENTATION" : "UNKNOWN",
    geometry: null,
    provenance: {
      sourceAuthority: SOURCE_AUTHORITY,
      sourceRecordId: scene?.id || overrides.sceneId,
      assetReference: scene?.backgroundAsset?.baseAsset || null,
      projectionVersion: "1",
    },
    ...overrides,
  };
}

test("RSC-01 exposes the planned regional adapter factory", async () => {
  const module = await loadAdapter();
  assert.equal(typeof module.createMetaverseRegionalSceneAdapter, "function");
});

test("RSC-02 freezes the neutral domain", async () => {
  const { createMetaverseRegionalSceneAdapter } = await loadAdapter();
  assert.equal(createMetaverseRegionalSceneAdapter().getDomain(), DOMAIN);
});

test("RSC-03 freezes the regional registry source authority", async () => {
  const { createMetaverseRegionalSceneAdapter } = await loadAdapter();
  assert.equal(createMetaverseRegionalSceneAdapter().getSourceAuthority(), SOURCE_AUTHORITY);
});

test("RSC-04 freezes the single feature type", async () => {
  const { createMetaverseRegionalSceneAdapter } = await loadAdapter();
  assert.deepEqual(createMetaverseRegionalSceneAdapter().getSupportedFeatureTypes(), [FEATURE_TYPE]);
});

test("RSC-05 requires the METAVERSE coordinate family", async () => {
  const { createMetaverseRegionalSceneAdapter } = await loadAdapter();
  assert.deepEqual(createMetaverseRegionalSceneAdapter().getSupportedCoordinateFamilies(), ["METAVERSE"]);
});

test("RSC-06 requires the regional-scene coordinate space", async () => {
  const { createMetaverseRegionalSceneAdapter } = await loadAdapter();
  assert.deepEqual(createMetaverseRegionalSceneAdapter().getSupportedCoordinateSpaces(), [SPACE]);
});

test("RSC-07 rejects REAL_WORLD records", async () => {
  const { createMetaverseRegionalSceneAdapter } = await loadAdapter();
  assert.equal(createMetaverseRegionalSceneAdapter().canProject(sourceRecord({ coordinateFamily: "REAL_WORLD" })), false);
});

test("RSC-08 rejects Quick Map records", async () => {
  const { createMetaverseRegionalSceneAdapter } = await loadAdapter();
  assert.equal(createMetaverseRegionalSceneAdapter().canProject(sourceRecord({ coordinateSpaceId: "metaverse.quick-map" })), false);
});

test("RSC-09 rejects master-city records", async () => {
  const { createMetaverseRegionalSceneAdapter } = await loadAdapter();
  assert.equal(createMetaverseRegionalSceneAdapter().canProject(sourceRecord({ coordinateSpaceId: "metaverse.master-city" })), false);
});

test("RSC-10 uses the exact registry scene ID as source identity", async () => {
  const { createMetaverseRegionalSceneAdapter } = await loadAdapter();
  const adapter = createMetaverseRegionalSceneAdapter();
  assert.equal(adapter.sourceRecordId(sourceRecord({ sceneId: "oil-rig" })), "oil-rig");
});

test("RSC-11 does not use a display label as identity", async () => {
  const { createMetaverseRegionalSceneAdapter } = await loadAdapter();
  assert.equal(createMetaverseRegionalSceneAdapter().sourceRecordId(sourceRecord({ label: "Renamed Oil Rig" })), "oil-rig");
});

test("RSC-12 does not use route position as identity", async () => {
  const { createMetaverseRegionalSceneAdapter } = await loadAdapter();
  assert.equal(createMetaverseRegionalSceneAdapter().sourceRecordId(sourceRecord({ order: 999 })), "oil-rig");
});

test("RSC-13 projects only eligible scene declarations", async () => {
  const { createMetaverseRegionalSceneAdapter } = await loadAdapter();
  const adapter = createMetaverseRegionalSceneAdapter();
  assert.equal(adapter.isEligible(sourceRecord({ sceneId: "oil-rig" })), false, "current registry has no approved scene geometry");
  assert.equal(adapter.isEligible(sourceRecord({ sceneId: "shipping-corridor" })), false);
});

test("RSC-14 rejects an unregistered scene", async () => {
  const { createMetaverseRegionalSceneAdapter } = await loadAdapter();
  assert.equal(createMetaverseRegionalSceneAdapter().canProject(sourceRecord({ sceneId: "invented-scene" })), false);
});

test("RSC-15 keeps route-context-only scenes unimplemented", async () => {
  const { createMetaverseRegionalSceneAdapter } = await loadAdapter();
  assert.ok(REGIONAL_ROUTE_SEQUENCE.some((stop) => stop.id === "shipping-corridor"));
  assert.equal(getRegionalSceneBySlug("shipping-corridor"), null);
  assert.equal(createMetaverseRegionalSceneAdapter().canProject(sourceRecord({ sceneId: "shipping-corridor" })), false);
});

test("RSC-16 requires provenance", async () => {
  const { createMetaverseRegionalSceneAdapter } = await loadAdapter();
  assert.equal(createMetaverseRegionalSceneAdapter().canProject(sourceRecord({ provenance: null })), false);
});

test("RSC-17 does not expose navigation authority", async () => {
  const { createMetaverseRegionalSceneAdapter } = await loadAdapter();
  const output = createMetaverseRegionalSceneAdapter().project(sourceRecord());
  assert.equal(output.navigate, undefined);
  assert.equal(output.nextScene, undefined);
});

test("RSC-18 does not own Traffic, Water, or Transit", async () => {
  const { createMetaverseRegionalSceneAdapter } = await loadAdapter();
  const output = createMetaverseRegionalSceneAdapter().project(sourceRecord());
  for (const field of ["traffic", "water", "transit", "skyBridge"]) assert.equal(output[field], undefined, field);
});

test("RSC-19 does not expose implicit transforms", async () => {
  const module = await loadAdapter();
  assert.equal(module.transformCoordinates, undefined);
  assert.equal(module.calibrateCoordinateSpace, undefined);
});

test("RSC-20 uses the existing deterministic Spatial feature ID helper", async () => {
  const { createMetaverseRegionalSceneAdapter } = await loadAdapter();
  const adapter = createMetaverseRegionalSceneAdapter();
  assert.equal(adapter.featureId("oil-rig"), createSpatialFeatureId({
    domain: DOMAIN,
    featureType: FEATURE_TYPE,
    sourceAuthority: SOURCE_AUTHORITY,
    sourceRecordId: "oil-rig",
  }));
  assert.equal(getImplementedRegionalSceneSlugs().length, 2);
});
