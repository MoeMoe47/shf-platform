import assert from "node:assert/strict";
import test from "node:test";

import {
  getImplementedRegionalSceneSlugs,
  getRegionalSceneBySlug,
  REGIONAL_ROUTE_SEQUENCE,
  validateRegionalSceneRegistry,
} from "../src/system/metaverse/regionalSceneRegistry.js";
import {
  getRegionalGeometryRegistryEntry,
  getRegionalSpatialEligibility,
} from "../src/system/metaverse/regionalGeometry/regionalSceneGeometryRegistry.js";
import { createSpatialFeatureId } from "../src/shared/spatial/contracts/featureIds.js";
import { validateSpatialFeature } from "../src/shared/spatial/contracts/validation.js";
import { defaultCoordinateSpaceRegistry } from "../src/shared/spatial/registries/defaultCoordinateSpaces.js";
import { createDefaultSpatialLayerRegistry } from "../src/shared/spatial/registries/defaultLayers.js";
import {
  METAVERSE_REGIONAL_SCENE_COORDINATE_SPACE,
  METAVERSE_REGIONAL_SCENE_DOMAIN,
  METAVERSE_REGIONAL_SCENE_FEATURE_TYPE,
  METAVERSE_REGIONAL_SCENE_LAYER_ID,
  METAVERSE_REGIONAL_SCENE_PROJECTION_VERSION,
  METAVERSE_REGIONAL_SCENE_SOURCE_AUTHORITY,
  createMetaverseRegionalSceneAdapter,
} from "../src/system/spatial/adapters/metaverseRegionalSceneAdapter.js";
import { createProjectionAdapterRegistry, createSpatialProjectionPipeline } from "../src/system/spatial/projection/index.js";

const DOMAIN = "metaverse-regional";
const FEATURE_TYPE = "regional-scene";
const SOURCE_AUTHORITY = "silicon-heartland-metaverse-regional-scene-registry";
const GEOMETRY_AUTHORITY = "silicon-heartland-metaverse-regional-geometry-registry";
const SPACE = "metaverse.regional-scene";
const HASH = "201e189ef24d2adb";
const FEATURE_ID = "spatial:metaverse-regional:regional-scene:silicon-heartland-metaverse-regional-scene-registry:oil-rig";
const EXACT_COORDINATES = [
  [
    [95.52457739934192, 20.389571245573055],
    [10.71207896918092, 20.775374877552558],
    [9.104563835932987, 89.83422500188381],
    [95.52457739934192, 89.73777409388893],
    [95.52457739934192, 20.389571245573055],
  ],
];

function sourceRecord(overrides = {}) {
  const sceneId = overrides.sceneId || "oil-rig";
  const scene = getRegionalSceneBySlug(sceneId);
  const geometry = scene ? getRegionalGeometryRegistryEntry(scene.id) : null;
  const geometryProvenance = geometry?.provenance || null;
  return {
    domain: DOMAIN,
    featureType: FEATURE_TYPE,
    sourceAuthority: SOURCE_AUTHORITY,
    sourceRecordId: scene?.id || sceneId,
    sceneId: scene?.id || sceneId,
    label: scene?.title,
    coordinateFamily: "METAVERSE",
    coordinateSpaceId: SPACE,
    implementationStatus: scene ? "IMPLEMENTED" : "UNIMPLEMENTED",
    publicationStatus: scene ? "PUBLIC_PRESENTATION" : "UNKNOWN",
    geometry: null,
    geometryType: geometry?.geometryType,
    geometryHash: geometry?.geometryHash,
    geometryLifecycle: geometry?.lifecycle,
    compositionFamilyId: geometry?.compositionFamilyId,
    assetFamilyHash: geometry?.assetFamilyHash,
    geometryProvenance,
    provenance: {
      sourceAuthority: SOURCE_AUTHORITY,
      sourceRecordId: scene?.id || sceneId,
      assetReference: scene?.backgroundAsset?.baseAsset || null,
      projectionVersion: "1",
    },
    ...overrides,
  };
}

function adapter() {
  return createMetaverseRegionalSceneAdapter();
}

function runtime() {
  const adapterRegistry = createProjectionAdapterRegistry();
  assert.equal(adapterRegistry.register(adapter()).ok, true);
  const layerRegistry = createDefaultSpatialLayerRegistry({ coordinateRegistry: defaultCoordinateSpaceRegistry });
  return createSpatialProjectionPipeline({
    adapterRegistry,
    coordinateRegistry: defaultCoordinateSpaceRegistry,
    layerRegistry,
    clock: () => new Date("2026-09-29T12:00:00.000Z"),
  });
}

test("RSC-01 registers the production regional scene adapter", () => {
  const registry = createProjectionAdapterRegistry();
  const registration = registry.register(adapter());
  assert.equal(registration.ok, true);
  assert.equal(registry.getAdapter(DOMAIN, FEATURE_TYPE).ok, true);
});

test("RSC-02 freezes the exact adapter identity", () => {
  const candidate = adapter();
  assert.equal(candidate.getDomain(), DOMAIN);
  assert.equal(candidate.getSourceAuthority(), SOURCE_AUTHORITY);
  assert.deepEqual(candidate.getSupportedFeatureTypes(), [FEATURE_TYPE]);
  assert.deepEqual(candidate.getSupportedCoordinateFamilies(), ["METAVERSE"]);
  assert.deepEqual(candidate.getSupportedCoordinateSpaces(), [SPACE]);
  assert.equal(candidate.getProjectionVersion(), "1");
});

test("RSC-03 exports constants matching the frozen identity", () => {
  assert.equal(METAVERSE_REGIONAL_SCENE_DOMAIN, DOMAIN);
  assert.equal(METAVERSE_REGIONAL_SCENE_FEATURE_TYPE, FEATURE_TYPE);
  assert.equal(METAVERSE_REGIONAL_SCENE_SOURCE_AUTHORITY, SOURCE_AUTHORITY);
  assert.equal(METAVERSE_REGIONAL_SCENE_COORDINATE_SPACE, SPACE);
  assert.equal(METAVERSE_REGIONAL_SCENE_LAYER_ID, "metaverse.regional-scenes");
  assert.equal(METAVERSE_REGIONAL_SCENE_PROJECTION_VERSION, "1");
});

test("RSC-04 oil-rig is eligible because registry geometry is approved and qualified", () => {
  assert.equal(getRegionalSpatialEligibility("oil-rig"), "ELIGIBLE");
  assert.equal(adapter().isEligible(sourceRecord()), true);
  assert.equal(adapter().canProject(sourceRecord()), true);
});

test("RSC-05 projects oil-rig through the canonical Spatial pipeline", () => {
  const result = runtime().project(sourceRecord(), { viewer: { grantedLevels: ["AUTHENTICATED"] } });
  assert.equal(result.status, "PROJECTED");
  assert.equal(result.feature.sourceRecordId, "oil-rig");
});

test("RSC-06 uses the exact canonical Spatial feature ID helper output", () => {
  const candidate = adapter();
  assert.equal(candidate.featureId("oil-rig"), FEATURE_ID);
  assert.equal(candidate.featureId("oil-rig"), createSpatialFeatureId({
    domain: DOMAIN,
    featureType: FEATURE_TYPE,
    sourceAuthority: SOURCE_AUTHORITY,
    sourceRecordId: "oil-rig",
  }));
});

test("RSC-07 sourceRecordId is the canonical regional scene registry id", () => {
  assert.equal(adapter().sourceRecordId(sourceRecord({ label: "Renamed Oil Rig", order: 999 })), "oil-rig");
});

test("RSC-08 geometry is sourced from the approved geometry registry", () => {
  const feature = adapter().project(sourceRecord());
  const registryEntry = getRegionalGeometryRegistryEntry("oil-rig");
  assert.deepEqual(feature.geometry, registryEntry.geometry);
  assert.notEqual(feature.geometry, registryEntry.geometry);
});

test("RSC-09 preserves the exact approved geometry hash", () => {
  const feature = adapter().project(sourceRecord());
  assert.equal(feature.provenance.geometryHash, HASH);
});

test("RSC-10 preserves exact approved coordinates", () => {
  assert.deepEqual(adapter().project(sourceRecord()).geometry.coordinates, EXACT_COORDINATES);
});

test("RSC-11 preserves Polygon and regional-scene coordinate contract", () => {
  const feature = adapter().project(sourceRecord());
  assert.equal(feature.geometry.type, "Polygon");
  assert.equal(feature.coordinateFamily, "METAVERSE");
  assert.equal(feature.coordinateSpaceId, SPACE);
});

test("RSC-12 does not transform to Quick Map master-city camera-world or real-world spaces", () => {
  const feature = adapter().project(sourceRecord());
  assert.notEqual(feature.coordinateSpaceId, "metaverse.quick-map");
  assert.notEqual(feature.coordinateSpaceId, "metaverse.master-city");
  assert.notEqual(feature.coordinateSpaceId, "metaverse.camera-world");
  assert.notEqual(feature.coordinateFamily, "REAL_WORLD");
});

test("RSC-13 unimplemented or route-context-only scenes are rejected", () => {
  assert.ok(REGIONAL_ROUTE_SEQUENCE.some((stop) => stop.id === "shipping-corridor"));
  assert.equal(getRegionalSceneBySlug("shipping-corridor"), null);
  assert.equal(adapter().canProject(sourceRecord({ sceneId: "shipping-corridor" })), false);
});

test("RSC-14 implemented scenes without approved geometry are rejected", () => {
  assert.ok(getImplementedRegionalSceneSlugs().includes("open-sea"));
  assert.equal(getRegionalGeometryRegistryEntry("open-sea"), null);
  assert.equal(adapter().canProject(sourceRecord({ sceneId: "open-sea" })), false);
});

test("RSC-15 DRAFT geometry lifecycle is rejected", () => {
  assert.equal(adapter().canProject(sourceRecord({ geometryLifecycle: "DRAFT", lifecycle: "DRAFT", approval: "NONE" })), false);
});

test("RSC-16 REVIEW geometry lifecycle is rejected", () => {
  assert.equal(adapter().canProject(sourceRecord({ geometryLifecycle: "REVIEW", lifecycle: "REVIEW", approval: "NONE" })), false);
});

test("RSC-17 geometry hash mismatch is rejected", () => {
  assert.equal(adapter().canProject(sourceRecord({ geometryHash: "changed" })), false);
});

test("RSC-18 source geometry mutation is rejected", () => {
  assert.equal(adapter().canProject(sourceRecord({ geometry: { type: "Polygon", coordinates: [] } })), false);
});

test("RSC-19 wrong coordinate space is rejected", () => {
  assert.equal(adapter().canProject(sourceRecord({ coordinateSpaceId: "metaverse.quick-map", coordinateSpace: "metaverse.quick-map" })), false);
});

test("RSC-20 wrong provenance is rejected", () => {
  assert.equal(adapter().canProject(sourceRecord({
    geometryProvenance: { ...getRegionalGeometryRegistryEntry("oil-rig").provenance, reviewedGeometryHash: "changed" },
  })), false);
});

test("RSC-21 unknown scene is rejected", () => {
  assert.equal(adapter().canProject(sourceRecord({ sceneId: "invented-scene" })), false);
});

test("RSC-22 source authority mismatch is rejected", () => {
  assert.equal(adapter().canProject(sourceRecord({ sourceAuthority: "wrong-authority" })), false);
});

test("RSC-23 scene provenance mismatch is rejected", () => {
  assert.equal(adapter().canProject(sourceRecord({ provenance: { ...sourceRecord().provenance, sourceRecordId: "open-sea" } })), false);
});

test("RSC-24 asset-family mismatch is rejected", () => {
  assert.equal(adapter().canProject(sourceRecord({ assetFamilyHash: "changed" })), false);
});

test("RSC-25 composition-family mismatch is rejected", () => {
  assert.equal(adapter().canProject(sourceRecord({ compositionFamilyId: "changed" })), false);
});

test("RSC-26 adapter cannot create navigation authority", () => {
  const output = adapter().project(sourceRecord());
  for (const field of ["navigate", "navigationAuthority", "nextScene", "previousScene", "route", "trafficRoute"]) {
    assert.equal(output[field], undefined, field);
  }
  assert.deepEqual(output.authorizedActionReferences, []);
});

test("RSC-27 adapter cannot create publication authority", () => {
  const output = adapter().project(sourceRecord());
  assert.equal(output.publicationAuthority, undefined);
  assert.equal(output.publicationState, "AUTHENTICATED");
  assert.equal(output.provenance.publicationAuthority, undefined);
});

test("RSC-28 DAY DUSK NIGHT imagery remains outside Spatial truth", () => {
  const output = adapter().project(sourceRecord());
  for (const field of ["dayAsset", "duskAsset", "nightAsset", "availableTimeModes", "assetAlignment"]) {
    assert.equal(output[field], undefined, field);
    assert.equal(output.provenance[field], undefined, field);
  }
});

test("RSC-29 adapter does not own traffic water transit sky bridge or emergency authority", () => {
  const output = adapter().project(sourceRecord());
  for (const field of ["traffic", "water", "transit", "skyBridge", "emergency", "emergencyGeometry"]) {
    assert.equal(output[field], undefined, field);
  }
});

test("RSC-30 SpatialFeature validation passes through default registries", () => {
  const feature = adapter().project(sourceRecord());
  const layerRegistry = createDefaultSpatialLayerRegistry({ coordinateRegistry: defaultCoordinateSpaceRegistry });
  assert.equal(validateSpatialFeature(feature, { coordinateRegistry: defaultCoordinateSpaceRegistry, layerRegistry }).valid, true);
});

test("RSC-31 sanitized client result hides internal geometry governance metadata", () => {
  const pipeline = runtime();
  const internal = pipeline.project(sourceRecord(), { viewer: { grantedLevels: ["AUTHENTICATED"] } });
  const client = pipeline.toClient(internal);
  assert.equal(client.status, "PROJECTED");
  assert.equal(client.feature.provenance.sourceAuthority, SOURCE_AUTHORITY);
  assert.equal(client.feature.provenance.verificationState, "VERIFIED");
  assert.equal(client.feature.provenance.geometryHash, undefined);
  assert.equal(client.feature.provenance.geometryAuthority, undefined);
  assert.equal(client.feature.provenance.geometryQualification, undefined);
  assert.equal(client.feature.provenance.spatialEligibility, undefined);
  assert.equal(client.feature.provenance.approvedGeometryHash, undefined);
  assert.equal(client.feature.provenance.reviewedGeometryHash, undefined);
});

test("RSC-32 hidden or restricted client behavior follows Spatial privacy rules", () => {
  const pipeline = runtime();
  const internal = pipeline.project(sourceRecord(), { viewer: { grantedLevels: [] } });
  assert.equal(internal.status, "RESTRICTED");
  assert.equal(pipeline.toClient(internal), null);
});

test("RSC-33 adapter collision protections still hold", () => {
  const registry = createProjectionAdapterRegistry();
  const first = adapter();
  const second = adapter();
  assert.equal(registry.register(first).ok, true);
  const collision = registry.register(second);
  assert.equal(collision.ok, false);
  assert.equal(collision.diagnostics[0].code, "ADAPTER_COLLISION");
});

test("RSC-34 adapter identity snapshot remains stable after registration", () => {
  const registry = createProjectionAdapterRegistry();
  let declaredDomain = DOMAIN;
  const mutableIdentity = Object.freeze({ ...adapter(), getDomain: () => declaredDomain });
  assert.equal(registry.register(mutableIdentity).ok, true);
  declaredDomain = "changed-domain";
  assert.equal(registry.getAdapter(DOMAIN, FEATURE_TYPE).ok, true);
  assert.equal(registry.getAdapter("changed-domain", FEATURE_TYPE).ok, false);
});

test("RSC-35 module exports no implicit transform helpers", async () => {
  const module = await import("../src/system/spatial/adapters/metaverseRegionalSceneAdapter.js");
  assert.equal(module.transformCoordinates, undefined);
  assert.equal(module.calibrateCoordinateSpace, undefined);
  assert.equal(module.convertQuickMapCoordinates, undefined);
  assert.equal(module.convertMasterCityCoordinates, undefined);
});

test("RSC-36 regional scene registry remains valid and separate from geometry authority", () => {
  assert.equal(validateRegionalSceneRegistry().valid, true);
  assert.equal(SOURCE_AUTHORITY, METAVERSE_REGIONAL_SCENE_SOURCE_AUTHORITY);
  assert.equal(GEOMETRY_AUTHORITY, getRegionalGeometryRegistryEntry("oil-rig").sourceAuthority);
  assert.notEqual(SOURCE_AUTHORITY, GEOMETRY_AUTHORITY);
});
