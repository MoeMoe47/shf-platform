import test from "node:test";
import assert from "node:assert/strict";
import { AX0_AUDIT_ERRORS, AX0_DUPLICATION_MATRIX, AX0_EXPERIENCE_MATRIX, AX0_GAPS, AX0_MATURITY, AX0_NO_OP_CONTROLS, AX0_RUNTIME_INVENTORY } from "../src/system/accessibility/ax0Audit.js";

test("AX-0 inventory covers runtime, experience, duplication, gaps, and maturity", () => {
  assert.equal(AX0_AUDIT_ERRORS.length, 0);
  assert.equal(AX0_RUNTIME_INVENTORY.length, 10);
  assert.equal(AX0_DUPLICATION_MATRIX.length, 11);
  assert.equal(AX0_EXPERIENCE_MATRIX.length, 16);
  assert.equal(AX0_MATURITY.length, 11);
});

test("AX-0 assigns every stable gap a severity, evidence, and future owner", () => {
  assert.equal(AX0_GAPS.length, 21);
  assert.equal(new Set(AX0_GAPS.map(([id]) => id)).size, AX0_GAPS.length);
  assert.ok(AX0_GAPS.every(([, severity, category, finding, evidence, owner]) => /^P[0-3]$/.test(severity) && category && finding && evidence && owner));
});

test("AX-0 distinguishes canonical personal profile from accommodation boundary", () => {
  const profile = AX0_RUNTIME_INVENTORY.find((entry) => entry.mechanism === "AccessibilityProfileProvider");
  assert.equal(profile.persisted, true);
  assert.match(profile.stateSource, /user_accessibility_profiles/);
  assert.match(AX0_GAPS.find(([id]) => id === "AX-GAP-004")[3], /Accommodation/);
});

test("AX-0 records connected scope-dependent controls without calling them silent no-ops", () => {
  assert.equal(AX0_NO_OP_CONTROLS.length, 2);
  assert.ok(AX0_NO_OP_CONTROLS.every((entry) => entry.status.startsWith("CONNECTED")));
});
