import assert from "node:assert/strict";
import test from "node:test";
import {
  adaptHubTourDefinition,
  adaptSharedTourDefinition,
  validateOrientationContract,
} from "../src/system/orientation/orientationContract.js";
import {
  OGL_ORIENTATION_CONTRACTS,
  assertValidOrientationRegistry,
  validateOrientationRegistry,
} from "../src/system/orientation/orientationRegistry.js";

test("OGL-1 representative registry contracts validate", () => {
  assert.equal(OGL_ORIENTATION_CONTRACTS.length, 9);
  assert.equal(validateOrientationRegistry().valid, true);
  assert.doesNotThrow(() => assertValidOrientationRegistry());
});

test("registry uses canonical destinations and bounded safe action targets", () => {
  for (const contract of OGL_ORIENTATION_CONTRACTS) {
    assert.ok(contract.destinationId);
    for (const target of Object.values(contract.safeActions)) {
      assert.equal(target.mode, "ROUTE_TARGET");
      assert.equal("externalUrl" in target, false);
    }
  }
});

test("invalid registry definitions fail closed", () => {
  const invalid = structuredClone(OGL_ORIENTATION_CONTRACTS[0]);
  invalid.destinationId = "unknown-destination";
  invalid.owner = { orientationOwner: "" };
  invalid.tours[0].steps[0].target = { mode: "ROUTE_TARGET", routeId: "unsafe", externalUrl: "javascript:alert(1)" };
  const result = validateOrientationContract(invalid);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("destinationId")));
  assert.ok(result.errors.some((error) => error.includes("externalUrl")));
});

test("critical guided experiences require an accessible non-tour alternative", () => {
  const invalid = structuredClone(OGL_ORIENTATION_CONTRACTS[1]);
  invalid.tours[0].accessibleAlternativeRef = null;
  invalid.accessibility.nonTourAlternative = true;
  const result = validateOrientationContract(invalid);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("accessibleAlternativeRef")));
});

test("shared and Hub legacy tour definitions map to the canonical step shape", () => {
  const shared = adaptSharedTourDefinition({ id: "shared-tour", steps: [{ id: "intro", content: "Welcome", target: { mode: "UNANCHORED" } }] }, "orientation:test");
  const hub = adaptHubTourDefinition({ pageKey: "hub-page", steps: [{ id: "queue", title: "Queue", description: "Review work", target: { mode: "SEMANTIC_ANCHOR", anchorId: "queue" } }] }, "orientation:test");
  assert.equal(shared.tourId, "shared-tour");
  assert.equal(shared.steps[0].stepId, "intro");
  assert.equal(hub.tourId, "hub-page");
  assert.equal(hub.steps[0].target.anchorId, "queue");
});

test("orientation experience state is not an institutional completion source", () => {
  for (const contract of OGL_ORIENTATION_CONTRACTS) {
    for (const item of contract.checklist || []) assert.notEqual(item.completionSource, "USER_EXPERIENCE_STATE");
  }
});
