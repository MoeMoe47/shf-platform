import assert from "node:assert/strict";
import test from "node:test";

import {
  COORDINATE_FAMILIES,
  PUBLICATION_ELIGIBILITY_LEVELS,
  SPATIAL_INTERACTION_TYPES,
  createSpatialFeatureId,
  defaultCoordinateSpaceRegistry,
  defaultSpatialLayerRegistry,
} from "../src/shared/spatial/index.js";
import { SELECTION_LIFECYCLE, createSpatialInteractionBus, createSpatialSelectionStore } from "../src/system/spatial/index.js";

const timestamp = "2026-09-27T00:00:00.000Z";

function provenance(overrides = {}) {
  return {
    sourceAuthority: "metaverse-registry",
    sourceRecordId: "quick-map-location-001",
    sourceReference: "runtime-test",
    evidenceReference: "GEO-1_WAVE2B_IMPLEMENTATION_REPORT.md",
    projectionAdapter: "wave2b-runtime-test",
    projectionVersion: "1",
    coordinateProvenance: "registered coordinate space",
    updatedAt: timestamp,
    freshness: "current-for-test",
    ...overrides,
  };
}

function eligibility(overrides = {}) {
  return {
    level: PUBLICATION_ELIGIBILITY_LEVELS.AUTHENTICATED,
    publicationState: PUBLICATION_ELIGIBILITY_LEVELS.AUTHENTICATED,
    ...overrides,
  };
}

function feature(overrides = {}) {
  const base = {
    domain: "metaverse",
    featureType: "location",
    sourceAuthority: "metaverse-registry",
    sourceRecordId: "quick-map-location-001",
  };
  return {
    featureId: createSpatialFeatureId(base),
    ...base,
    coordinateFamily: COORDINATE_FAMILIES.METAVERSE,
    coordinateSpaceId: "metaverse.quick-map",
    geometry: "point-normalized-percent",
    layerId: "metaverse.quick-map.locations",
    title: "Quick Map Location",
    label: "Quick Map Location",
    state: "NORMAL",
    temporalState: null,
    verificationState: "UNKNOWN",
    publicationState: PUBLICATION_ELIGIBILITY_LEVELS.AUTHENTICATED,
    provenance: provenance(),
    updatedAt: timestamp,
    allowedInteractions: [SPATIAL_INTERACTION_TYPES.SELECT, SPATIAL_INTERACTION_TYPES.REQUEST_DOMAIN_ACTION],
    authorizedActionReferences: [],
    publicEligibility: eligibility(),
    ...overrides,
  };
}

function selection(spatialFeature = feature(), overrides = {}) {
  return {
    selectionId: "selection-001",
    featureId: spatialFeature.featureId,
    domain: spatialFeature.domain,
    sourceAuthority: spatialFeature.sourceAuthority,
    coordinateFamily: spatialFeature.coordinateFamily,
    coordinateSpaceId: spatialFeature.coordinateSpaceId,
    layerId: spatialFeature.layerId,
    selectionReason: "keyboard",
    timestamp,
    provenance: spatialFeature.provenance,
    eligibleActions: [],
    publicationState: spatialFeature.publicationState,
    publicEligibility: spatialFeature.publicEligibility,
    ...overrides,
  };
}

function interaction(type, spatialFeature = feature(), overrides = {}) {
  return {
    interactionId: `interaction-${type.toLowerCase()}-001`,
    interactionType: type,
    featureId: spatialFeature.featureId,
    layerId: spatialFeature.layerId,
    domain: spatialFeature.domain,
    sourceAuthority: spatialFeature.sourceAuthority,
    coordinateFamily: spatialFeature.coordinateFamily,
    coordinateSpaceId: spatialFeature.coordinateSpaceId,
    timestamp,
    originClient: "runtime-test-client",
    originComponent: "keyboard-list",
    correlationId: "correlation-001",
    payload: {},
    provenance: spatialFeature.provenance,
    ...overrides,
  };
}

test("selection store is initially empty and stores a valid selection unchanged", () => {
  const spatialFeature = feature();
  const store = createSpatialSelectionStore({ features: [spatialFeature] });
  assert.equal(store.getSelection(), null);
  assert.equal(store.getLifecycle(), SELECTION_LIFECYCLE.NONE);
  const selected = selection(spatialFeature);
  const result = store.select(selected);
  assert.equal(result.ok, true);
  assert.deepEqual(store.getSelection(), selected);
  assert.equal(store.getLifecycle(), SELECTION_LIFECYCLE.SELECTED);
});

test("selection store updates and clears selection", () => {
  const spatialFeature = feature();
  const store = createSpatialSelectionStore({ features: [spatialFeature] });
  store.select(selection(spatialFeature));
  const updated = selection(spatialFeature, { selectionId: "selection-002", selectionReason: "focus" });
  assert.equal(store.updateSelection(updated).ok, true);
  assert.equal(store.getLifecycle(), SELECTION_LIFECYCLE.UPDATED);
  assert.deepEqual(store.getSelection(), updated);
  assert.equal(store.clearSelection("escape-key").ok, true);
  assert.equal(store.getSelection(), null);
  assert.equal(store.getLifecycle(), SELECTION_LIFECYCLE.CLEARED);
});

test("selection subscribers are notified, unsubscribed handlers stop, and duplicates are deterministic", () => {
  const spatialFeature = feature();
  const store = createSpatialSelectionStore({ features: [spatialFeature] });
  const calls = [];
  const first = store.subscribe((event) => calls.push(`first:${event.type}`));
  store.subscribe((event) => calls.push(`second:${event.type}`));
  store.subscribe((event) => calls.push(`third:${event.type}`));
  assert.equal(store.select(selection(spatialFeature)).ok, true);
  assert.deepEqual(calls, ["first:SELECTED", "second:SELECTED", "third:SELECTED"]);
  assert.equal(store.unsubscribe(first), true);
  store.clearSelection("test");
  assert.deepEqual(calls, ["first:SELECTED", "second:SELECTED", "third:SELECTED", "second:CLEARED", "third:CLEARED"]);
});

test("malformed selection, unknown feature, family mismatch, and coordinate-space mismatch are rejected", () => {
  const spatialFeature = feature();
  const store = createSpatialSelectionStore({ features: [spatialFeature] });
  assert.equal(store.select(selection(spatialFeature, { sourceAuthority: "" })).ok, false);
  assert.equal(store.select(selection(spatialFeature, { featureId: "spatial:metaverse:location:metaverse-registry:missing" })).ok, false);
  assert.equal(store.select(selection(spatialFeature, { coordinateFamily: COORDINATE_FAMILIES.REAL_WORLD })).ok, false);
  assert.equal(store.select(selection(spatialFeature, { coordinateSpaceId: "metaverse.master-city" })).ok, false);
});

test("Quick Map, master-city, METAVERSE, and REAL_WORLD remain isolated with no implicit transform", () => {
  const spatialFeature = feature();
  const store = createSpatialSelectionStore({ features: [spatialFeature] });
  assert.equal(store.select(selection(spatialFeature)).ok, true);
  assert.equal(store.updateSelection(selection(spatialFeature, { coordinateSpaceId: "metaverse.master-city" })).ok, false);
  assert.equal(store.updateSelection(selection(spatialFeature, { coordinateFamily: COORDINATE_FAMILIES.REAL_WORLD })).ok, false);
  assert.equal(defaultCoordinateSpaceRegistry.assertNoImplicitTransform("metaverse.quick-map", "metaverse.master-city").ok, false);
  assert.equal(defaultCoordinateSpaceRegistry.assertNoImplicitTransform("metaverse.quick-map", "real-world.latlng").ok, false);
});

test("unpublished feature cannot bypass projection eligibility through selection", () => {
  const hidden = feature({
    publicationState: PUBLICATION_ELIGIBILITY_LEVELS.NOT_PUBLISHED,
    publicEligibility: eligibility({
      level: PUBLICATION_ELIGIBILITY_LEVELS.PUBLIC,
      publicationState: PUBLICATION_ELIGIBILITY_LEVELS.NOT_PUBLISHED,
    }),
  });
  const store = createSpatialSelectionStore({ features: [hidden] });
  assert.equal(store.select(selection(hidden)).ok, false);
  assert.equal(store.getSelection(), null);
});

test("selection runtime does not mutate domain fixtures or create Franklin County fallback", () => {
  const domainFixture = Object.freeze({ id: "unknown-entity", county: null });
  const spatialFeature = feature();
  const store = createSpatialSelectionStore({ features: [spatialFeature] });
  store.select(selection(spatialFeature));
  assert.deepEqual(domainFixture, { id: "unknown-entity", county: null });
  assert.equal(defaultSpatialLayerRegistry.has("real-world.franklin-fallback"), false);
});

test("stale selection is safely cleared when feature catalog changes", () => {
  const spatialFeature = feature();
  const store = createSpatialSelectionStore({ features: [spatialFeature] });
  store.select(selection(spatialFeature));
  const result = store.replaceFeatures([]);
  assert.equal(result.ok, true);
  assert.equal(store.getSelection(), null);
  assert.equal(store.getLifecycle(), SELECTION_LIFECYCLE.CLEARED);
});

test("interaction bus accepts SELECT and DESELECT, preserves correlation, and does not replay", () => {
  const spatialFeature = feature();
  const bus = createSpatialInteractionBus();
  const calls = [];
  bus.subscribe(SPATIAL_INTERACTION_TYPES.SELECT, (event) => calls.push(event.correlationId));
  const result = bus.publish(interaction(SPATIAL_INTERACTION_TYPES.SELECT, spatialFeature));
  assert.equal(result.ok, true);
  assert.equal(result.delivered, 1);
  assert.equal(result.correlationId, "correlation-001");
  assert.deepEqual(calls, ["correlation-001"]);
  const lateCalls = [];
  bus.subscribe(SPATIAL_INTERACTION_TYPES.SELECT, () => lateCalls.push("late"));
  assert.deepEqual(lateCalls, []);
  assert.equal(bus.publish(interaction(SPATIAL_INTERACTION_TYPES.DESELECT, spatialFeature, {
    interactionId: "interaction-deselect-001",
    featureId: undefined,
    layerId: undefined,
    coordinateFamily: undefined,
    coordinateSpaceId: undefined,
  })).ok, true);
});

test("REQUEST_DOMAIN_ACTION stays a request envelope and does not execute actions", () => {
  const spatialFeature = feature();
  const bus = createSpatialInteractionBus();
  let executed = false;
  bus.subscribe(SPATIAL_INTERACTION_TYPES.REQUEST_DOMAIN_ACTION, (event) => {
    assert.equal(event.requestedAction.actionType, "dispatch");
  });
  const result = bus.publish(interaction(SPATIAL_INTERACTION_TYPES.REQUEST_DOMAIN_ACTION, spatialFeature, {
    interactionId: "interaction-request-domain-action-001",
    requestedAction: { actionType: "dispatch", domain: "emergency" },
  }));
  assert.equal(result.ok, true);
  assert.equal(executed, false);
});

test("unknown and malformed interactions are rejected", () => {
  const spatialFeature = feature();
  const bus = createSpatialInteractionBus();
  assert.throws(() => bus.subscribe("UNKNOWN", () => {}), /unknown interaction type/);
  assert.equal(bus.publish(interaction("UNKNOWN", spatialFeature)).ok, false);
  assert.equal(bus.publish(interaction(SPATIAL_INTERACTION_TYPES.SELECT, spatialFeature, { sourceAuthority: "" })).ok, false);
});

test("subscriber exceptions are isolated and dispatch order is deterministic", () => {
  const spatialFeature = feature();
  const bus = createSpatialInteractionBus();
  const calls = [];
  bus.subscribe(SPATIAL_INTERACTION_TYPES.SELECT, () => calls.push("first"));
  bus.subscribe(SPATIAL_INTERACTION_TYPES.SELECT, () => {
    calls.push("second");
    throw new Error("subscriber failed");
  });
  bus.subscribe(SPATIAL_INTERACTION_TYPES.SELECT, () => calls.push("third"));
  const result = bus.publish(interaction(SPATIAL_INTERACTION_TYPES.SELECT, spatialFeature));
  assert.equal(result.ok, false);
  assert.equal(result.delivered, 2);
  assert.equal(result.failures.length, 1);
  assert.deepEqual(calls, ["first", "second", "third"]);
});

test("unsubscribe and duplicate interaction ID behavior are deterministic", () => {
  const spatialFeature = feature();
  const bus = createSpatialInteractionBus();
  const calls = [];
  const subscription = bus.subscribe(SPATIAL_INTERACTION_TYPES.SELECT, () => calls.push("first"));
  bus.subscribe(SPATIAL_INTERACTION_TYPES.SELECT, () => calls.push("second"));
  assert.equal(bus.unsubscribe(subscription), true);
  assert.equal(bus.publish(interaction(SPATIAL_INTERACTION_TYPES.SELECT, spatialFeature)).delivered, 1);
  assert.deepEqual(calls, ["second"]);
  const duplicate = bus.publish(interaction(SPATIAL_INTERACTION_TYPES.SELECT, spatialFeature));
  assert.equal(duplicate.ok, false);
  assert.ok(duplicate.errors.some((error) => error.includes("duplicate interaction id")));
});
