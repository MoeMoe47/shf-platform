import assert from "node:assert/strict";
import test from "node:test";

import {
  COMMAND_CENTER_SPATIAL_VIEW_ALLOWED_FIELDS,
  COMMAND_CENTER_SPATIAL_VIEW_STATE_RULES,
  createCommandCenterSpatialView,
} from "../src/system/spatial/commandCenter/viewModel.js";

test("W8B-VM-01 freezes client-safe CommandCenterSpatialView fields", () => {
  assert.deepEqual(COMMAND_CENTER_SPATIAL_VIEW_ALLOWED_FIELDS, [
    "kind",
    "viewId",
    "label",
    "coordinateFamily",
    "coordinateSpace",
    "qualifiedClientId",
    "clientStatus",
    "layerSummaries",
    "visibleFeatureSummaries",
    "selectedFeatureSummary",
    "relationshipSummaries",
    "intelligenceSummaries",
    "evidenceSummaries",
    "temporalSummary",
    "freshnessSummary",
    "limitations",
    "authorityBoundary",
    "systemStatus",
  ]);
});

test("W8B-VM-02 freezes unknown, unavailable, and unqualified state preservation", () => {
  assert.deepEqual(COMMAND_CENTER_SPATIAL_VIEW_STATE_RULES, {
    unknownRemainsUnknown: true,
    unavailableRemainsUnavailable: true,
    unqualifiedRemainsUnqualified: true,
    fakePopulatedValuesRequired: false,
  });
});

test("W8B-VM-03 creates only client-safe spatial views from existing sanitized inputs", () => {
  const view = createCommandCenterSpatialView({
    qualifiedClientId: "metaverse-regional-scene-oil-rig",
    coordinateSpace: "metaverse.regional-scene",
    systemStatus: "UNKNOWN",
  });
  assert.equal(view.kind, "CommandCenterSpatialView");
  assert.equal(view.systemStatus, "UNKNOWN");
  assert.deepEqual(Object.keys(view).sort(), [...COMMAND_CENTER_SPATIAL_VIEW_ALLOWED_FIELDS].sort());
});
