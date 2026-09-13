import test from "node:test";
import assert from "node:assert/strict";
import { ACCESSIBILITY_FINAL_ACCEPTANCE, hasNoOpenLocalGaps } from "../src/system/accessibility/accessibilityFinalAcceptance.js";

test("final registry reconciles all 21 AX gaps", () => {
  assert.equal(ACCESSIBILITY_FINAL_ACCEPTANCE.gaps.length, 21);
  assert.equal(hasNoOpenLocalGaps(), true);
  assert.equal(ACCESSIBILITY_FINAL_ACCEPTANCE.gaps.at(-1).state, "DEFERRED_TO_EXR");
});

test("canonical owners remain unique through AX-6", () => {
  assert.deepEqual(Object.keys(ACCESSIBILITY_FINAL_ACCEPTANCE.canonicalOwners), ["runtime", "profile", "alternativeContent", "accommodations", "assurance", "operations"]);
});

test("unsupported capabilities are not represented as locally ready", () => {
  const external = ACCESSIBILITY_FINAL_ACCEPTANCE.capabilities.filter((capability) => capability.externalDependency);
  assert.ok(external.length >= 3);
  assert.ok(external.every((capability) => capability.validation !== "PASS"));
});

test("final registry preserves migration and browser evidence", () => {
  assert.equal(ACCESSIBILITY_FINAL_ACCEPTANCE.migrationHead, 142);
  assert.equal(ACCESSIBILITY_FINAL_ACCEPTANCE.browserEvidence.ax4AndAx6, "17/17 PASS");
});
