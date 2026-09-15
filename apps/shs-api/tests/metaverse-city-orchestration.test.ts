import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildCityOrchestrationProjection,
  deriveGuidedNextAction,
  fastTravel,
} from "../src/domain/metaverse/orchestration/service/city-orchestration-service.ts";

const serviceSource = readFileSync(new URL("../src/domain/metaverse/orchestration/service/city-orchestration-service.ts", import.meta.url), "utf8");
const contractSource = readFileSync(new URL("../src/domain/metaverse/orchestration/model/orchestration-contract.ts", import.meta.url), "utf8");
const routesSource = readFileSync(new URL("../src/domain/metaverse/orchestration/api/routes.ts", import.meta.url), "utf8");
const routerSource = readFileSync(new URL("../src/api/router.ts", import.meta.url), "utf8");

const actor = { user_id: "learner-a", active_organization_id: "org-a", roles: ["student"], permissions: ["studio.project.view"] };

function mission(overrides: any = {}) {
  return {
    missionProjectionId: "mission-required",
    assignmentId: "assignment-1",
    assignmentType: "artifact",
    programId: null,
    missionTitle: "Continue Data Center Cooling Mission",
    missionSummary: "Source-backed mission",
    missionStatus: "ASSIGNED",
    dueState: "DUE_SOON",
    dueAt: "2026-09-20T00:00:00Z",
    location: { districtId: "data-center-district", facilityId: "data-center-training-lab", metaverseActivityId: null },
    nextAction: { kind: "START_CITY_MISSION", reason: "Your current assignment requires this activity." },
    arcadeRelations: [],
    evidenceExpectations: { isVerifiedEvidence: false },
    ...overrides,
  };
}

function opportunity(overrides: any = {}) {
  return {
    opportunityId: "opp-1",
    title: "Beginner team project",
    summary: "A beginner project",
    status: "OPEN",
    districtId: "community-district",
    facilityId: "community-center",
    missionProjectionId: null,
    difficultyTier: "BEGINNER",
    participationMode: "TEAM",
    opportunityType: "PROJECT",
    sourceType: "COMMUNITY",
    eligibility: { result: "ELIGIBLE", reasons: [], requirementsRemaining: [] },
    applicationCloseAt: "2026-09-21T00:00:00Z",
    ...overrides,
  };
}

function sources(overrides: any = {}) {
  return {
    missions: [mission()],
    opportunities: [opportunity()],
    marketListings: [{ listingId: "listing-1", title: "Notebook", districtId: "treasury-commerce-district", facilityId: "store-marketplace", status: "PUBLISHED" }],
    marketOrders: [{ orderId: "order-1", status: "PAID", listingSnapshot: { title: "Notebook" } }],
    marketBalance: { balance: 50, currencyType: "SHF_CREDITS" },
    passport: {
      claims: [
        { passportClaimId: "claim-evidence", claimType: "VERIFIED_EVIDENCE", title: "Evidence candidate", summary: "Pending review", sourceRef: "evidence-1", verificationLevel: "EVIDENCE_CANDIDATE" },
        { passportClaimId: "claim-career", claimType: "CAREER_PROGRESS", title: "Career progress", summary: "Source confirmed", sourceRef: "career-1", verificationLevel: "SOURCE_CONFIRMED" },
      ],
      boundaries: { creditsAreCapability: false, opportunityAwardIsEmployment: false },
    },
    cityPresenceCounts: [{ facility_id: "data-center-training-lab", participant_count: 3 }],
    ...overrides,
  };
}

test("MET-11 routes require auth/active org, derive learner identity server-side, and are registered", () => {
  assert.match(routesSource, /requirePermission\(SHS_SECURITY_PERMISSIONS\.STUDIO_PROJECT_VIEW/);
  assert.match(routesSource, /\/metaverse\/orchestration/);
  assert.match(routesSource, /\/metaverse\/orchestration\/fast-travel/);
  assert.match(routesSource, /getCityOrchestration\(req\.user/);
  assert.match(routesSource, /fastTravel\(req\.user/);
  assert.match(routerSource, /registerMetaverseOrchestrationRoutes\(app\)/);
  assert.throws(() => buildCityOrchestrationProjection(null as any, sources()), /Authentication required/);
  assert.throws(() => buildCityOrchestrationProjection({ user_id: "learner-a" }, sources()), /Valid active organization context/);
  const projection = buildCityOrchestrationProjection(actor, sources());
  assert.equal(projection.learner_id, "learner-a");
  assert.equal(projection.organization_id, "org-a");
});

test("MET-11 authority reuse map covers MET-7 through MET-10 and creates no duplicate truth writes", () => {
  const projection = buildCityOrchestrationProjection(actor, sources());
  for (const key of ["assignments", "arcade", "missions", "opportunities", "projects", "evidence", "treasury", "market", "passport", "career", "protected_entry"]) {
    assert.ok(projection.authority_reuse[key], key);
  }
  assert.equal(projection.persistence_policy.duplicate_truth_persisted, false);
  assert.doesNotMatch(serviceSource, /INSERT INTO|UPDATE .*balance|projectAuthoritativeFact|verified skill/i);
});

test("MET-11 next action is server-derived and required learning outranks market/exploration", () => {
  const action = deriveGuidedNextAction(sources());
  assert.equal(action.action_type, "ENTER_CITY_MISSION");
  assert.equal(action.priority_band, "ACTIVE_ASSIGNMENT_PROJECT_DEADLINE");
  assert.equal(action.is_required, true);
  assert.equal(deriveGuidedNextAction(sources({ missions: [] })).action_type, "REVIEW_AVAILABLE_OPPORTUNITY");
  assert.equal(deriveGuidedNextAction(sources({ missions: [], opportunities: [] })).action_type, "VISIT_MARKET");
});

test("MET-11 Arcade requirement and required mission outrank side mission", () => {
  const required = mission({
    arcadeRelations: [{ arcadeActivityId: "arcade-1", title: "Cooling Practice", requiredOrRecommended: "REQUIRED", masteryAchieved: false, source: "completion_policy_requirement" }],
  });
  const side = mission({ missionProjectionId: "mission-side", assignmentType: "side", missionTitle: "Side Mission", dueState: "OPEN" });
  const action = deriveGuidedNextAction(sources({ missions: [side, required] }));
  assert.equal(action.action_type, "PRACTICE_IN_ARCADE");
  assert.equal(action.source_type, "MET-7_MISSION_ARCADE_RELATION");
});

test("MET-11 beginner, side, and program paths work without career pathway or reputation gates", () => {
  const program = mission({ missionProjectionId: "mission-program", programId: "program-1", careerContext: null });
  const side = mission({ missionProjectionId: "mission-side", assignmentType: "side", careerContext: null });
  const projection = buildCityOrchestrationProjection(actor, sources({ missions: [program, side], opportunities: [opportunity({ difficultyTier: "BEGINNER", eligibility: { result: "ELIGIBLE", reasons: [], requirementsRemaining: [] } })] }));
  assert.equal(projection.program_context?.program_id, "program-1");
  assert.ok(projection.available_missions.some((m: any) => m.missionProjectionId === "mission-side"));
  assert.ok(projection.available_opportunities.some((o: any) => o.difficultyTier === "BEGINNER"));
  assert.equal(JSON.stringify(projection).includes("low reputation"), false);
});

test("MET-11 briefing, district pulse, markers, events and building previews use real source-backed counts only", () => {
  const projection = buildCityOrchestrationProjection(actor, sources());
  assert.equal(projection.briefing.source_backed_only, true);
  assert.equal(projection.district_pulses.find((p) => p.district_id === "data-center-district")?.active_missions, 1);
  assert.equal(projection.opportunity_markers[0].eligible_opportunity_count, 1);
  assert.equal(projection.opportunity_markers[0].beginner_count, 1);
  assert.equal(projection.city_events.length, 0);
  assert.equal(projection.building_previews.find((p) => p.facility_id === "data-center-training-lab")?.presence_count, 3);
  assert.equal(projection.building_previews.every((p) => p.privacy.exposes_identities === false), true);
});

test("MET-11 no fake opportunity markers or event counts for ineligible/absent facts", () => {
  const projection = buildCityOrchestrationProjection(actor, sources({
    opportunities: [opportunity({ eligibility: { result: "NOT_ELIGIBLE", reasons: ["missing"], requirementsRemaining: ["source fact"] } })],
    missions: [],
    marketListings: [],
    marketOrders: [],
  }));
  assert.equal(projection.opportunity_markers.length, 0);
  assert.equal(projection.city_events.length, 0);
  assert.equal(projection.district_pulses.every((pulse) => pulse.city_events === 0), true);
});

test("MET-11 fast travel is navigation only and must reuse protected entry", async () => {
  assert.match(serviceSource, /new MetaverseEntryService\(\)\.decide/);
  await assert.rejects(() => fastTravel({ user_id: "learner-a", active_organization_id: "org-a" }, "DOES_NOT_EXIST"), /destination/i);
  for (const rule of ["unlock", "protected_entry", "entitlement", "organization_id", "client_authority_ignored"]) {
    assert.match(serviceSource, new RegExp(rule));
  }
});

test("MET-11 boundaries prevent capability, employment, reward, market and Passport authority drift", () => {
  const projection = buildCityOrchestrationProjection(actor, sources());
  assert.equal(projection.reward_state.direct_balance_mutation, false);
  assert.equal(projection.passport_state.read_only, true);
  assert.equal(projection.career_state.job_ready_invented, false);
  assert.equal(projection.evidence_state.source, "MET-10_WORK_PASSPORT");
  assert.equal(JSON.stringify(projection).includes("creditsAreCapability\":true"), false);
  assert.equal(JSON.stringify(projection).includes("employment"), false);
});

test("MET-11 contract exposes required model pieces and prevents client-forged projections", () => {
  for (const value of ["CONTINUE_ASSIGNMENT", "PRACTICE_IN_ARCADE", "ENTER_CITY_MISSION", "REVIEW_AVAILABLE_OPPORTUNITY", "VISIT_MARKET", "NO_ACTION_AVAILABLE"]) {
    assert.match(contractSource, new RegExp(`"${value}"`));
  }
  for (const field of ["district_pulses", "opportunity_markers", "building_previews", "fast_travel_destinations", "source_backed_only"]) {
    assert.match(contractSource, new RegExp(field));
  }
  assert.doesNotMatch(routesSource, /req\.body.*next_action|req\.body.*district_pulse|req\.body.*eligibility/);
});
