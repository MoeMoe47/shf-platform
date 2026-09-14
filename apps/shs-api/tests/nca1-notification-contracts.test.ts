import test from "node:test";
import assert from "node:assert/strict";
import { classifyNotificationType } from "../src/domain/notifications/contracts/notification-classification.ts";
import { resolveAuthorizedOrganizationIds } from "../src/domain/notifications/service/notification-service.ts";

test("classifyNotificationType returns the approved category/urgency/actionRequired for every real EVENT_POLICIES type", () => {
  assert.deepEqual(classifyNotificationType("DOCUMENTATION_SIGNATURE_REQUIRED"), {
    category: "MANDATORY_OPERATIONAL",
    actionRequired: true,
    urgency: "critical",
    channelEligibility: ["IN_APP"],
  });
  assert.deepEqual(classifyNotificationType("CREDENTIAL_EARNED"), {
    category: "TRANSACTIONAL",
    actionRequired: false,
    urgency: "info",
    channelEligibility: ["IN_APP"],
  });
  assert.equal(classifyNotificationType("REVIEW_ASSIGNED").actionRequired, true);
  assert.equal(classifyNotificationType("COMPLETION_ACHIEVED").category, "OPTIONAL_PRODUCT");
});

test("classifyNotificationType never claims a channel beyond IN_APP today, for any known type", () => {
  const knownTypes = [
    "DOCUMENTATION_REQUIRED", "DOCUMENTATION_CORRECTION_REQUIRED", "DOCUMENTATION_SIGNATURE_REQUIRED",
    "DOCUMENTATION_SIGNATURE_COMPLETE", "DOCUMENTATION_SIGNATURE_EXPIRED", "DOCUMENTATION_MANUAL_VERIFICATION",
    "DOCUMENTATION_MANUAL_CORRECTION", "DOCUMENTATION_SUPERSEDED", "REVIEW_ASSIGNED", "REVIEW_DECISION",
    "CREDENTIAL_EARNED", "CREDENTIAL_REVOKED", "DEPLOYMENT_LIVE", "DEPLOYMENT_FAILED", "REGISTRY_ACCEPTED",
    "REGISTRY_CHANGES_REQUESTED", "REGISTRY_REJECTED", "REGISTRY_FAILED", "COMPLETION_ACHIEVED",
  ];
  for (const type of knownTypes) {
    assert.deepEqual(classifyNotificationType(type).channelEligibility, ["IN_APP"], `unexpected channel for ${type}`);
  }
});

test("classifyNotificationType falls back to a conservative default for an unclassified type, never over-claiming urgency", () => {
  const originalWarn = console.warn;
  const warnings: unknown[][] = [];
  console.warn = (...args: unknown[]) => { warnings.push(args); };
  let result: ReturnType<typeof classifyNotificationType>;
  try {
    result = classifyNotificationType("SOME_FUTURE_TYPE_NOT_YET_CLASSIFIED");
  } finally {
    console.warn = originalWarn;
  }
  assert.deepEqual(result, { category: "OPTIONAL_PRODUCT", actionRequired: false, urgency: "info", channelEligibility: ["IN_APP"] });
  assert.equal(warnings.length, 1);
});

test("resolveAuthorizedOrganizationIds includes every membership organization plus the active organization, deduplicated", () => {
  const actor = {
    user_id: "user-1",
    active_organization_id: "org-active",
    memberships: [
      { organization_id: "org-active" },
      { organization_id: "org-other-1" },
      { organization_id: "org-other-2" },
      { organization_id: "org-other-1" },
    ],
  };
  assert.deepEqual(resolveAuthorizedOrganizationIds(actor), ["org-active", "org-other-1", "org-other-2"]);
});

test("resolveAuthorizedOrganizationIds falls back to the active organization alone when memberships are absent", () => {
  assert.deepEqual(resolveAuthorizedOrganizationIds({ active_organization_id: "org-active" }), ["org-active"]);
});

test("resolveAuthorizedOrganizationIds never fabricates an organization id from malformed input", () => {
  assert.deepEqual(resolveAuthorizedOrganizationIds({ memberships: [{}, { organization_id: null }] }), []);
  assert.deepEqual(resolveAuthorizedOrganizationIds({}), []);
});

test("resolveAuthorizedOrganizationIds never silently drops an authorized non-active organization (NCA multi-org requirement)", () => {
  const actor = {
    organization_id: "org-active",
    memberships: [{ organization_id: "org-active" }, { organization_id: "org-authorized-elsewhere" }],
  };
  const organizationIds = resolveAuthorizedOrganizationIds(actor);
  assert.equal(organizationIds.includes("org-authorized-elsewhere"), true);
});
