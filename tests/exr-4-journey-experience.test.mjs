import test from "node:test";
import assert from "node:assert/strict";
import {
  EXR4_JOURNEY_IDS,
  resolveCapabilityExposure,
  resolveFirstServiceTransition,
  resolveJourneyExperience,
  resolveExr4Navigation,
  validateExrJourneyExperience,
} from "../src/system/exr/exrJourneyExperience.js";

test("all EXR-4 priority journey contracts expose context, work, action, help, and return", () => {
  assert.equal(EXR4_JOURNEY_IDS.length, 11);
  assert.equal(validateExrJourneyExperience().valid, true);
  const result = resolveJourneyExperience({ journeyId: "activated-organization", actor: "org_operator", organizationId: "org-1", roleLabel: "Organization operator", currentWork: "Review intake", nextAction: "Open queue", nextActionSource: "DOMAIN_PROJECTION" });
  assert.deepEqual(result.context, { organizationId: "org-1", role: "Organization operator" });
  assert.equal(result.returnTarget, "CURRENT_WORK");
  assert.equal(result.authorization, "SERVER_AUTHORITATIVE");
});

test("applicants remain in onboarding until activation and then receive first-service transition", () => {
  assert.deepEqual(resolveFirstServiceTransition({ organizationState: "SUBMITTED", entitlements: ["curriculum"] }), { state: "PENDING", route: "/operator/onboarding", service: null });
  assert.deepEqual(resolveFirstServiceTransition({ organizationState: "ACTIVATED", entitlements: ["curriculum"] }), { state: "AVAILABLE", route: "/services/curriculum", service: "curriculum" });
});

test("capability exposure is descriptive and cannot grant authorization", () => {
  assert.equal(resolveCapabilityExposure({ capability: "hub-operating-work", permission: false, entitled: true }), "LOCKED");
  assert.equal(resolveCapabilityExposure({ capability: "hub-operating-work", permission: true, entitled: false }), "LOCKED");
  assert.equal(resolveCapabilityExposure({ capability: "hub-operating-work", permission: true, entitled: true, workflowReady: true }), "AVAILABLE");
  assert.equal(resolveCapabilityExposure({ capability: "unknown", permission: true, entitled: true, workflowReady: true }), "HIDDEN");
});

test("role and organization navigation remain server-authoritative", () => {
  const publicView = resolveExr4Navigation({ actor: "public", isPublic: true });
  const operatorView = resolveExr4Navigation({ actor: "org_operator", organizationId: "org-1", capabilityConditions: { "hub-operating-work": "entitled" } });
  assert.ok(publicView.entries.every((entry) => entry.id !== "hub"));
  assert.ok(operatorView.entries.some((entry) => entry.id === "hub"));
  assert.equal(operatorView.authorization, "SERVER_AUTHORITATIVE");
  assert.equal(operatorView.notificationSlots.length, 3);
});

test("NCA slots are placement-only and empty states remain explicit", () => {
  const empty = resolveJourneyExperience({ journeyId: "student", actor: "learner", organizationId: "org-1" });
  assert.equal(empty.currentWork, "No current work is available.");
  assert.equal(empty.nextAction, "No action is currently required.");
  assert.equal(empty.notificationSlots.includes("NOTIFICATION_BELL_SLOT"), true);
  assert.equal(Object.hasOwn(empty, "unreadCount"), false);
});
