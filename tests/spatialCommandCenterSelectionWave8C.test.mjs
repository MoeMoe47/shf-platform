import assert from "node:assert/strict";
import test from "node:test";

import {
  COMMAND_CENTER_PRESENTATION_EVENTS,
  COMMAND_CENTER_PROHIBITED_STATE_EXPORTS,
  createCommandCenterSelectionCoordinator,
} from "../src/system/spatial/commandCenter/selectionCoordinator.js";

const quickMapFeature = Object.freeze({
  featureId: "spatial:metaverse:location:quick-map-a",
  layerId: "metaverse.quick-map.locations",
  coordinateFamily: "METAVERSE",
  coordinateSpaceId: "metaverse.quick-map",
  publicationState: "AUTHENTICATED",
  publicEligibility: Object.freeze({ level: "AUTHENTICATED", publicationState: "AUTHENTICATED" }),
});

const oilRigFeature = Object.freeze({
  featureId: "spatial:metaverse:regional-scene:oil-rig",
  layerId: "metaverse.regional-scenes",
  coordinateFamily: "METAVERSE",
  coordinateSpaceId: "metaverse.regional-scene",
  publicationState: "AUTHENTICATED",
  publicEligibility: Object.freeze({ level: "AUTHENTICATED", publicationState: "AUTHENTICATED" }),
});

test("W8C-SELECTION-01 coordinates same-workspace selection as presentation state only", () => {
  const coordinator = createCommandCenterSelectionCoordinator({
    workspaces: [
      {
        workspaceId: "workspace-quick-map",
        qualifiedClientId: "metaverse-quick-map",
        coordinateFamily: "METAVERSE",
        coordinateSpace: "metaverse.quick-map",
        features: [quickMapFeature],
      },
    ],
  });

  const result = coordinator.selectFeature({
    workspaceId: "workspace-quick-map",
    featureId: quickMapFeature.featureId,
    layerId: quickMapFeature.layerId,
    coordinateFamily: quickMapFeature.coordinateFamily,
    coordinateSpace: quickMapFeature.coordinateSpaceId,
    reason: "keyboard",
  });

  assert.equal(result.ok, true);
  assert.equal(result.snapshot.activeSelection.workspaceId, "workspace-quick-map");
  assert.equal(result.snapshot.activeSelection.featureId, quickMapFeature.featureId);
  assert.equal("geometry" in result.snapshot.activeSelection, false);
  assert.equal("sourceRecord" in result.snapshot.activeSelection, false);
  assert.equal("evidenceReferences" in result.snapshot.activeSelection, false);
  assert.equal("navigationTarget" in result, false);
  assert.equal("domainMutation" in result, false);
});

test("W8C-SELECTION-02 rejects hidden, restricted, unknown, and cross-space selection", () => {
  const coordinator = createCommandCenterSelectionCoordinator({
    workspaces: [
      {
        workspaceId: "workspace-quick-map",
        qualifiedClientId: "metaverse-quick-map",
        coordinateFamily: "METAVERSE",
        coordinateSpace: "metaverse.quick-map",
        features: [
          quickMapFeature,
          {
            ...quickMapFeature,
            featureId: "spatial:metaverse:location:hidden",
            publicationState: "HIDDEN",
            publicEligibility: { level: "HIDDEN", publicationState: "HIDDEN" },
          },
        ],
      },
      {
        workspaceId: "workspace-oil-rig",
        qualifiedClientId: "metaverse-regional-scene-oil-rig",
        coordinateFamily: "METAVERSE",
        coordinateSpace: "metaverse.regional-scene",
        features: [oilRigFeature],
      },
    ],
  });

  assert.equal(coordinator.selectFeature({
    workspaceId: "workspace-quick-map",
    featureId: "spatial:metaverse:location:hidden",
    layerId: "metaverse.quick-map.locations",
    coordinateFamily: "METAVERSE",
    coordinateSpace: "metaverse.quick-map",
  }).ok, false);

  assert.equal(coordinator.selectFeature({
    workspaceId: "workspace-quick-map",
    featureId: oilRigFeature.featureId,
    layerId: oilRigFeature.layerId,
    coordinateFamily: "METAVERSE",
    coordinateSpace: "metaverse.regional-scene",
  }).ok, false);

  assert.equal(coordinator.selectFeature({
    workspaceId: "workspace-quick-map",
    featureId: "spatial:missing",
    layerId: "metaverse.quick-map.locations",
    coordinateFamily: "METAVERSE",
    coordinateSpace: "metaverse.quick-map",
  }).ok, false);
});

test("W8C-SELECTION-03 freezes safe clear, highlight, event, authority, and immutability boundaries", () => {
  assert.deepEqual(COMMAND_CENTER_PRESENTATION_EVENTS, [
    "SELECTION_CHANGED",
    "SELECTION_CLEARED",
    "HIGHLIGHT_CHANGED",
  ]);
  assert.deepEqual(COMMAND_CENTER_PROHIBITED_STATE_EXPORTS, [
    "authorize",
    "approve",
    "publish",
    "navigate",
    "changeScene",
    "dispatch",
    "routeTraffic",
    "routeWater",
    "routeTransit",
    "transformCoordinates",
    "convertCoordinateSpace",
    "assignJurisdiction",
    "assignServiceArea",
    "determineEligibility",
    "mutateDomainRecord",
    "establishMetricTruth",
  ]);

  const coordinator = createCommandCenterSelectionCoordinator({
    workspaces: [{
      workspaceId: "workspace-quick-map",
      qualifiedClientId: "metaverse-quick-map",
      coordinateFamily: "METAVERSE",
      coordinateSpace: "metaverse.quick-map",
      features: [quickMapFeature],
    }],
  });

  assert.equal(coordinator.highlightFeatures({
    workspaceId: "workspace-quick-map",
    featureIds: [quickMapFeature.featureId],
    source: "FOCUS",
  }).ok, true);
  assert.equal(Object.isFrozen(coordinator.snapshot()), true);
  assert.equal(Object.isFrozen(coordinator.snapshot().highlightedFeatureIds), true);
  assert.equal(coordinator.clearSelection("escape-key").ok, true);
  assert.equal(coordinator.snapshot().activeSelection, null);
});
