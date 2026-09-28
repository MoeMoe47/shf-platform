import assert from "node:assert/strict";
import test from "node:test";

import { toQuickMapAccessibleItems } from "../src/system/spatial/clients/quickMap/accessibility.js";

function marker(overrides = {}) {
  return {
    id: "spatial:quick-map:test",
    x: 12.25,
    y: 45.5,
    label: "Test location",
    state: "NORMAL",
    modifiers: [],
    accessibility: { label: "Test location", stateText: "Available" },
    interaction: { selectable: true, focusable: true, interactionType: "SELECT" },
    ...overrides,
  };
}

test("W4D-01 accessible item preserves safe identity and label", () => {
  const [item] = toQuickMapAccessibleItems([marker()]);
  assert.deepEqual(item, {
    id: "spatial:quick-map:test",
    label: "Test location",
    state: "NORMAL",
    modifiers: [],
    accessibility: { label: "Test location", stateText: "Available" },
    interaction: { selectable: true, focusable: true, interactionType: "SELECT" },
  });
});

test("W4D-02 selected state is represented in the shared safe model", () => {
  const [item] = toQuickMapAccessibleItems([marker({ state: "SELECTED", modifiers: ["SELECTED"] })]);
  assert.equal(item.state, "SELECTED");
  assert.deepEqual(item.modifiers, ["SELECTED"]);
});

test("W4D-03 stale and unavailable state text remains available", () => {
  const [stale, unavailable] = toQuickMapAccessibleItems([
    marker({ state: "STALE", accessibility: { label: "Old location", stateText: "May be out of date", freshnessText: "Stale" }, modifiers: ["STALE"] }),
    marker({ id: "spatial:unavailable", state: "UNAVAILABLE", accessibility: { label: "Unavailable location", stateText: "Unavailable", unavailableText: "Not available" }, interaction: { selectable: false, focusable: true, interactionType: "FOCUS" } }),
  ]);
  assert.equal(stale.accessibility.freshnessText, "Stale");
  assert.equal(unavailable.accessibility.unavailableText, "Not available");
  assert.equal(unavailable.interaction.selectable, false);
});

test("W4D-04 hidden and restricted items are not represented", () => {
  assert.deepEqual(toQuickMapAccessibleItems([]), []);
});

test("W4D-05 private fields never enter non-map items", () => {
  const [item] = toQuickMapAccessibleItems([marker({ sourceRecordId: "private", provenance: { secret: true }, evidence: "private" })]);
  assert.equal("sourceRecordId" in item, false);
  assert.equal("provenance" in item, false);
  assert.equal("evidence" in item, false);
});

test("W4D-06 list interaction metadata matches the safe marker intent", () => {
  const source = marker({ interaction: { selectable: true, focusable: true, interactionType: "SELECT" } });
  const [item] = toQuickMapAccessibleItems([source]);
  assert.deepEqual(item.interaction, source.interaction);
});

test("W4D-12 invalid source entries fail closed", () => {
  assert.throws(() => toQuickMapAccessibleItems([null]));
  assert.throws(() => toQuickMapAccessibleItems([{ id: "missing-safe-fields" }]));
});

test("W4D-14 current-location data is not created by the accessibility projection", () => {
  const [item] = toQuickMapAccessibleItems([marker()]);
  assert.equal("currentLocation" in item, false);
  assert.equal("isYou" in item, false);
});
