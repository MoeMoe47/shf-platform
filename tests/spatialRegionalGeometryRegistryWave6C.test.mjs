import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

import {
  REGIONAL_GEOMETRY_REGISTRY,
  REGIONAL_GEOMETRY_REGISTRY_SOURCE_AUTHORITY,
  __test__,
  getRegionalGeometryQualification,
  getRegionalGeometryRegistryEntry,
  getRegionalSpatialEligibility,
  isRegionalGeometryQualified,
  isRegionalSpatialEligible,
  validateRegionalGeometryRegistry,
} from "../src/system/metaverse/regionalGeometry/regionalSceneGeometryRegistry.js";

const exactCoordinates = [
  [
    [95.52457739934192, 20.389571245573055],
    [10.71207896918092, 20.775374877552558],
    [9.104563835932987, 89.83422500188381],
    [95.52457739934192, 89.73777409388893],
    [95.52457739934192, 20.389571245573055],
  ],
];

function oilRig(overrides = {}) {
  const entry = getRegionalGeometryRegistryEntry("oil-rig");
  return {
    ...entry,
    ...overrides,
    geometry: overrides.geometry || entry.geometry,
    assetAlignment: overrides.assetAlignment || entry.assetAlignment,
    provenance: overrides.provenance || entry.provenance,
  };
}

test("registry has exactly one approved Oil Rig entry", () => {
  assert.equal(REGIONAL_GEOMETRY_REGISTRY.length, 1);
  assert.equal(REGIONAL_GEOMETRY_REGISTRY[0].sceneId, "oil-rig");
  assert.equal(validateRegionalGeometryRegistry().valid, true);
});

test("registry entry preserves source authority", () => {
  const entry = getRegionalGeometryRegistryEntry("oil-rig");
  assert.equal(entry.sourceAuthority, "silicon-heartland-metaverse-regional-geometry-registry");
  assert.equal(entry.sourceAuthority, REGIONAL_GEOMETRY_REGISTRY_SOURCE_AUTHORITY);
  assert.equal(entry.provenance.sourceAuthority, REGIONAL_GEOMETRY_REGISTRY_SOURCE_AUTHORITY);
});

test("registry entry preserves coordinate family and space", () => {
  const entry = getRegionalGeometryRegistryEntry("oil-rig");
  assert.equal(entry.coordinateFamily, "METAVERSE");
  assert.equal(entry.coordinateSpace, "metaverse.regional-scene");
  assert.equal(entry.geometryType, "Polygon");
});

test("registry entry preserves exact geometry hash", () => {
  assert.equal(getRegionalGeometryRegistryEntry("oil-rig").geometryHash, "201e189ef24d2adb");
});

test("registry entry preserves exact approved coordinates", () => {
  assert.deepEqual(getRegionalGeometryRegistryEntry("oil-rig").geometry.coordinates, exactCoordinates);
});

test("registry entry preserves composition and asset family metadata", () => {
  const entry = getRegionalGeometryRegistryEntry("oil-rig");
  assert.equal(entry.compositionFamilyId, "oil-rig-composition-family:2088948cdc7ddcf6");
  assert.equal(entry.assetFamilyHash, "2088948cdc7ddcf6");
  assert.equal(entry.assetAlignment.alignmentStatus, "ALIGNED_WITH_TOLERANCE");
  assert.equal(entry.assetAlignment.alignmentStandard, "GEO-1_WAVE6C_OIL_RIG_ALIGNMENT_REPORT");
});

test("registry entry preserves DAY DUSK NIGHT hashes", () => {
  assert.deepEqual(getRegionalGeometryRegistryEntry("oil-rig").assetAlignment.variants, {
    DAY: "3b5d111b624f365a26434f0bb99aebe82bdd0641ffece39992ca9b94b64d8608",
    DUSK: "882070509dac8430d61b6e82b9b52a9d679b80d8338c08069bf9509ec446d3f2",
    NIGHT: "f676c6c3dc430dcc80d078abd01358e7f9b8ad962da34da5ec1dd73c7dcc47f5",
  });
});

test("registry entry preserves APPROVED lifecycle and approval", () => {
  const entry = getRegionalGeometryRegistryEntry("oil-rig");
  assert.equal(entry.lifecycle, "APPROVED");
  assert.equal(entry.status, "APPROVED");
  assert.equal(entry.approval, "APPROVED");
});

test("registry entry preserves reviewed and approved artifact provenance", () => {
  const provenance = getRegionalGeometryRegistryEntry("oil-rig").provenance;
  assert.equal(provenance.sourceDraftGeometryHash, "201e189ef24d2adb");
  assert.equal(provenance.reviewedGeometryHash, "201e189ef24d2adb");
  assert.equal(provenance.approvedGeometryHash, "201e189ef24d2adb");
  assert.equal(provenance.sourceReviewStatus, "REVIEW");
  assert.equal(provenance.sourceApprovedStatus, "APPROVED");
  assert.equal(Object.hasOwn(provenance, "reviewerId"), false);
});

test("APPROVED registry entry is geometry-qualified", () => {
  assert.equal(getRegionalGeometryQualification("oil-rig"), "QUALIFIED");
  assert.equal(isRegionalGeometryQualified("oil-rig"), true);
});

test("APPROVED registry entry is spatial-eligible for future projection", () => {
  assert.equal(getRegionalSpatialEligibility("oil-rig"), "ELIGIBLE");
  assert.equal(isRegionalSpatialEligible("oil-rig"), true);
});

test("DRAFT registry entry is rejected", () => {
  const entry = oilRig({ status: "DRAFT", lifecycle: "DRAFT", approval: "NONE" });
  assert.equal(__test__.validateRegionalGeometryRegistryEntry(entry).valid, false);
});

test("REVIEW registry entry is rejected", () => {
  const entry = oilRig({ status: "REVIEW", lifecycle: "REVIEW", approval: "NONE" });
  assert.equal(__test__.validateRegionalGeometryRegistryEntry(entry).valid, false);
});

test("hash mismatch is rejected", () => {
  assert.equal(__test__.validateRegionalGeometryRegistryEntry(oilRig({ geometryHash: "changed" })).valid, false);
});

test("geometry mutation is rejected", () => {
  const entry = oilRig({
    geometry: { type: "Polygon", coordinates: [[[95.5, 20.38], [10.71207896918092, 20.775374877552558], [9.104563835932987, 89.83422500188381], [95.52457739934192, 89.73777409388893], [95.5, 20.38]]] },
  });
  assert.equal(__test__.validateRegionalGeometryRegistryEntry(entry).valid, false);
});

test("wrong coordinate space is rejected", () => {
  assert.equal(__test__.validateRegionalGeometryRegistryEntry(oilRig({ coordinateSpace: "metaverse.quick-map" })).valid, false);
});

test("asset-family mismatch is rejected", () => {
  assert.equal(__test__.validateRegionalGeometryRegistryEntry(oilRig({ assetFamilyHash: "changed" })).valid, false);
});

test("composition-family mismatch is rejected", () => {
  assert.equal(__test__.validateRegionalGeometryRegistryEntry(oilRig({ compositionFamilyId: "changed" })).valid, false);
});

test("unknown scene is rejected and not eligible", () => {
  assert.equal(__test__.validateRegionalGeometryRegistryEntry(oilRig({ sceneId: "shipping-corridor" })).valid, false);
  assert.equal(getRegionalSpatialEligibility("shipping-corridor"), "NOT_ELIGIBLE");
});

test("registry does not create navigation publication or domain authority", () => {
  const entry = getRegionalGeometryRegistryEntry("oil-rig");
  for (const field of ["navigationAuthority", "nextScene", "previousScene", "traffic", "water", "transit", "emergencyGeometry", "publicationState"]) {
    assert.equal(Object.hasOwn(entry, field), false, field);
  }
});

test("navigation authority injection is rejected", () => {
  assert.equal(__test__.validateRegionalGeometryRegistryEntry(oilRig({ navigationAuthority: "OPEN_SEA" })).valid, false);
});

test("duplicate registry scene ids fail closed", () => {
  const entry = getRegionalGeometryRegistryEntry("oil-rig");
  assert.equal(validateRegionalGeometryRegistry([entry, entry]).valid, false);
});

test("adapter remains missing", () => {
  assert.equal(existsSync(new URL("../src/system/spatial/adapters/metaverseRegionalSceneAdapter.js", import.meta.url)), false);
});
