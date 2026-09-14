import assert from "node:assert/strict";
import test from "node:test";
import { EXR_FINAL_CAPABILITIES, EXR_FINAL_EXTERNAL_DEPENDENCIES, validateExrFinalAcceptance } from "../src/system/exr/exrFinalAcceptance.js";
import { EXR_NOTIFICATION_SLOTS } from "../src/system/exr/exrInformationArchitecture.js";
import { EXR4_JOURNEY_IDS } from "../src/system/exr/exrJourneyExperience.js";

test("EXR-5 final registry validates the completed local architecture", () => {
  assert.deepEqual(validateExrFinalAcceptance(), { valid: true, errors: [] });
  assert.equal(EXR_FINAL_CAPABILITIES.find((entry) => entry.id === "notification-slots").status, "STRUCTURAL_ONLY");
});

test("all priority journeys remain represented", () => {
  assert.equal(EXR4_JOURNEY_IDS.length, 11);
  assert.ok(EXR_FINAL_CAPABILITIES.some((entry) => entry.id === "priority-journeys"));
});

test("neutral notification slots remain the only EXR/NCA interface", () => {
  assert.deepEqual(EXR_NOTIFICATION_SLOTS, ["NOTIFICATION_BELL_SLOT", "ATTENTION_PROJECTION_SLOT", "INBOX_DESTINATION_SLOT"]);
  assert.ok(!EXR_NOTIFICATION_SLOTS.some((slot) => /unread|recipient|delivery|state/i.test(slot)));
});

test("external capabilities are honestly non-blocking", () => {
  assert.ok(EXR_FINAL_EXTERNAL_DEPENDENCIES.every((entry) => entry.blocks === false));
});
