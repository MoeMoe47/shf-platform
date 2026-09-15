import assert from "node:assert/strict";
import test from "node:test";
import { MetaverseEntryService, statusForMetaverseError } from "../src/domain/metaverse/runtime/metaverse-entry-service";
import { canEnterProtectedMetaverseResource } from "../src/domain/metaverse/unlocks/unlock-resolver";
import {
  METAVERSE_JOB_SIMULATION_BOUNDARY,
  METAVERSE_VERIFIED_MASTERY_BOUNDARY,
} from "../src/domain/metaverse/unlocks/unlock-contract";
import { METAVERSE_OPERATIONAL_EVENT_BOUNDARY } from "../src/domain/metaverse/runtime/metaverse-event-adapter";
import { resetOperationalTelemetryForTests, setOperationalTelemetrySink } from "../src/observability/operational-telemetry";

function user(overrides: Record<string, any> = {}) {
  return {
    user_id: "learner-1",
    active_organization_id: "org-a",
    organization_id: "org-a",
    tenant_id: "tenant:org-a",
    status: "active",
    roles: ["learner"],
    permissions: ["enrollment.view"],
    memberships: [{ membership_id: "mem-1", organization_id: "org-a", tenant_id: "tenant:org-a", role: "learner", status: "active", organization_status: "active" }],
    ...overrides,
  };
}

function authority(facts: Record<string, any> = {}) {
  return {
    async resolve(actor: any) {
      const organizationId = actor?.active_organization_id || actor?.organization_id || null;
      const userId = actor?.user_id || actor?.id || null;
      const membership = actor?.memberships?.find((item: any) => item.organization_id === organizationId) || null;
      const active = Boolean(userId && organizationId && String(membership?.status || "active") === "active" && String(membership?.organization_status || "active") === "active");
      return {
        activeMembership: membership,
        context: {
          user_id: userId,
          organization_id: organizationId,
          tenant_id: actor?.tenant_id ?? null,
          roles: actor?.roles || [],
          permissions: actor?.permissions || [],
          active_membership: active,
          user_suspended: facts.user_suspended,
          organization_suspended: facts.organization_suspended,
        },
        facts: {
          organization_id: organizationId || "",
          user_id: userId || "",
          active_membership: active,
          roles: actor?.roles || [],
          permissions: actor?.permissions || [],
          service_entitlements: facts.service_entitlements || [],
          enrollments: facts.enrollments || [],
          completed_lessons: facts.completed_lessons || [],
          assessments: facts.assessments || [],
          civic_eligibilities: facts.civic_eligibilities || [],
          credentials: facts.credentials || [],
          outcomes: facts.outcomes || [],
          closed_resources: facts.closed_resources || [],
          user_suspended: Boolean(facts.user_suspended),
          organization_suspended: Boolean(facts.organization_suspended),
        },
      };
    },
  };
}

function service(facts: Record<string, any> = {}) {
  return new MetaverseEntryService(authority(facts) as any);
}

const enrolled = { enrollments: [{ program_id: "data-center-foundations", status: "ACTIVE", cohort_id: "cohort-a" }] };

test.afterEach(() => resetOperationalTelemetryForTests());

test("MET-5 unauthenticated entry is denied", async () => {
  await assert.rejects(() => service().decide({ user: null, resource: { scope: "city", resource_id: "silicon-heartland-city" } }), (error: any) => error.code === "AUTH_REQUIRED" && error.statusCode === 401);
});

test("MET-5 authenticated user without active org is denied", async () => {
  await assert.rejects(() => service().decide({ user: user({ active_organization_id: "" }), resource: { scope: "city", resource_id: "silicon-heartland-city" } }), (error: any) => error.code === "ORG_CONTEXT_REQUIRED");
});

test("MET-5 active membership is required", async () => {
  const result = await service().decide({ user: user({ memberships: [{ organization_id: "org-a", status: "revoked", organization_status: "active" }] }), resource: { scope: "district", district_id: "data-center-district" } });
  assert.equal(result.decision.decision, "RESTRICTED");
  assert.equal(result.can_enter, false);
});

test("MET-5 cross-org resource request cannot override server organization", async () => {
  const result = await service(enrolled).decide({ user: user(), resource: { scope: "district", district_id: "data-center-district", organization_id: "org-b" } as any });
  assert.equal(result.decision.organization_id, "org-a");
});

test("MET-5 client cannot submit unlock authority", async () => {
  await assert.rejects(
    () => service(enrolled).decide({ user: user(), resource: { scope: "activity", district_id: "data-center-district", facility_id: "data-center-training-lab", activity_id: "data-center-foundations-introduction" }, clientBody: { unlock: true } }),
    (error: any) => statusForMetaverseError(error) === 403,
  );
});

test("MET-5 camera state cannot affect backend decision", async () => {
  await assert.rejects(
    () => service(enrolled).decide({ user: user(), resource: { scope: "activity", district_id: "data-center-district", facility_id: "data-center-training-lab", activity_id: "data-center-foundations-introduction" }, cameraContext: { facility_id: "main-data-center" } }),
    (error: any) => statusForMetaverseError(error) === 403,
  );
});

test("MET-5 valid enrolled learner may enter allowed learning activity", async () => {
  const result = await service(enrolled).decide({ user: user(), resource: { scope: "activity", district_id: "data-center-district", facility_id: "data-center-training-lab", activity_id: "data-center-foundations-introduction" } });
  assert.equal(result.decision.decision, "AVAILABLE");
  assert.equal(result.can_enter, true);
});

test("MET-5 missing prerequisite returns LOCKED", async () => {
  const result = await service().decide({ user: user(), resource: { scope: "activity", district_id: "data-center-district", facility_id: "data-center-training-lab", activity_id: "data-center-foundations-introduction" } });
  assert.equal(result.decision.decision, "LOCKED");
  assert.equal(result.decision.reason_code, "NOT_ENROLLED");
});

test("MET-5 restricted civic resource remains restricted without SHF Civic eligibility", async () => {
  const result = await service().decide({ user: user(), resource: { scope: "activity", district_id: "civic-district", facility_id: "council-chamber", activity_id: "civic-council-session" } });
  assert.equal(result.decision.decision, "RESTRICTED");
  assert.equal(result.can_enter, false);
});

test("MET-5 direct API request cannot bypass policy", async () => {
  const result = await service().decide({ user: user(), resource: { scope: "activity", district_id: "data-center-district", facility_id: "data-center-training-lab", activity_id: "data-center-foundations-introduction" } });
  assert.equal(canEnterProtectedMetaverseResource(result.decision), false);
});

test("MET-5 unknown resource ID fails safely", async () => {
  await assert.rejects(() => service().decide({ user: user(), resource: { scope: "district", district_id: "unknown-district" } }), (error: any) => error.code === "METAVERSE_DISTRICT_NOT_FOUND");
});

test("MET-5 facility-parent relationship is validated", async () => {
  await assert.rejects(() => service().decide({ user: user(), resource: { scope: "facility", district_id: "civic-district", facility_id: "main-data-center" } }), (error: any) => error.code === "METAVERSE_FACILITY_PARENT_INVALID");
});

test("MET-5 activity-parent relationship is validated", async () => {
  await assert.rejects(() => service().decide({ user: user(), resource: { scope: "activity", district_id: "data-center-district", facility_id: "main-data-center", activity_id: "data-center-foundations-introduction" } }), (error: any) => error.code === "METAVERSE_ACTIVITY_PARENT_INVALID");
});

test("MET-5 revoked membership invalidates access", async () => {
  const result = await service(enrolled).decide({ user: user({ memberships: [{ organization_id: "org-a", status: "revoked", organization_status: "active" }] }), resource: { scope: "district", district_id: "data-center-district" } });
  assert.equal(result.decision.reason_code, "REVOKED");
});

test("MET-5 revoked entitlement invalidates access", async () => {
  const result = await service().decide({ user: user(), resource: { scope: "activity", district_id: "technology-innovation-district", facility_id: "ai-agent-lab", activity_id: "entitled-ai-agent-lab" } });
  assert.equal(result.decision.decision, "LOCKED");
  assert.equal(result.decision.requirements_remaining.includes("metaverse-ai-lab-entitled"), true);
});

test("MET-5 org suspension invalidates access", async () => {
  const result = await service({ ...enrolled, organization_suspended: true }).decide({ user: user(), resource: { scope: "district", district_id: "data-center-district" } });
  assert.equal(result.decision.reason_code, "SUSPENDED");
});

test("MET-5 user suspension invalidates access", async () => {
  const result = await service({ ...enrolled, user_suspended: true }).decide({ user: user(), resource: { scope: "district", district_id: "data-center-district" } });
  assert.equal(result.decision.reason_code, "SUSPENDED");
});

test("MET-5 stale projection is rechecked at entry", async () => {
  const allowed = await service(enrolled).decide({ user: user(), resource: { scope: "activity", district_id: "data-center-district", facility_id: "data-center-training-lab", activity_id: "data-center-foundations-introduction" } });
  const revoked = await service().decide({ user: user(), resource: { scope: "activity", district_id: "data-center-district", facility_id: "data-center-training-lab", activity_id: "data-center-foundations-introduction" } });
  assert.equal(allowed.can_enter, true);
  assert.equal(revoked.can_enter, false);
});

test("MET-5 expired projection cannot enter", () => {
  assert.equal(canEnterProtectedMetaverseResource({ decision: "AVAILABLE", expires_at: "2026-01-01T00:00:00.000Z" }, new Date("2026-01-01T00:00:01.000Z")), false);
});

test("MET-5 operational event emission does not create verified outcome", async () => {
  const events: any[] = [];
  setOperationalTelemetrySink((event) => events.push(event));
  const result = await service(enrolled).decide({ user: user(), resource: { scope: "activity", district_id: "data-center-district", facility_id: "data-center-training-lab", activity_id: "data-center-foundations-introduction" }, emitEvent: true, eventName: "activity_start" });
  assert.equal(result.can_enter, true);
  assert.equal(events[0].event_name, "metaverse.activity.started");
  assert.equal(METAVERSE_OPERATIONAL_EVENT_BOUNDARY.createsVerifiedMastery, false);
  assert.equal(METAVERSE_OPERATIONAL_EVENT_BOUNDARY.createsCredential, false);
});

test("MET-5 mounted activity preserves curriculum authority", async () => {
  const result = await service(enrolled).decide({ user: user(), resource: { scope: "activity", district_id: "data-center-district", facility_id: "data-center-training-lab", activity_id: "data-center-foundations-introduction" } });
  assert.equal(result.resource.route_reference, "/curriculum.html#/curriculum/learning");
  assert.equal(result.decision.source_authorities.includes("enrollments-domain"), true);
});

test("MET-5 activity mount requires protected entry", async () => {
  const result = await service().decide({ user: user(), resource: { scope: "activity", district_id: "data-center-district", facility_id: "data-center-training-lab", activity_id: "data-center-foundations-introduction" } });
  assert.equal(result.can_enter, false);
});

test("MET-5 non-spatial navigator uses same protected entry contract", async () => {
  const spatial = await service(enrolled).decide({ user: user(), resource: { scope: "facility", district_id: "data-center-district", facility_id: "data-center-training-lab" } });
  const list = await service(enrolled).decide({ user: user(), resource: { scope: "facility", district_id: "data-center-district", facility_id: "data-center-training-lab" } });
  assert.equal(spatial.decision.unlock_id, list.decision.unlock_id);
});

test("MET-5 CivicSure is not used as civic authority", async () => {
  const result = await service({ civic_eligibilities: ["civicsure-approved"] }).decide({ user: user(), resource: { scope: "activity", district_id: "civic-district", facility_id: "council-chamber", activity_id: "civic-council-session" } });
  assert.equal(result.can_enter, false);
});

test("MET-5 civic entry fails closed if canonical SHF Civic eligibility is unresolved", async () => {
  const result = await service().decide({ user: user(), resource: { scope: "activity", district_id: "civic-district", facility_id: "council-chamber", activity_id: "civic-council-session" } });
  assert.equal(result.decision.reason_code, "CIVIC_ELIGIBLE");
  assert.equal(result.can_enter, false);
});

test("MET-5 activity completion boundary remains separated", () => {
  assert.ok(METAVERSE_VERIFIED_MASTERY_BOUNDARY.includes("task completion != assessment pass"));
  assert.equal(METAVERSE_JOB_SIMULATION_BOUNDARY.isEmployment, false);
  assert.equal(METAVERSE_JOB_SIMULATION_BOUNDARY.isProfessionalLicensure, false);
});
