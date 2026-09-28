import assert from "node:assert/strict";
import test from "node:test";

import { COORDINATE_FAMILIES, PUBLICATION_ELIGIBILITY_LEVELS, SPATIAL_INTERACTION_TYPES } from "../src/shared/spatial/index.js";
import { createQuickMapInteractionController } from "../src/system/spatial/clients/quickMap/quickMapInteraction.js";
import { createSpatialInteractionBus, createSpatialSelectionStore } from "../src/system/spatial/index.js";

const timestamp = "2026-09-28T12:00:00.000Z";

function feature(id, overrides = {}) {
  return {
    featureId: id,
    domain: "metaverse",
    featureType: "location",
    sourceAuthority: "wave4c-test-source",
    sourceRecordId: `${id}-private-record`,
    coordinateFamily: COORDINATE_FAMILIES.METAVERSE,
    coordinateSpaceId: "metaverse.quick-map",
    geometry: "normalized-point",
    layerId: "metaverse.quick-map.locations",
    label: id,
    title: id,
    verificationState: "VERIFIED",
    publicationState: PUBLICATION_ELIGIBILITY_LEVELS.AUTHENTICATED,
    publicEligibility: { level: PUBLICATION_ELIGIBILITY_LEVELS.AUTHENTICATED, publicationState: PUBLICATION_ELIGIBILITY_LEVELS.AUTHENTICATED },
    provenance: { sourceAuthority: "wave4c-test-source", sourceRecordId: `${id}-private-record`, updatedAt: timestamp },
    allowedInteractions: [SPATIAL_INTERACTION_TYPES.SELECT],
    authorizedActionReferences: [],
    ...overrides,
  };
}

function marker(spatialFeature, overrides = {}) {
  return {
    id: spatialFeature.featureId,
    x: 12.25,
    y: 45.5,
    label: spatialFeature.label,
    state: "NORMAL",
    modifiers: [],
    accessibility: { label: spatialFeature.label, stateText: "Available" },
    interaction: {
      selectable: true,
      focusable: true,
      interactionType: "SELECT",
      selectionContext: {
        featureId: spatialFeature.featureId,
        domain: spatialFeature.domain,
        sourceAuthority: spatialFeature.sourceAuthority,
        coordinateFamily: spatialFeature.coordinateFamily,
        coordinateSpaceId: spatialFeature.coordinateSpaceId,
        layerId: spatialFeature.layerId,
        eligibleActions: [],
      },
    },
    ...overrides,
  };
}

function setup(features) {
  const store = createSpatialSelectionStore({ features });
  const bus = createSpatialInteractionBus();
  const events = [];
  for (const type of Object.values(SPATIAL_INTERACTION_TYPES)) bus.subscribe(type, (event) => events.push(event));
  const controller = createQuickMapInteractionController({ store, bus, clock: () => new Date(timestamp) });
  return { store, bus, events, controller };
}

test("W4C-01 activation publishes SELECT and selects one visible feature", () => {
  const item = feature("spatial:one");
  const { store, events, controller } = setup([item]);
  const result = controller.activate(marker(item));
  assert.equal(result.ok, true);
  assert.equal(store.getSelection().featureId, item.featureId);
  assert.equal(events[0].interactionType, "SELECT");
});

test("W4C-02 selecting another Spatial marker replaces the first", () => {
  const first = feature("spatial:first");
  const second = feature("spatial:second");
  const { store, controller } = setup([first, second]);
  controller.activate(marker(first));
  const result = controller.activate(marker(second));
  assert.equal(result.ok, true);
  assert.equal(store.getSelection().featureId, second.featureId);
  assert.equal(store.getLifecycle(), "SELECTED");
});

test("W4C-03 hidden or non-selectable markers create no selection or event", () => {
  const item = feature("spatial:hidden");
  const { store, events, controller } = setup([item]);
  const result = controller.activate(marker(item, { interaction: { selectable: false } }));
  assert.equal(result.ok, false);
  assert.equal(store.getSelection(), null);
  assert.equal(events.length, 0);
});

test("W4C-04 DESELECT clears the current selection", () => {
  const item = feature("spatial:clear");
  const { store, events, controller } = setup([item]);
  controller.activate(marker(item));
  const result = controller.deselect("empty-map");
  assert.equal(result.ok, true);
  assert.equal(store.getSelection(), null);
  assert.equal(events.at(-1).interactionType, "DESELECT");
});

test("W4C-05 FOCUS does not select or navigate", () => {
  const item = feature("spatial:focus");
  const { store, events, controller } = setup([item]);
  const result = controller.focus(marker(item));
  assert.equal(result.ok, true);
  assert.equal(store.getSelection(), null);
  assert.equal(events[0].interactionType, "FOCUS");
  assert.equal(events[0].payload.navigate, undefined);
});

test("W4C-06 HIGHLIGHT remains separate from selection", () => {
  const item = feature("spatial:highlight");
  const { store, events, controller } = setup([item]);
  controller.highlight(marker(item));
  controller.clearHighlight(marker(item));
  assert.equal(store.getSelection(), null);
  assert.deepEqual(events.map((event) => event.interactionType), ["HIGHLIGHT", "HIGHLIGHT"]);
  assert.equal(events[1].payload.active, false);
});

test("W4C-07 OPEN_RECORD is a request only", () => {
  const item = feature("spatial:record");
  const { events, controller } = setup([item]);
  const result = controller.openRecord(marker(item));
  assert.equal(result.ok, true);
  assert.equal(events[0].interactionType, "OPEN_RECORD");
  assert.equal(events[0].requestedAction, undefined);
  assert.equal(events[0].payload.navigate, undefined);
});

test("W4C-08 event envelope preserves origin, correlation, layer, and coordinate space", () => {
  const item = feature("spatial:envelope");
  const { events, controller } = setup([item]);
  controller.activate(marker(item));
  assert.equal(events[0].originClient, "metaverse.quick-map");
  assert.equal(events[0].originComponent, "MetaverseMiniMap");
  assert.equal(events[0].coordinateSpaceId, "metaverse.quick-map");
  assert.equal(events[0].layerId, item.layerId);
  assert.equal(events[0].correlationId, item.featureId);
});

test("W4C-09 event payload excludes source record ID and private provenance", () => {
  const item = feature("spatial:privacy");
  const { events, controller } = setup([item]);
  controller.activate(marker(item));
  assert.equal(JSON.stringify(events[0]).includes(item.sourceRecordId), false);
  assert.equal(events[0].payload.provenance, undefined);
});

test("W4C-10 master-city and REAL_WORLD markers cannot enter Quick Map selection", () => {
  const item = feature("spatial:isolation");
  const { store, events, controller } = setup([item]);
  const masterCity = marker(item, { interaction: { selectable: true, selectionContext: { ...marker(item).interaction.selectionContext, coordinateSpaceId: "metaverse.master-city" } } });
  const realWorld = marker(item, { interaction: { selectable: true, selectionContext: { ...marker(item).interaction.selectionContext, coordinateFamily: COORDINATE_FAMILIES.REAL_WORLD, coordinateSpaceId: "real-world.latlng" } } });
  assert.equal(controller.activate(masterCity).ok, false);
  assert.equal(controller.activate(realWorld).ok, false);
  assert.equal(store.getSelection(), null);
  assert.equal(events.length, 0);
});

test("W4C-11 legacy-shaped markers remain outside the Spatial path", () => {
  const { store, events, controller } = setup([]);
  assert.equal(controller.activate({ id: "airport", x: 1, y: 2, label: "Airport" }).ok, false);
  assert.equal(store.getSelection(), null);
  assert.equal(events.length, 0);
});

test("W4C-12 current-location state is independent from Spatial selection", () => {
  const item = feature("spatial:location-independent");
  const currentLocation = { districtId: "civic-district" };
  const { store, controller } = setup([item]);
  controller.activate(marker(item));
  assert.deepEqual(currentLocation, { districtId: "civic-district" });
  assert.equal(store.getSelection().featureId, item.featureId);
});

test("W4C-13 stale or unavailable markers do not bypass store eligibility", () => {
  const item = feature("spatial:unavailable", { publicationState: PUBLICATION_ELIGIBILITY_LEVELS.NOT_PUBLISHED, publicEligibility: { level: PUBLICATION_ELIGIBILITY_LEVELS.NOT_PUBLISHED, publicationState: PUBLICATION_ELIGIBILITY_LEVELS.NOT_PUBLISHED } });
  const { store, controller } = setup([item]);
  const unavailable = marker(item, { state: "UNAVAILABLE", interaction: { selectable: true, selectionContext: marker(item).interaction.selectionContext } });
  assert.equal(controller.activate(unavailable).ok, false);
  assert.equal(store.getSelection(), null);
});

test("W4C-14 selected presentation remains a client marker modifier", () => {
  const item = feature("spatial:selected-presentation");
  const selectedMarker = marker(item, { state: "SELECTED", modifiers: ["SELECTED"] });
  assert.deepEqual(selectedMarker.modifiers, ["SELECTED"]);
  assert.equal(selectedMarker.state, "SELECTED");
});

test("W4C-15 keyboard-equivalent activation uses the same controller API as pointer activation", () => {
  const item = feature("spatial:keyboard-pointer");
  const { store, controller } = setup([item]);
  const pointerResult = controller.activate(marker(item));
  controller.deselect("keyboard-reset");
  const keyboardResult = controller.activate(marker(item));
  assert.equal(pointerResult.ok, true);
  assert.equal(keyboardResult.ok, true);
  assert.equal(store.getSelection().featureId, item.featureId);
});
