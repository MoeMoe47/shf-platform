import test from "node:test";
import assert from "node:assert/strict";
import { SEA_FINAL_ACCEPTANCE_ERRORS, SEA_FINAL_AUTHORITY_CHECKS, SEA_FINAL_EXR_HANDOFF, SEA_FINAL_GAP_DISPOSITIONS, SEA_FINAL_SERVICE_ACCEPTANCE, SEA_FINAL_TIER_A_TRACEABILITY } from "../src/system/sea/seaFinalAcceptance.js";

test("SEA-6 closes every gap with an allowed final disposition", () => {
  assert.equal(SEA_FINAL_GAP_DISPOSITIONS.length, 18);
  assert.equal(SEA_FINAL_ACCEPTANCE_ERRORS.length, 0);
  assert.ok(SEA_FINAL_GAP_DISPOSITIONS.every((entry) => !["OPEN", "UNKNOWN", "UNEXPLAINED_PARTIAL"].includes(entry.finalDisposition)));
});

test("SEA-6 accounts for all 40 service records", () => {
  assert.equal(SEA_FINAL_SERVICE_ACCEPTANCE.length, 40);
  assert.equal(new Set(SEA_FINAL_SERVICE_ACCEPTANCE.map((entry) => entry.service)).size, 40);
  assert.ok(SEA_FINAL_SERVICE_ACCEPTANCE.every((entry) => !["UNKNOWN", "PARTIAL", "MISSING"].includes(entry.finalState)));
});

test("all active Tier A services remain traceable", () => {
  assert.equal(SEA_FINAL_TIER_A_TRACEABILITY.length, 15);
  assert.ok(SEA_FINAL_TIER_A_TRACEABILITY.every((entry) => entry.result === "PASS"));
});

test("authority-negative acceptance remains green", () => {
  assert.equal(SEA_FINAL_AUTHORITY_CHECKS.length, 8);
  assert.ok(SEA_FINAL_AUTHORITY_CHECKS.every((entry) => entry.result === "PASS"));
});

test("EXR handoff is explicit and bounded", () => {
  assert.ok(SEA_FINAL_EXR_HANDOFF.length > 0);
  assert.ok(SEA_FINAL_EXR_HANDOFF.every((entry) => entry.notes && /^EXR-P[123]$/.test(entry.priority)));
});
