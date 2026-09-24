import assert from "node:assert/strict";
import test from "node:test";
import { CANONICAL_AUTHENTICATED_DESTINATIONS, isPublicBosDiscoveryRoute, resolveAuthenticatedDestination } from "../src/system/orientation/canonicalDestinationIdentity.js";

test("BOS authenticated route aliases resolve to one canonical OGL identity", () => {
  assert.equal(resolveAuthenticatedDestination("/hub"), CANONICAL_AUTHENTICATED_DESTINATIONS.BOS_HUB);
  assert.equal(resolveAuthenticatedDestination("admin.html#/hub"), CANONICAL_AUTHENTICATED_DESTINATIONS.BOS_HUB);
  assert.equal(resolveAuthenticatedDestination("/solutions.html#/bos"), null);
});

test("public Solutions discovery remains distinct from authenticated BOS guidance", () => {
  assert.equal(isPublicBosDiscoveryRoute("/solutions.html#/bos"), true);
  assert.equal(isPublicBosDiscoveryRoute("/solutions.html#/home"), false);
  assert.equal(isPublicBosDiscoveryRoute("/hub"), false);
});
