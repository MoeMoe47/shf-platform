import assert from "node:assert/strict";
import test from "node:test";

import {
  SPATIAL_COMMAND_CENTER_UI_ALLOWED_ACTIONS,
  SPATIAL_COMMAND_CENTER_UI_PROHIBITED_ACTIONS,
  SPATIAL_COMMAND_CENTER_UI_WORKSPACE_SWITCHING_CONTRACT,
} from "../src/pages/spatial-command-center/SpatialCommandCenterPage.jsx";

test("W8D-AUTH-01 freezes UI as presentation and orchestration only", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_UI_ALLOWED_ACTIONS, [
    "activate workspace",
    "toggle presentation layer visibility",
    "select presentation feature",
    "clear presentation selection",
    "set presentation highlight",
    "clear presentation highlight",
    "open contextual panel",
    "close contextual panel",
  ]);
});

test("W8D-AUTH-02 prohibits authority-bearing UI actions", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_UI_PROHIBITED_ACTIONS, [
    "authorize",
    "approve",
    "publish",
    "navigate route automatically",
    "change scene",
    "dispatch",
    "route traffic",
    "route water",
    "route transit",
    "transform coordinates",
    "convert coordinate space",
    "assign jurisdiction",
    "assign service area",
    "determine eligibility",
    "mutate domain record",
    "establish metric truth",
  ]);
});

test("W8D-AUTH-03 freezes workspace switching as Wave 8C presentation state only", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_UI_WORKSPACE_SWITCHING_CONTRACT, {
    usesWave8CWorkspaceState: true,
    automaticallyNavigatesRoutes: false,
    transformsCoordinates: false,
    copiesIncompatibleSelection: false,
    changesQualification: false,
    mutatesSourceState: false,
    selectionRemainsWorkspaceIsolated: true,
  });
});
