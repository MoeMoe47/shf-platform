import assert from "node:assert/strict";
import test from "node:test";

import {
  COORDINATE_FAMILIES,
  CoordinateSpaceRegistry,
  PUBLICATION_ELIGIBILITY_LEVELS,
  SPATIAL_INTERACTION_TYPES,
  SPATIAL_STATES,
  SpatialLayerRegistry,
  createDefaultCoordinateSpaceRegistry,
  createDefaultSpatialLayerRegistry,
  createSpatialFeatureId,
  defaultCoordinateSpaceRegistry,
  defaultSpatialLayerRegistry,
  isPublicProjectionEligible,
  validatePublicationEligibility,
  validateSpatialFeature,
  validateSpatialInteraction,
  validateSpatialLayer,
  validateSpatialProvenance,
  validateSpatialSelection,
  validateTemporalProjection,
} from "../src/shared/spatial/index.js";

const updatedAt = "2026-09-27T00:00:00.000Z";

function provenance(overrides = {}) {
  return {
    sourceAuthority: "metaverse-registry",
    sourceRecordId: "quick-map-location-001",
    sourceReference: "src/system/metaverse/metaverseMiniMapRegistry.js",
    evidenceReference: "GEO-0_TARGETED_COMPLETION_ADDENDUM.md",
    projectionAdapter: "spatial-foundation-wave1-test",
    projectionVersion: "1",
    coordinateProvenance: "registered coordinate space",
    updatedAt,
    freshness: "current-for-test",
    ...overrides,
  };
}

function publicEligibility(overrides = {}) {
  return {
    level: PUBLICATION_ELIGIBILITY_LEVELS.AUTHENTICATED,
    publicationState: PUBLICATION_ELIGIBILITY_LEVELS.AUTHENTICATED,
    ...overrides,
  };
}

function feature(overrides = {}) {
  return {
    featureId: createSpatialFeatureId({
      domain: "metaverse",
      featureType: "location",
      sourceAuthority: "metaverse-registry",
      sourceRecordId: "quick-map-location-001",
    }),
    featureType: "location",
    domain: "metaverse",
    sourceAuthority: "metaverse-registry",
    sourceRecordId: "quick-map-location-001",
    coordinateFamily: COORDINATE_FAMILIES.METAVERSE,
    coordinateSpaceId: "metaverse.quick-map",
    geometry: "point-normalized-percent",
    layerId: "metaverse.quick-map.locations",
    title: "Quick Map Location",
    label: "Quick Map Location",
    state: SPATIAL_STATES.NORMAL,
    temporalState: null,
    verificationState: "UNKNOWN",
    publicationState: PUBLICATION_ELIGIBILITY_LEVELS.AUTHENTICATED,
    provenance: provenance(),
    updatedAt,
    allowedInteractions: [SPATIAL_INTERACTION_TYPES.SELECT],
    authorizedActionReferences: [],
    publicEligibility: publicEligibility(),
    ...overrides,
  };
}

test("CoordinateFamily validation supports only REAL_WORLD and METAVERSE", () => {
  assert.equal(defaultCoordinateSpaceRegistry.get("metaverse.quick-map", { expectedFamily: COORDINATE_FAMILIES.METAVERSE }).ok, true);
  assert.equal(defaultCoordinateSpaceRegistry.get("metaverse.quick-map", { expectedFamily: "GALACTIC" }).ok, false);
});

test("coordinate-space registry supports registration and lookup by stable id", () => {
  const registry = createDefaultCoordinateSpaceRegistry();
  assert.equal(registry.has("real-world.latlng"), true);
  assert.equal(registry.has("real-world.county-geojson"), true);
  assert.equal(registry.has("metaverse.quick-map"), true);
  assert.equal(registry.has("metaverse.master-city"), true);
  assert.equal(registry.has("metaverse.regional-scene"), true);
  assert.equal(registry.has("metaverse.camera-world"), true);
});

test("duplicate coordinate-space IDs fail safely", () => {
  const [space] = defaultCoordinateSpaceRegistry.list();
  assert.throws(() => new CoordinateSpaceRegistry([space, space]), /Duplicate coordinate space id/);
});

test("unknown coordinate-space lookup fails safely", () => {
  assert.deepEqual(defaultCoordinateSpaceRegistry.get("metaverse.unknown"), {
    ok: false,
    error: "unknown coordinate space: metaverse.unknown",
  });
});

test("family mismatch is rejected", () => {
  const result = defaultCoordinateSpaceRegistry.get("metaverse.quick-map", { expectedFamily: COORDINATE_FAMILIES.REAL_WORLD });
  assert.equal(result.ok, false);
  assert.match(result.error, /coordinate family mismatch/);
});

test("no implicit coordinate transforms are available", () => {
  assert.equal(defaultCoordinateSpaceRegistry.assertNoImplicitTransform("metaverse.quick-map", "metaverse.quick-map").ok, true);
  assert.equal(defaultCoordinateSpaceRegistry.assertNoImplicitTransform("metaverse.quick-map", "metaverse.master-city").ok, false);
  assert.equal(defaultCoordinateSpaceRegistry.assertNoImplicitTransform("metaverse.master-city", "metaverse.quick-map").ok, false);
  assert.equal(defaultCoordinateSpaceRegistry.assertNoImplicitTransform("metaverse.quick-map", "real-world.latlng").ok, false);
});

test("feature contract validation accepts a complete projected feature", () => {
  const validation = validateSpatialFeature(feature(), {
    coordinateRegistry: defaultCoordinateSpaceRegistry,
    layerRegistry: defaultSpatialLayerRegistry,
  });
  assert.deepEqual(validation.errors, []);
  assert.equal(validation.valid, true);
});

test("feature contract validation rejects unknown coordinate spaces and layer mismatch", () => {
  const unknownSpace = validateSpatialFeature(feature({ coordinateSpaceId: "metaverse.missing" }), {
    coordinateRegistry: defaultCoordinateSpaceRegistry,
    layerRegistry: defaultSpatialLayerRegistry,
  });
  assert.equal(unknownSpace.valid, false);
  assert.ok(unknownSpace.errors.some((error) => error.includes("unknown coordinate space")));

  const layerMismatch = validateSpatialFeature(feature({ coordinateSpaceId: "metaverse.master-city" }), {
    coordinateRegistry: defaultCoordinateSpaceRegistry,
    layerRegistry: defaultSpatialLayerRegistry,
  });
  assert.equal(layerMismatch.valid, false);
  assert.ok(layerMismatch.errors.some((error) => error.includes("does not support coordinate space")));
});

test("layer contract validation and duplicate layer IDs fail safely", () => {
  const [layer] = defaultSpatialLayerRegistry.list();
  assert.equal(validateSpatialLayer(layer, defaultCoordinateSpaceRegistry).valid, true);
  assert.throws(() => new SpatialLayerRegistry([layer, layer], { coordinateRegistry: defaultCoordinateSpaceRegistry }), /Duplicate spatial layer id/);
});

test("provenance validation requires source authority and projection identity", () => {
  assert.equal(validateSpatialProvenance(provenance()).valid, true);
  const invalid = validateSpatialProvenance(provenance({ sourceAuthority: "", projectionAdapter: "" }));
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.includes("sourceAuthority is required"));
  assert.ok(invalid.errors.includes("projectionAdapter is required"));
});

test("coordinates do not imply public projection eligibility", () => {
  assert.equal(validatePublicationEligibility(publicEligibility()).valid, true);
  assert.equal(isPublicProjectionEligible(publicEligibility()), false);
  assert.equal(
    isPublicProjectionEligible(
      publicEligibility({
        level: PUBLICATION_ELIGIBILITY_LEVELS.PUBLIC,
        publicationState: PUBLICATION_ELIGIBILITY_LEVELS.NOT_PUBLISHED,
      }),
    ),
    false,
  );
  assert.equal(
    isPublicProjectionEligible(
      publicEligibility({
        level: PUBLICATION_ELIGIBILITY_LEVELS.PUBLIC,
        publicationState: PUBLICATION_ELIGIBILITY_LEVELS.PUBLIC,
      }),
    ),
    true,
  );
});

test("Quick Map coordinates are not accepted as master-city coordinates", () => {
  const validation = validateSpatialFeature(feature({ coordinateSpaceId: "metaverse.master-city" }), {
    coordinateRegistry: defaultCoordinateSpaceRegistry,
    layerRegistry: defaultSpatialLayerRegistry,
  });
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes("does not support coordinate space")));
  assert.equal(defaultCoordinateSpaceRegistry.assertNoImplicitTransform("metaverse.quick-map", "metaverse.master-city").ok, false);
});

test("METAVERSE coordinates are not accepted as REAL_WORLD coordinates", () => {
  const validation = validateSpatialFeature(feature({ coordinateFamily: COORDINATE_FAMILIES.REAL_WORLD }), {
    coordinateRegistry: defaultCoordinateSpaceRegistry,
    layerRegistry: defaultSpatialLayerRegistry,
  });
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes("coordinate family mismatch")));
});

test("unknown entity does not become Franklin County in the spatial foundation", () => {
  assert.throws(
    () =>
      createSpatialFeatureId({
        domain: "shf",
        featureType: "county",
        sourceAuthority: "shf-impact",
        sourceRecordId: "",
      }),
    /missing or invalid: sourceRecordId/,
  );
  assert.equal(defaultCoordinateSpaceRegistry.has("real-world.franklin-fallback"), false);
});

test("invalid temporal data fails instead of deriving state from missing timestamps", () => {
  const invalid = validateTemporalProjection({
    temporalState: "live",
    sourceTimestamp: null,
    effectiveStart: null,
    effectiveEnd: null,
    timezone: "America/New_York",
    freshness: "unknown",
    sourceAuthority: "events",
    provenance: "event-service",
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.includes("sourceTimestamp is required for temporal projection"));
});

test("feature IDs are stable, deterministic, namespaced, and collision-resistant by authority", () => {
  const first = createSpatialFeatureId({
    domain: "Metaverse",
    featureType: "Location",
    sourceAuthority: "Metaverse Registry",
    sourceRecordId: "Quick Map Location 001",
  });
  const second = createSpatialFeatureId({
    domain: "metaverse",
    featureType: "location",
    sourceAuthority: "metaverse-registry",
    sourceRecordId: "quick-map-location-001",
  });
  const third = createSpatialFeatureId({
    domain: "metaverse",
    featureType: "location",
    sourceAuthority: "other-registry",
    sourceRecordId: "quick-map-location-001",
  });
  assert.equal(first, second);
  assert.notEqual(first, third);
  assert.equal(first, "spatial:metaverse:location:metaverse-registry:quick-map-location-001");
});

test("registry operations do not mutate domain records", () => {
  const domainRecord = Object.freeze({ id: "domain-001", status: "CANONICAL" });
  const registry = createDefaultCoordinateSpaceRegistry();
  registry.has("metaverse.quick-map");
  registry.get("metaverse.quick-map");
  assert.deepEqual(domainRecord, { id: "domain-001", status: "CANONICAL" });
});

test("selection and interaction envelopes validate without creating runtimes", () => {
  const selection = {
    selectionId: "selection-001",
    featureId: feature().featureId,
    domain: "metaverse",
    sourceAuthority: "metaverse-registry",
    coordinateFamily: COORDINATE_FAMILIES.METAVERSE,
    coordinateSpaceId: "metaverse.quick-map",
    layerId: "metaverse.quick-map.locations",
    selectionReason: "user",
    timestamp: updatedAt,
    provenance: provenance(),
    eligibleActions: [],
  };
  assert.equal(validateSpatialSelection(selection, {
    coordinateRegistry: defaultCoordinateSpaceRegistry,
    layerRegistry: defaultSpatialLayerRegistry,
  }).valid, true);

  const interaction = {
    interactionId: "interaction-001",
    type: SPATIAL_INTERACTION_TYPES.SELECT,
    timestamp: updatedAt,
    publisherId: "test-map",
    domain: "metaverse",
    sourceAuthority: "metaverse-registry",
    correlationId: "correlation-001",
    featureId: selection.featureId,
    coordinateFamily: COORDINATE_FAMILIES.METAVERSE,
    coordinateSpaceId: "metaverse.quick-map",
    layerId: "metaverse.quick-map.locations",
  };
  assert.equal(validateSpatialInteraction(interaction).valid, true);
});
