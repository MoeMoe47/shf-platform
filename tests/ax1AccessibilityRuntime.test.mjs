import test from "node:test";
import assert from "node:assert/strict";
import {
  ACCESSIBILITY_CAPABILITIES,
  ACCESSIBILITY_CONSTITUTION_ERRORS,
  ACCESSIBILITY_RUNTIME_CONTRACT,
  ACCESSIBILITY_RUNTIME_OWNER,
  AUTHORITY_BOUNDARIES,
  EFFECTIVE_PREFERENCE_PRECEDENCE,
  PREFERENCE_SOURCES,
  RUNTIME_MECHANISMS,
} from "../src/system/accessibility/accessibilityConstitution.js";

test("AX-1 has one canonical runtime and a shared root mount", () => {
  assert.deepEqual(ACCESSIBILITY_CONSTITUTION_ERRORS, []);
  assert.equal(ACCESSIBILITY_RUNTIME_OWNER.mount, "src/entries/RootProviders.jsx");
  assert.equal(RUNTIME_MECHANISMS.filter((item) => item.treatment === "CANONICAL").length, 2);
});

test("runtime contract exposes normalized state without domain authority", () => {
  assert.ok(ACCESSIBILITY_RUNTIME_CONTRACT.state.includes("effectivePreferences"));
  assert.ok(ACCESSIBILITY_RUNTIME_CONTRACT.operations.includes("setPreference"));
  assert.match(ACCESSIBILITY_RUNTIME_CONTRACT.accommodationIsolation, /never merged/);
  assert.ok(AUTHORITY_BOUNDARIES.cannot.includes("Evidence"));
  assert.ok(AUTHORITY_BOUNDARIES.cannot.includes("Truth"));
});

test("preference precedence and sources are deterministic", () => {
  assert.deepEqual(EFFECTIVE_PREFERENCE_PRECEDENCE, ["USER_PROFILE", "SESSION", "SYSTEM", "ORGANIZATION_DEFAULT", "PRODUCT_DEFAULT"]);
  assert.ok(PREFERENCE_SOURCES.includes("NOT_AVAILABLE"));
  assert.ok(!PREFERENCE_SOURCES.includes("ACCOMMODATION"));
});

test("capability vocabulary uses bounded support statuses", () => {
  assert.equal(new Set(ACCESSIBILITY_CAPABILITIES.map((item) => item.key)).size, ACCESSIBILITY_CAPABILITIES.length);
  assert.ok(ACCESSIBILITY_CAPABILITIES.some((item) => item.key === "reducedMotion" && item.status === "SUPPORTED"));
  assert.ok(ACCESSIBILITY_CAPABILITIES.some((item) => item.key === "textScale" && item.status === "PARTIAL"));
  assert.ok(ACCESSIBILITY_CAPABILITIES.some((item) => item.key === "preferredAlternativeFormat" && item.status === "FUTURE_PHASE"));
});

test("legacy mechanisms are explicitly classified as adapters, local, or deprecated", () => {
  assert.ok(RUNTIME_MECHANISMS.some((item) => item.treatment === "ADAPTER_TO_CANONICAL"));
  assert.ok(RUNTIME_MECHANISMS.some((item) => item.treatment === "KEEP_LOCAL_BY_DESIGN"));
  assert.ok(RUNTIME_MECHANISMS.some((item) => item.treatment === "DEPRECATED"));
  assert.ok(RUNTIME_MECHANISMS.every((item) => item.file && item.treatment));
});

test("public fallback is profile-independent and profile scope is user-owned", () => {
  assert.match(ACCESSIBILITY_RUNTIME_OWNER.publicFallback, /no authenticated profile required/);
  assert.equal(ACCESSIBILITY_RUNTIME_OWNER.persistenceOwner, "accessibility-profile-domain");
});

test("integration boundaries preserve SEA, OGL, DGAL and Companion authority", () => {
  assert.match(ACCESSIBILITY_RUNTIME_CONTRACT.accommodationIsolation, /institutional accommodation/);
  assert.match(AUTHORITY_BOUNDARIES.cannot.join(" "), /OGL workflow/);
  assert.match(AUTHORITY_BOUNDARIES.cannot.join(" "), /DGAL signatures/);
  assert.match(AUTHORITY_BOUNDARIES.cannot.join(" "), /release/);
});
