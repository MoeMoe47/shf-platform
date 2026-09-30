import assert from "node:assert/strict";
import test from "node:test";

import {
  COMMAND_CENTER_PROHIBITED_AUTHORITIES,
  COMMAND_CENTER_PROHIBITED_EXPORTS,
  SPATIAL_COMMAND_CENTER_ARCHITECTURE_CONTRACT,
} from "../src/system/spatial/commandCenter/index.js";

test("W8B-ARCH-01 declares Command Center as composition-only, never an authority", () => {
  assert.equal(SPATIAL_COMMAND_CENTER_ARCHITECTURE_CONTRACT.wave, "8B");
  assert.equal(SPATIAL_COMMAND_CENTER_ARCHITECTURE_CONTRACT.runtimeRole, "COMPOSE_EXISTING_SANITIZED_SPATIAL_PROJECTIONS");
  assert.equal(SPATIAL_COMMAND_CENTER_ARCHITECTURE_CONTRACT.sourceAuthority, false);
  assert.equal(SPATIAL_COMMAND_CENTER_ARCHITECTURE_CONTRACT.transformAuthority, false);
  assert.equal(SPATIAL_COMMAND_CENTER_ARCHITECTURE_CONTRACT.publicationAuthority, false);
});

test("W8B-ARCH-02 freezes all authorities Command Center must not become", () => {
  assert.deepEqual(COMMAND_CENTER_PROHIBITED_AUTHORITIES, [
    "source",
    "domain",
    "policy",
    "navigation",
    "publication",
    "authorization",
    "eligibility",
    "jurisdiction",
    "service-area",
    "dispatch",
    "traffic",
    "water",
    "transit",
    "metric",
    "transform",
  ]);
});

test("W8B-ARCH-03 prohibits authority-equivalent future exports", () => {
  assert.deepEqual(COMMAND_CENTER_PROHIBITED_EXPORTS, [
    "authorize",
    "approve",
    "determineEligibility",
    "assignJurisdiction",
    "assignServiceArea",
    "dispatch",
    "routeTraffic",
    "routeWater",
    "routeTransit",
    "publish",
    "transformCoordinates",
    "convertCoordinateSpace",
    "mutateDomainRecord",
    "establishMetricTruth",
  ]);
});
