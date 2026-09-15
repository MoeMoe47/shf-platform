import test from "node:test";
import assert from "node:assert/strict";

import {
  METAVERSE_JOB_SIMULATION_BOUNDARY,
  METAVERSE_UNLOCK_AUTHORITY_BOUNDARY,
  METAVERSE_VERIFIED_MASTERY_BOUNDARY,
  type CanonicalLearnerUnlockContext,
} from "../src/domain/metaverse/unlocks/unlock-contract.ts";
import {
  METAVERSE_OPERATIONAL_EVENT_BOUNDARY,
  METAVERSE_UNLOCK_AUTHORITY_AUDIT,
  METAVERSE_UNLOCK_CACHE_REVALIDATION_EVENTS,
  METAVERSE_UNLOCK_OPERATIONAL_EVENTS,
} from "../src/domain/metaverse/unlocks/unlock-authority-adapter.ts";
import {
  METAVERSE_DISTRICT_UNLOCK_POLICY,
  activityRequirementGroup,
  facilityRequirementGroup,
} from "../src/domain/metaverse/unlocks/unlock-policy.ts";
import {
  canEnterProtectedMetaverseResource,
  resolveMetaverseUnlock,
  type MetaverseUnlockResource,
} from "../src/domain/metaverse/unlocks/unlock-resolver.ts";
import { METAVERSE_UI_STATE_TOKENS } from "../src/domain/metaverse/unlocks/unlock-explanation.ts";
import type { MetaverseEligibilityFacts } from "../src/domain/metaverse/unlocks/unlock-requirements.ts";

const computedAt = "2026-09-15T12:00:00.000Z";

function context(overrides: Partial<CanonicalLearnerUnlockContext> = {}): CanonicalLearnerUnlockContext {
  return {
    user_id: "student-1",
    organization_id: "org-1",
    tenant_id: "tenant:org-1",
    roles: ["student"],
    permissions: [],
    active_membership: true,
    ...overrides,
  };
}

function facts(overrides: Partial<MetaverseEligibilityFacts> = {}): MetaverseEligibilityFacts {
  return {
    user_id: "student-1",
    organization_id: "org-1",
    active_membership: true,
    roles: ["student"],
    permissions: [],
    enrollments: [],
    service_entitlements: ["metaverse"],
    ...overrides,
  };
}

function resource(overrides: Partial<MetaverseUnlockResource> = {}): MetaverseUnlockResource {
  return {
    organization_id: "org-1",
    city_id: "silicon-heartland-city",
    district_id: "data-center-district",
    facility_id: "main-data-center",
    resource_id: "data-center-safety-simulation",
    activity_id: "data-center-safety-simulation",
    access_level: "SIMULATION_ACCESS",
    ...overrides,
  };
}

test("identity and organization context are required", () => {
  assert.throws(
    () => resolveMetaverseUnlock({
      context: context({ user_id: null }),
      resource: resource(),
      facts: facts(),
      computed_at: computedAt,
    }),
    /canonical_user_identity_required/,
  );
});

test("client cannot grant unlock", () => {
  assert.throws(
    () => resolveMetaverseUnlock({
      context: context({ client_claimed_unlock: true }),
      resource: resource(),
      facts: facts(),
      computed_at: computedAt,
    }),
    /client_cannot_grant_unlock/,
  );
});

test("camera position cannot grant unlock", () => {
  assert.throws(
    () => resolveMetaverseUnlock({
      context: context({ camera_context: { camera_level: "FACILITY_VIEW", facility_id: "ai-compute-facility" } }),
      resource: resource({ facility_id: "main-data-center" }),
      facts: facts(),
      computed_at: computedAt,
    }),
    /camera_position_cannot_grant_unlock/,
  );
});

test("cross-org resource is denied", () => {
  assert.throws(
    () => resolveMetaverseUnlock({
      context: context({ organization_id: "org-1" }),
      resource: resource({ organization_id: "org-2" }),
      facts: facts(),
      computed_at: computedAt,
    }),
    /cross_org_unlock_denied/,
  );
});

test("district access and facility access are independent", () => {
  const district = resolveMetaverseUnlock({
    context: context(),
    resource: resource({ resource_id: "data-center-district", access_level: "DISTRICT_ACCESS", facility_id: null, activity_id: null }),
    facts: facts(),
    computed_at: computedAt,
  });
  const facility = resolveMetaverseUnlock({
    context: context(),
    resource: resource({ resource_id: "main-data-center", access_level: "FACILITY_ACCESS", activity_id: null }),
    facts: facts(),
    computed_at: computedAt,
  });
  assert.equal(district.decision, "AVAILABLE");
  assert.equal(facility.decision, "LOCKED");
});

test("activity access requires server decision", () => {
  const decision = resolveMetaverseUnlock({
    context: context(),
    resource: resource(),
    facts: facts(),
    computed_at: computedAt,
  });
  assert.equal(canEnterProtectedMetaverseResource(decision), false);
  assert.equal(decision.decision, "LOCKED");
});

test("enrollment can unlock approved learning resource", () => {
  const decision = resolveMetaverseUnlock({
    context: context(),
    resource: resource({ resource_id: "main-data-center", access_level: "FACILITY_ACCESS", activity_id: null }),
    facts: facts({ enrollments: [{ program_id: "data-center-foundations", status: "ACTIVE" }] }),
    computed_at: computedAt,
  });
  assert.equal(decision.decision, "AVAILABLE");
  assert.ok(decision.source_authorities.includes("enrollments-domain"));
});

test("missing prerequisite produces LOCKED", () => {
  const decision = resolveMetaverseUnlock({
    context: context(),
    resource: resource(),
    facts: facts({ enrollments: [{ program_id: "data-center-foundations", status: "ACTIVE" }] }),
    computed_at: computedAt,
  });
  assert.equal(decision.decision, "LOCKED");
  assert.ok(decision.requirements_remaining.includes("lesson-4-complete"));
});

test("instructor assignment can produce ASSIGNED where policy permits", () => {
  const decision = resolveMetaverseUnlock({
    context: context(),
    resource: resource({ resource_id: "capstone-project-room", access_level: "ACTIVITY_ACCESS", facility_id: "builder-studio" }),
    facts: facts({ teams: ["capstone-team"], instructor_assignments: ["capstone-project-room"] }),
    computed_at: computedAt,
  });
  assert.equal(decision.decision, "ASSIGNED");
  assert.equal(decision.reason_code, "ASSIGNED");
});

test("task completion alone does not create verified mastery", () => {
  assert.ok(METAVERSE_VERIFIED_MASTERY_BOUNDARY.includes("task completion != assessment pass"));
  assert.equal(METAVERSE_UNLOCK_AUTHORITY_BOUNDARY.taskCompletionCreatesVerifiedMastery, false);
});

test("simulation completion does not create job eligibility", () => {
  assert.equal(METAVERSE_JOB_SIMULATION_BOUNDARY.isEducationalSimulation, true);
  assert.equal(METAVERSE_JOB_SIMULATION_BOUNDARY.isEmployment, false);
  assert.equal(METAVERSE_UNLOCK_AUTHORITY_BOUNDARY.simulationCreatesJobEligibility, false);
});

test("civic access delegates to SHF Civic authority", () => {
  const denied = resolveMetaverseUnlock({
    context: context(),
    resource: resource({ resource_id: "civic-council-session", access_level: "CIVIC_SESSION_ACCESS", district_id: "civic-district", facility_id: "council-chamber" }),
    facts: facts(),
    computed_at: computedAt,
  });
  const allowed = resolveMetaverseUnlock({
    context: context(),
    resource: resource({ resource_id: "civic-council-session", access_level: "CIVIC_SESSION_ACCESS", district_id: "civic-district", facility_id: "council-chamber" }),
    facts: facts({ civic_eligibilities: ["civic-council-session"] }),
    computed_at: computedAt,
  });
  assert.equal(denied.decision, "RESTRICTED");
  assert.ok(denied.source_authorities.includes("shf-civic"));
  assert.equal(allowed.decision, "AVAILABLE");
});

test("credential requirement uses canonical credential fact", () => {
  const locked = resolveMetaverseUnlock({
    context: context(),
    resource: resource({ resource_id: "credential-gated-lab", access_level: "ACTIVITY_ACCESS" }),
    facts: facts(),
    computed_at: computedAt,
  });
  const available = resolveMetaverseUnlock({
    context: context(),
    resource: resource({ resource_id: "credential-gated-lab", access_level: "ACTIVITY_ACCESS" }),
    facts: facts({ credentials: [{ credential_definition_id: "credential-data-center-safety", lifecycle: "ISSUED" }] }),
    computed_at: computedAt,
  });
  assert.equal(locked.reason_code, "CREDENTIAL_REQUIRED");
  assert.equal(available.decision, "AVAILABLE");
});

test("revoked membership invalidates access", () => {
  const decision = resolveMetaverseUnlock({
    context: context({ active_membership: false }),
    resource: resource({ resource_id: "public-realm", access_level: "DISTRICT_ACCESS", district_id: "public-realm", facility_id: null }),
    facts: facts({ active_membership: false }),
    computed_at: computedAt,
  });
  assert.equal(decision.decision, "RESTRICTED");
  assert.equal(decision.reason_code, "REVOKED");
});

test("revoked entitlement invalidates gated access", () => {
  const revoked = resolveMetaverseUnlock({
    context: context(),
    resource: resource({ resource_id: "entitled-ai-agent-lab", access_level: "ACTIVITY_ACCESS", district_id: "technology-innovation-district", facility_id: "ai-agent-lab" }),
    facts: facts({ service_entitlements: [] }),
    computed_at: computedAt,
  });
  const allowed = resolveMetaverseUnlock({
    context: context(),
    resource: resource({ resource_id: "entitled-ai-agent-lab", access_level: "ACTIVITY_ACCESS", district_id: "technology-innovation-district", facility_id: "ai-agent-lab" }),
    facts: facts({ service_entitlements: ["metaverse-ai-lab"] }),
    computed_at: computedAt,
  });
  assert.equal(revoked.decision, "LOCKED");
  assert.equal(revoked.reason_code, "PREREQUISITE_MISSING");
  assert.equal(allowed.decision, "AVAILABLE");
  assert.equal(METAVERSE_UNLOCK_CACHE_REVALIDATION_EVENTS.includes("entitlement_changed"), true);
});

test("suspension invalidates protected entry", () => {
  const decision = resolveMetaverseUnlock({
    context: context({ user_suspended: true }),
    resource: resource(),
    facts: facts({ user_suspended: true }),
    computed_at: computedAt,
  });
  assert.equal(decision.decision, "RESTRICTED");
  assert.equal(decision.reason_code, "SUSPENDED");
});

test("stale projection requires revalidation", () => {
  const decision = resolveMetaverseUnlock({
    context: context(),
    resource: resource({ resource_id: "public-realm", access_level: "DISTRICT_ACCESS", district_id: "public-realm", facility_id: null }),
    facts: facts(),
    computed_at: computedAt,
    expires_at: "2026-09-15T12:00:30.000Z",
  });
  assert.equal(canEnterProtectedMetaverseResource(decision, new Date("2026-09-15T12:00:31.000Z")), false);
  assert.equal(decision.revalidation_policy, "server_recheck_required_at_protected_entry_and_on_authority_change");
});

test("locked decision provides safe explanation", () => {
  const decision = resolveMetaverseUnlock({
    context: context(),
    resource: resource(),
    facts: facts({ enrollments: [{ program_id: "data-center-foundations", status: "ACTIVE" }] }),
    computed_at: computedAt,
  });
  assert.equal(decision.decision, "LOCKED");
  assert.match(decision.reason_text, /Lesson 4/);
  assert.doesNotMatch(decision.reason_text, /risk|internal|private/i);
});

test("next action only appears when supported", () => {
  const withAction = resolveMetaverseUnlock({
    context: context(),
    resource: resource(),
    facts: facts({ enrollments: [{ program_id: "data-center-foundations", status: "ACTIVE" }] }),
    computed_at: computedAt,
  });
  const withoutAction = resolveMetaverseUnlock({
    context: context(),
    resource: resource({ resource_id: "public-realm", access_level: "DISTRICT_ACCESS", district_id: "public-realm", facility_id: null }),
    facts: facts(),
    computed_at: computedAt,
  });
  assert.equal(withAction.next_action?.next_action_type, "START_LESSON");
  assert.equal(withoutAction.next_action, null);
});

test("accessible non-spatial route receives same authorization", () => {
  const mapDecision = resolveMetaverseUnlock({
    context: context({ camera_context: { camera_level: "DISTRICT_VIEW", district_id: "public-realm" } }),
    resource: resource({ resource_id: "public-realm", access_level: "DISTRICT_ACCESS", district_id: "public-realm", facility_id: null }),
    facts: facts(),
    computed_at: computedAt,
  });
  const listDecision = resolveMetaverseUnlock({
    context: context(),
    resource: resource({ resource_id: "public-realm", access_level: "DISTRICT_ACCESS", district_id: "public-realm", facility_id: null }),
    facts: facts(),
    computed_at: computedAt,
  });
  assert.equal(mapDecision.decision, listDecision.decision);
  assert.equal(METAVERSE_UI_STATE_TOKENS.AVAILABLE.accessibleText, "Available to enter");
});

test("no duplicate curriculum authority", () => {
  assert.equal(METAVERSE_UNLOCK_AUTHORITY_BOUNDARY.duplicateCurriculumAuthority, false);
});

test("no duplicate career authority", () => {
  assert.equal(METAVERSE_UNLOCK_AUTHORITY_BOUNDARY.duplicateCareerAuthority, false);
});

test("no duplicate civic authority", () => {
  assert.equal(METAVERSE_UNLOCK_AUTHORITY_BOUNDARY.duplicateCivicAuthority, false);
});

test("no duplicate credential authority", () => {
  assert.equal(METAVERSE_UNLOCK_AUTHORITY_BOUNDARY.duplicateCredentialAuthority, false);
});

test("direct URL cannot bypass protected entry", () => {
  const decision = resolveMetaverseUnlock({
    context: context(),
    resource: resource(),
    facts: facts(),
    computed_at: computedAt,
  });
  assert.equal(canEnterProtectedMetaverseResource(decision), false);
});

test("operational events do not create verified outcomes automatically", () => {
  assert.ok(METAVERSE_UNLOCK_OPERATIONAL_EVENTS.includes("metaverse.activity.completed"));
  assert.equal(METAVERSE_OPERATIONAL_EVENT_BOUNDARY.createsVerifiedMastery, false);
  assert.equal(METAVERSE_OPERATIONAL_EVENT_BOUNDARY.createsOutcome, false);
  assert.equal(METAVERSE_OPERATIONAL_EVENT_BOUNDARY.createsCredential, false);
});

test("district and facility policies cover canonical registry categories", () => {
  assert.equal(METAVERSE_DISTRICT_UNLOCK_POLICY["data-center-district"].category, "PATHWAY_GATED");
  assert.ok(facilityRequirementGroup("main-data-center").requirements.some((requirement) => requirement.id === "data-center-enrollment"));
  assert.equal(METAVERSE_UNLOCK_AUTHORITY_AUDIT.some((entry) => entry.fact === "SHF Civic" && entry.status === "UNRESOLVED"), true);
});
