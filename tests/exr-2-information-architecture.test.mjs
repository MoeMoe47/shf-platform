import test from "node:test";
import assert from "node:assert/strict";
import {
  EXR_IA_ALIASES,
  EXR_IA_DESTINATIONS,
  EXR_NOTIFICATION_SLOTS,
  getAliasClassification,
  getParentChain,
  resolveExrNavigation,
} from "../src/system/exr/exrInformationArchitecture.js";

test("EXR-2 preserves the public Foundation to Solutions hierarchy", () => {
  const foundation = EXR_IA_DESTINATIONS.find((entry) => entry.id === "foundation");
  const solutions = EXR_IA_DESTINATIONS.find((entry) => entry.id === "solutions");
  const universe = EXR_IA_DESTINATIONS.find((entry) => entry.id === "universe");
  assert.equal(solutions.parent, "foundation");
  assert.equal(universe.parent, "foundation");
  assert.equal(foundation.actor[0], "public");
});

test("EXR-2 projects Hub only to organization roles with context", () => {
  const projection = resolveExrNavigation({ actor: "org_operator", organizationId: "org-1", capabilityConditions: { "hub-operating-work": "entitled" } });
  assert.equal(projection.roleContext, "org_operator");
  assert.equal(projection.entries.find((entry) => entry.id === "hub")?.exposureState, "AVAILABLE");
  assert.ok(!resolveExrNavigation({ actor: "public", isPublic: true }).entries.some((entry) => entry.id === "hub"));
});

test("EXR-2 capability exposure is descriptive and state-aware", () => {
  const pending = resolveExrNavigation({ actor: "org_operator", organizationId: "org-1", capabilityConditions: { "organization-first-service": "pending" } });
  assert.equal(pending.entries.find((entry) => entry.id === "first-service")?.exposureState, "PENDING");
  const hidden = resolveExrNavigation({ actor: "org_operator", organizationId: "org-1", capabilityConditions: { "hub-operating-work": "unentitled" } });
  assert.ok(!hidden.entries.some((entry) => entry.id === "hub"));
  assert.equal(hidden.authorization, "SERVER_AUTHORITATIVE");
});

test("EXR-2 preserves contextual Accessibility placement", () => {
  const settings = EXR_IA_DESTINATIONS.find((entry) => entry.id === "accessibility-settings");
  const operations = EXR_IA_DESTINATIONS.find((entry) => entry.id === "accessibility-operations");
  const help = EXR_IA_DESTINATIONS.find((entry) => entry.id === "help");
  assert.equal(settings.kind, "SETTINGS");
  assert.equal(operations.kind, "QUEUE");
  assert.equal(help.kind, "HELP");
});

test("EXR-2 separates notification placement from notification ownership", () => {
  assert.deepEqual(EXR_NOTIFICATION_SLOTS, ["NOTIFICATION_BELL_SLOT", "ATTENTION_PROJECTION_SLOT", "INBOX_DESTINATION_SLOT"]);
  assert.equal(resolveExrNavigation({ actor: "learner", organizationId: "org-1", capabilityConditions: { "student-learning": "assigned" } }).notificationSlots.length, 3);
});

test("EXR-2 classifies aliases without retiring them", () => {
  assert.equal(getAliasClassification("/hub/action-queue").classification, "ALIAS_KEEP");
  assert.equal(getAliasClassification("/reports").classification, "DEFER_TO_EXR_3");
  assert.equal(getParentChain("studio-review").map((entry) => entry.id).join("/"), "studio/studio-review");
  assert.equal(EXR_IA_ALIASES.some((entry) => entry.classification === "LEGACY_ARCHIVED"), false);
});
