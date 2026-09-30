import assert from "node:assert/strict";
import test from "node:test";

async function panel() {
  return import("../src/components/metaverse/RegionalSceneSpatialIntelligencePanel.jsx");
}

test("panel module exposes the regional inspection surface", async () => {
  const module = await panel();
  assert.equal(typeof module.default, "function");
});

test("inspection activation is represented by a keyboard-operable button", async () => {
  const { getRegionalSceneSpatialIntelligenceAccessibilityContract } = await panel();
  const contract = getRegionalSceneSpatialIntelligenceAccessibilityContract();
  assert.equal(contract.activationRole, "button");
  assert.equal(contract.keyboardOperable, true);
});

test("inspection result uses a semantic live status region", async () => {
  const { getRegionalSceneSpatialIntelligenceAccessibilityContract } = await panel();
  const contract = getRegionalSceneSpatialIntelligenceAccessibilityContract();
  assert.equal(contract.resultRole, "status");
  assert.equal(contract.live, "polite");
});

test("relationship and value are understandable without color or motion", async () => {
  const { getRegionalSceneSpatialIntelligenceAccessibilityContract } = await panel();
  const contract = getRegionalSceneSpatialIntelligenceAccessibilityContract();
  assert.equal(contract.requiresColor, false);
  assert.equal(contract.requiresMotion, false);
  assert.equal(contract.visibleFocus, true);
});

test("loading, empty, and failure states have deterministic accessible text", async () => {
  const { getRegionalSceneSpatialIntelligenceAccessibilityContract } = await panel();
  const contract = getRegionalSceneSpatialIntelligenceAccessibilityContract();
  assert.deepEqual(contract.states, ["loading", "empty", "failure", "result"]);
  assert.equal(contract.deterministicText, true);
});

test("reduced motion is supported without changing the result contract", async () => {
  const { getRegionalSceneSpatialIntelligenceAccessibilityContract } = await panel();
  assert.equal(getRegionalSceneSpatialIntelligenceAccessibilityContract().reducedMotionSafe, true);
});

test("the inspection surface does not require pointer-only activation", async () => {
  const { getRegionalSceneSpatialIntelligenceAccessibilityContract } = await panel();
  assert.equal(getRegionalSceneSpatialIntelligenceAccessibilityContract().pointerOnly, false);
});

test("the panel has a screen-reader meaningful label", async () => {
  const { getRegionalSceneSpatialIntelligenceAccessibilityContract } = await panel();
  assert.equal(getRegionalSceneSpatialIntelligenceAccessibilityContract().accessibleName, "Spatial Intelligence");
});
