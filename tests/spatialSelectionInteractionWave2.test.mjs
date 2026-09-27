import assert from "node:assert/strict";
import test from "node:test";

import {
  COORDINATE_FAMILIES,
  PUBLICATION_ELIGIBILITY_LEVELS,
  SPATIAL_INTERACTION_TYPES,
  createSpatialFeatureId,
  defaultCoordinateSpaceRegistry,
  defaultSpatialLayerRegistry,
  isPublicProjectionEligible,
  validateSpatialFeature,
  validateSpatialInteraction,
  validateSpatialSelection,
} from "../src/shared/spatial/index.js";

const timestamp = "2026-09-27T00:00:00.000Z";

function provenance(overrides = {}) {
  return {
    sourceAuthority: "metaverse-registry",
    sourceRecordId: "quick-map-location-001",
    sourceReference: "test-fixture",
    evidenceReference: "GEO-1_WAVE2A_SELECTION_INTERACTION_DESIGN.md",
    projectionAdapter: "wave2a-test-harness",
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

function makeFeature(overrides = {}) {
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

function makeSelection(feature, overrides = {}) {
  return {
    selectionId: "selection-001",
    featureId: feature.featureId,
    domain: feature.domain,
    sourceAuthority: feature.sourceAuthority,
    coordinateFamily: feature.coordinateFamily,
    coordinateSpaceId: feature.coordinateSpaceId,
    layerId: feature.layerId,
    selectionReason: "user",
    timestamp,
    provenance: feature.provenance,
    eligibleActions: [],
    ...overrides,
  };
}

function makeInteraction(type, feature, overrides = {}) {
  return {
    interactionId: `interaction-${type.toLowerCase()}-001`,
    type,
    timestamp,
    publisherId: "wave2a-test-client",
    originClient: "wave2a-test-client",
    originComponent: "test-harness",
    domain: feature.domain,
    sourceAuthority: feature.sourceAuthority,
    correlationId: "correlation-001",
    featureId: feature.featureId,
    layerId: feature.layerId,
    coordinateFamily: feature.coordinateFamily,
    coordinateSpaceId: feature.coordinateSpaceId,
    payload: {},
    provenance: feature.provenance,
    ...overrides,
  };
}

function createSelectionHarness(features) {
  const featureMap = new Map(features.map((feature) => [feature.featureId, feature]));
  let current = null;
  let lifecycle = "NONE";
  const subscribers = new Set();

  function validate(selection) {
    const base = validateSpatialSelection(selection, {
      coordinateRegistry: defaultCoordinateSpaceRegistry,
      layerRegistry: defaultSpatialLayerRegistry,
    });
    const errors = [...base.errors];
    const feature = featureMap.get(selection?.featureId);
    if (!feature) {
      errors.push(`unknown feature: ${selection?.featureId}`);
    } else {
      for (const field of ["domain", "sourceAuthority", "coordinateFamily", "coordinateSpaceId", "layerId"]) {
        if (selection[field] !== feature[field]) errors.push(`${field} does not match selected feature`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  function notify(event) {
    for (const subscriber of subscribers) subscriber(event);
  }

  return {
    getSelection: () => current,
    getLifecycle: () => lifecycle,
    select(selection) {
      const validation = validate(selection);
      if (!validation.valid) return { ok: false, errors: validation.errors };
      current = Object.freeze({ ...selection });
      lifecycle = current ? "SELECTED" : "NONE";
      notify({ type: "SELECTED", selection: current });
      return { ok: true, selection: current };
    },
    updateSelection(selection) {
      const validation = validate(selection);
      if (!validation.valid) return { ok: false, errors: validation.errors };
      current = Object.freeze({ ...selection });
      lifecycle = "UPDATED";
      notify({ type: "UPDATED", selection: current });
      return { ok: true, selection: current };
    },
    clearSelection(reason = "clear") {
      current = null;
      lifecycle = "CLEARED";
      notify({ type: "CLEARED", reason });
      return { ok: true, reason };
    },
    handleStaleFeature(featureId) {
      if (current?.featureId === featureId) return this.clearSelection("stale-feature");
      return { ok: true, reason: "not-selected" };
    },
    subscribe(handler) {
      subscribers.add(handler);
      return () => subscribers.delete(handler);
    },
  };
}

function createInteractionHarness() {
  const subscribersByType = new Map();
  const seenInteractionIds = new Set();

  return {
    subscribe(type, handler) {
      if (!subscribersByType.has(type)) subscribersByType.set(type, []);
      const subscriber = { type, handler };
      subscribersByType.get(type).push(subscriber);
      return () => {
        const subscribers = subscribersByType.get(type) || [];
        subscribersByType.set(type, subscribers.filter((entry) => entry !== subscriber));
      };
    },
    publish(event) {
      const validation = validateSpatialInteraction(event);
      if (!validation.valid) return { ok: false, errors: validation.errors, delivered: 0, failures: [] };
      if (seenInteractionIds.has(event.interactionId)) {
        return { ok: false, errors: [`duplicate interaction id: ${event.interactionId}`], delivered: 0, failures: [] };
      }
      seenInteractionIds.add(event.interactionId);
      const subscribers = subscribersByType.get(event.type) || [];
      const failures = [];
      let delivered = 0;
      for (const subscriber of subscribers) {
        try {
          subscriber.handler(event);
          delivered += 1;
        } catch (error) {
          failures.push(error);
        }
      }
      return { ok: failures.length === 0, errors: [], delivered, failures, correlationId: event.correlationId };
    },
  };
}

test("valid selection is accepted and malformed selection is rejected", () => {
  const feature = makeFeature();
  assert.equal(validateSpatialFeature(feature, {
    coordinateRegistry: defaultCoordinateSpaceRegistry,
    layerRegistry: defaultSpatialLayerRegistry,
  }).valid, true);
  const store = createSelectionHarness([feature]);
  assert.equal(store.select(makeSelection(feature)).ok, true);
  assert.equal(store.getLifecycle(), "SELECTED");
  const malformed = store.select({ ...makeSelection(feature), sourceAuthority: "" });
  assert.equal(malformed.ok, false);
  assert.ok(malformed.errors.some((error) => error.includes("sourceAuthority")));
});

test("unknown feature, wrong family, and wrong coordinate space are rejected", () => {
  const feature = makeFeature();
  const store = createSelectionHarness([feature]);
  assert.equal(store.select(makeSelection(feature, { featureId: "spatial:metaverse:location:metaverse-registry:missing" })).ok, false);
  assert.equal(store.select(makeSelection(feature, { coordinateFamily: COORDINATE_FAMILIES.REAL_WORLD })).ok, false);
  assert.equal(store.select(makeSelection(feature, { coordinateSpaceId: "metaverse.master-city" })).ok, false);
});

test("Quick Map selection cannot silently become master-city or REAL_WORLD", () => {
  const feature = makeFeature();
  const store = createSelectionHarness([feature]);
  assert.equal(store.select(makeSelection(feature)).ok, true);
  const masterCityUpdate = store.updateSelection(makeSelection(feature, { coordinateSpaceId: "metaverse.master-city" }));
  assert.equal(masterCityUpdate.ok, false);
  assert.equal(defaultCoordinateSpaceRegistry.assertNoImplicitTransform("metaverse.quick-map", "metaverse.master-city").ok, false);
  const realWorldUpdate = store.updateSelection(makeSelection(feature, { coordinateFamily: COORDINATE_FAMILIES.REAL_WORLD }));
  assert.equal(realWorldUpdate.ok, false);
});

test("clearing selection succeeds and domain records remain unchanged", () => {
  const domainRecord = Object.freeze({ id: "quick-map-location-001", status: "CANONICAL" });
  const feature = makeFeature();
  const store = createSelectionHarness([feature]);
  store.select(makeSelection(feature));
  assert.equal(store.clearSelection("user-clear").ok, true);
  assert.equal(store.getSelection(), null);
  assert.equal(store.getLifecycle(), "CLEARED");
  assert.deepEqual(domainRecord, { id: "quick-map-location-001", status: "CANONICAL" });
});

test("selection does not grant authorization or expose NOT_PUBLISHED features publicly", () => {
  const feature = makeFeature({
    publicationState: PUBLICATION_ELIGIBILITY_LEVELS.NOT_PUBLISHED,
    publicEligibility: eligibility({
      level: PUBLICATION_ELIGIBILITY_LEVELS.PUBLIC,
      publicationState: PUBLICATION_ELIGIBILITY_LEVELS.NOT_PUBLISHED,
    }),
  });
  const store = createSelectionHarness([feature]);
  assert.equal(store.select(makeSelection(feature)).ok, true);
  assert.equal(isPublicProjectionEligible(feature.publicEligibility), false);
  assert.equal("authorized" in store.getSelection(), false);
});

test("REQUEST_DOMAIN_ACTION remains separate from SELECT", () => {
  const feature = makeFeature();
  const select = makeInteraction(SPATIAL_INTERACTION_TYPES.SELECT, feature);
  const request = makeInteraction(SPATIAL_INTERACTION_TYPES.REQUEST_DOMAIN_ACTION, feature, {
    interactionId: "interaction-request-domain-action-001",
    requestedAction: { actionType: "open-domain-action-request", domain: feature.domain },
  });
  assert.notEqual(select.type, request.type);
  assert.equal("requestedAction" in select, false);
  assert.equal(request.requestedAction.domain, "metaverse");
});

test("interaction ids are unique and correlation ids are preserved", () => {
  const feature = makeFeature();
  const bus = createInteractionHarness();
  const event = makeInteraction(SPATIAL_INTERACTION_TYPES.SELECT, feature);
  const first = bus.publish(event);
  assert.equal(first.ok, true);
  assert.equal(first.correlationId, "correlation-001");
  const duplicate = bus.publish(event);
  assert.equal(duplicate.ok, false);
  assert.ok(duplicate.errors.some((error) => error.includes("duplicate interaction id")));
});

test("malformed and unknown interaction events are rejected", () => {
  const feature = makeFeature();
  const bus = createInteractionHarness();
  assert.equal(bus.publish(makeInteraction("UNKNOWN", feature)).ok, false);
  assert.equal(bus.publish(makeInteraction(SPATIAL_INTERACTION_TYPES.SELECT, feature, { sourceAuthority: "" })).ok, false);
});

test("subscriber failure does not corrupt selection state", () => {
  const feature = makeFeature();
  const store = createSelectionHarness([feature]);
  const bus = createInteractionHarness();
  bus.subscribe(SPATIAL_INTERACTION_TYPES.SELECT, () => {
    throw new Error("subscriber failed");
  });
  store.select(makeSelection(feature));
  const result = bus.publish(makeInteraction(SPATIAL_INTERACTION_TYPES.SELECT, feature));
  assert.equal(result.ok, false);
  assert.equal(result.failures.length, 1);
  assert.equal(store.getSelection().featureId, feature.featureId);
});

test("stale selection is handled safely", () => {
  const feature = makeFeature();
  const store = createSelectionHarness([feature]);
  store.select(makeSelection(feature));
  assert.equal(store.handleStaleFeature(feature.featureId).ok, true);
  assert.equal(store.getSelection(), null);
  assert.equal(store.getLifecycle(), "CLEARED");
});

test("duplicate subscription behavior is deterministic and no replay occurs by default", () => {
  const feature = makeFeature();
  const bus = createInteractionHarness();
  const calls = [];
  bus.subscribe(SPATIAL_INTERACTION_TYPES.SELECT, () => calls.push("first"));
  bus.subscribe(SPATIAL_INTERACTION_TYPES.SELECT, () => calls.push("second"));
  assert.equal(bus.publish(makeInteraction(SPATIAL_INTERACTION_TYPES.SELECT, feature)).delivered, 2);
  assert.deepEqual(calls, ["first", "second"]);

  const lateCalls = [];
  bus.subscribe(SPATIAL_INTERACTION_TYPES.SELECT, () => lateCalls.push("late"));
  assert.deepEqual(lateCalls, []);
});
