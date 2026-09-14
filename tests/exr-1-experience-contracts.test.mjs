import test from "node:test";
import assert from "node:assert/strict";
import {
  EXR_ACCESSIBILITY_PLACEMENT_CONTRACT,
  EXR_CAPABILITY_EXPOSURE_CONTRACTS,
  EXR_HUB_CONTRACT,
  EXR_REPORTING_ENTRY_CONTRACT,
  EXR_SHELL_OWNERSHIP_CONTRACT,
  getReturnTarget,
  resolveCapabilityState,
} from "../src/system/exr/exrExperienceContracts.js";

test("EXR-1 locks Hub as an SHS/BOS organization operating environment", () => {
  assert.equal(EXR_HUB_CONTRACT.owner, "SHS/BOS");
  assert.ok(EXR_HUB_CONTRACT.excluded.includes("generic ecosystem super-dashboard"));
});

test("EXR-1 capability exposure is bounded by explicit states", () => {
  assert.ok(EXR_CAPABILITY_EXPOSURE_CONTRACTS.length >= 10);
  assert.equal(resolveCapabilityState("organization-first-service", "unentitled"), "HIDDEN");
  assert.equal(resolveCapabilityState("organization-first-service", "pending"), "PENDING");
  assert.equal(resolveCapabilityState("organization-first-service", "activated"), "AVAILABLE");
});

test("EXR-1 preserves contextual Accessibility placement and separation", () => {
  assert.equal(EXR_ACCESSIBILITY_PLACEMENT_CONTRACT.personalSettings, "ACCOUNT_SETTINGS");
  assert.equal(EXR_ACCESSIBILITY_PLACEMENT_CONTRACT.helpCompanion, "SHARED_HELP");
  assert.equal(EXR_ACCESSIBILITY_PLACEMENT_CONTRACT.operations, "AUTHORIZED_OPERATOR_ADMIN");
  assert.equal(EXR_ACCESSIBILITY_PLACEMENT_CONTRACT.separation.length, 4);
});

test("EXR-1 keeps reporting context-specific and Notifications additive", () => {
  assert.equal(EXR_REPORTING_ENTRY_CONTRACT.strategy, "CONTEXT_SPECIFIC_GOVERNED_REGISTRY");
  assert.ok(EXR_SHELL_OWNERSHIP_CONTRACT.exr.includes("page_composition"));
  assert.ok(EXR_SHELL_OWNERSHIP_CONTRACT.notifications.includes("attention_data_projection"));
});

test("EXR-1 return experience prefers active work", () => {
  assert.equal(getReturnTarget({ hasCurrentWork: true, hasRoleQueue: true }), "CURRENT_WORK");
  assert.equal(getReturnTarget({ hasRoleQueue: true }), "ROLE_QUEUE");
  assert.equal(getReturnTarget({ isPublic: true }), "PUBLIC_DISCOVERY");
  assert.equal(getReturnTarget(), "ROLE_DASHBOARD");
});
