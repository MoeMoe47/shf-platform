import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { projectPassportFromSources } from "../src/domain/metaverse/passport/service/passport-projection-service.ts";

const contract = readFileSync(new URL("../src/domain/metaverse/passport/model/passport-contract.ts", import.meta.url), "utf8");
const service = readFileSync(new URL("../src/domain/metaverse/passport/service/passport-projection-service.ts", import.meta.url), "utf8");
const routes = readFileSync(new URL("../src/domain/metaverse/passport/api/routes.ts", import.meta.url), "utf8");
const router = readFileSync(new URL("../src/api/router.ts", import.meta.url), "utf8");

function fixtureSources(overrides = {}) {
  return {
    verifiedEvidence: [
      { evidence_id: "evidence-reviewed", status: "REVIEWED", criterion: "Network configuration", competency_id: "skill-network-config", verifier_user_id: "instructor-a", source_type: "INSTRUCTOR_VERIFICATION", source_occurred_at: "2026-01-01T00:00:00Z" },
      { evidence_id: "evidence-arcade-reviewable", status: "REVIEWABLE", criterion: "Arcade candidate", competency_id: "skill-arcade", source_type: "ARCADE_RESULT" },
      { evidence_id: "evidence-superseded", status: "SUPERSEDED", criterion: "Old evidence", competency_id: "skill-old" },
    ],
    evidenceCandidates: [
      { evidence_id: "candidate-opportunity", status: "REVIEWABLE", criterion: "Accepted opportunity submission", source_type: "OPPORTUNITY_SUBMISSION" },
    ],
    credentials: [
      { id: "credential-active", status: "ISSUED", name: "Data Center Foundations", issuing_authority: "SHF Credential Authority", issued_at: "2026-02-01T00:00:00Z", verification_id: "verify-1" },
      { id: "credential-revoked", status: "REVOKED", name: "Revoked Credential", issued_at: "2026-01-01T00:00:00Z", revoked_at: "2026-03-01T00:00:00Z" },
    ],
    projects: [{ project_id: "project-1", title: "Cooling sensor project", status: "FINALIZED", finalized_at: "2026-03-01T00:00:00Z" }],
    portfolioArtifacts: [{ artifact_id: "artifact-1", title: "Portfolio cooling artifact", summary: "Presented evidence-backed work.", status: "ACTIVE", visibility: "PUBLIC", provenance: { evidenceId: "evidence-reviewed", studioProjectId: "project-1" } }],
    missions: [
      { missionProjectionId: "mission-program", missionTitle: "Program Mission", missionType: "PROGRAM_MISSION", program_id: "program-1", completed_at: "2026-04-01T00:00:00Z" },
      { missionProjectionId: "mission-side", missionTitle: "Side Mission", missionType: "SIDE_MISSION", completed_at: "2026-04-02T00:00:00Z" },
    ],
    opportunities: [{ opportunityId: "opp-1", awardId: "award-1", title: "Sponsor dashboard", status: "COMPLETED", project_ref: "project-1", awarded_at: "2026-05-01T00:00:00Z" }],
    arcadeSignals: [{ id: "arcade-1", title: "Arcade network practice", mastery_achieved: true, created_at: "2026-05-02T00:00:00Z" }],
    marketHistory: [{ order_id: "order-1", status: "FULFILLED", fulfilled_at: "2026-05-03T00:00:00Z", total_price_snapshot: 100, currency_type: "SHF_CREDITS" }],
    teamExperience: [{ studio_team_membership_id: "team-member-1", team_name: "Studio Team", role: "MEMBER", created_at: "2026-05-04T00:00:00Z" }],
    careerProgress: [{ career_id: "career-1", career_title: "Data Center Technician", requirements_remaining: ["credential-x"] }],
    programCompletions: [{ program_id: "program-1", program_title: "Summer boot camp", completed_at: "2026-05-05T00:00:00Z" }],
    ...overrides,
  };
}

function fixturePassport(overrides = {}) {
  return projectPassportFromSources({
    learnerUserId: "learner-a",
    organizationId: "org-a",
    sources: fixtureSources(overrides),
  });
}

test("MET-10 routes require auth, active org, server-derived learner identity and are registered read-only", () => {
  assert.match(routes, /requirePermission\(SHS_SECURITY_PERMISSIONS\.STUDIO_PROJECT_VIEW/);
  assert.match(routes, /\/metaverse\/passport\/me/);
  assert.match(routes, /getMyPassport\(req\.user/);
  assert.doesNotMatch(routes, /req\.body/);
  assert.match(router, /registerMetaversePassportRoutes\(app\)/);
  assert.match(service, /actorUserId\(actor\)/);
  assert.match(service, /actorOrgId\(actor\)/);
});

test("MET-10 claim model keeps authorities, levels, claim types and graph relationships explicit", () => {
  for (const value of ["VERIFIED_SKILL", "VERIFIED_EVIDENCE", "CREDENTIAL", "PROJECT_COMPLETION", "MISSION_COMPLETION", "OPPORTUNITY_COMPLETION", "ARCADE_MASTERY_SIGNAL", "PORTFOLIO_ARTIFACT", "CAREER_PROGRESS", "TEAM_EXPERIENCE", "RELIABILITY_FACT", "PROGRAM_COMPLETION"]) {
    assert.match(contract, new RegExp(`"${value}"`));
  }
  for (const value of ["VERIFIED", "SOURCE_CONFIRMED", "EVIDENCE_CANDIDATE", "ACTIVITY_COMPLETED", "UNVERIFIED"]) {
    assert.match(contract, new RegExp(`"${value}"`));
  }
  for (const value of ["VERIFIED_EVIDENCE", "CREDENTIAL", "CAREER", "METAVERSE_MISSION", "OPPORTUNITY_EXCHANGE", "LEARNING_ARCADE", "PORTFOLIO", "STUDIO_PROJECT", "PROGRAM", "MARKET"]) {
    assert.match(contract, new RegExp(`"${value}"`));
  }
  assert.match(contract, /DEMONSTRATED_BY/);
  assert.match(contract, /VERIFIED_BY/);
  assert.match(contract, /PROGRESSED_TOWARD/);
});

test("MET-10 verified skills come only from reviewed canonical evidence, never arcade, mission, opportunity, market or credits", () => {
  const passport = fixturePassport();
  const skills = passport.claims.filter((claim) => claim.claimType === "VERIFIED_SKILL");
  assert.equal(skills.length, 1);
  assert.equal(skills[0].sourceAuthority, "VERIFIED_EVIDENCE");
  assert.deepEqual(skills[0].skillRefs, ["skill-network-config"]);
  assert.equal(passport.claims.some((claim) => claim.claimType === "VERIFIED_SKILL" && claim.sourceAuthority === "LEARNING_ARCADE"), false);
  assert.equal(passport.claims.some((claim) => claim.claimType === "VERIFIED_SKILL" && claim.sourceAuthority === "METAVERSE_MISSION"), false);
  assert.equal(passport.claims.some((claim) => claim.claimType === "VERIFIED_SKILL" && claim.sourceAuthority === "OPPORTUNITY_EXCHANGE"), false);
  assert.equal(passport.claims.some((claim) => claim.claimType === "VERIFIED_SKILL" && claim.sourceAuthority === "MARKET"), false);
  assert.equal(JSON.stringify(passport).includes("SHF_CREDITS"), false);
  assert.equal(passport.boundaries.creditsAreCapability, false);
});

test("MET-10 distinguishes candidates, activity history, revoked credentials and source authorities", () => {
  const passport = fixturePassport();
  const candidate = passport.claims.find((claim) => claim.sourceRef === "candidate-opportunity");
  assert.equal(candidate?.verificationLevel, "EVIDENCE_CANDIDATE");
  assert.equal(candidate?.sourceAuthority, "VERIFIED_EVIDENCE");
  assert.equal(passport.claims.some((claim) => claim.sourceRef === "credential-active" && claim.sourceAuthority === "CREDENTIAL"), true);
  assert.equal(passport.claims.some((claim) => claim.sourceRef === "credential-revoked"), false);
  assert.equal(passport.claims.some((claim) => claim.sourceRef === "evidence-superseded"), false);
  assert.equal(passport.claims.some((claim) => claim.claimType === "ARCADE_MASTERY_SIGNAL" && claim.verificationLevel === "ACTIVITY_COMPLETED"), true);
});

test("MET-10 projects projects, portfolio, career, program and side mission without inventing employment or job readiness", () => {
  const passport = fixturePassport();
  assert.equal(passport.claims.some((claim) => claim.claimType === "PROJECT_COMPLETION" && claim.sourceAuthority === "STUDIO_PROJECT"), true);
  assert.equal(passport.claims.some((claim) => claim.claimType === "PORTFOLIO_ARTIFACT" && claim.sourceAuthority === "PORTFOLIO"), true);
  assert.equal(passport.claims.some((claim) => claim.claimType === "CAREER_PROGRESS" && claim.metadata.noJobReadyClaimInvented === true), true);
  assert.equal(passport.claims.some((claim) => claim.claimType === "MISSION_COMPLETION" && claim.programRefs.includes("program-1")), true);
  assert.equal(passport.claims.some((claim) => claim.claimType === "MISSION_COMPLETION" && claim.sourceRef === "mission-side"), true);
  assert.equal(JSON.stringify(passport).toLowerCase().includes("job-ready status"), false);
  assert.equal(JSON.stringify(passport).toLowerCase().includes("employed"), false);
});

test("MET-10 reliability is source-backed, separate from skill, separate from credits and never a global ranking", () => {
  const passport = fixturePassport();
  assert.ok(passport.reliabilityFacts.length >= 2);
  assert.equal(passport.reliabilityFacts.some((fact) => fact.sourceAuthority === "OPPORTUNITY_EXCHANGE"), true);
  assert.equal(passport.reliabilityFacts.some((fact) => fact.sourceAuthority === "MARKET"), true);
  assert.equal(passport.reliabilityFacts.some((fact) => fact.dimension === "MARKET_FULFILLMENT"), true);
  assert.equal(passport.boundaries.reputationIsSkill, false);
  assert.equal(passport.boundaries.noGlobalRanking, true);
  assert.equal(JSON.stringify(passport).toLowerCase().includes("leaderboard"), false);
});

test("MET-10 public and sponsor views are bounded and beginner fairness survives eligibility projection", () => {
  const publicPassport = projectPassportFromSources({ learnerUserId: "learner-a", organizationId: "org-a", view: "PUBLIC", sources: fixtureSources() });
  assert.equal(publicPassport.reliabilityFacts.length, 0);
  assert.equal(publicPassport.claims.some((claim) => claim.claimType === "RELIABILITY_FACT"), false);
  assert.equal(publicPassport.claims.every((claim) => claim.learnerUserId === "redacted"), true);
  const sponsorPassport = projectPassportFromSources({ learnerUserId: "learner-a", organizationId: "org-a", view: "SPONSOR", sources: fixtureSources() });
  assert.equal(sponsorPassport.eligibilityProjection.safeForOpportunityExchange, true);
  assert.equal(sponsorPassport.eligibilityProjection.beginnerEligibleWithoutReputation, true);
  assert.equal(sponsorPassport.boundaries.opportunityAwardIsEmployment, false);
});

test("MET-10 capability graph and accessible tree are explanatory projection only", () => {
  const passport = fixturePassport();
  assert.ok(passport.capabilityGraph.nodes.some((node) => node.type === "LEARNER"));
  assert.ok(passport.capabilityGraph.nodes.some((node) => node.type === "SKILL"));
  assert.ok(passport.capabilityGraph.edges.some((edge) => edge.relationship === "VERIFIED_BY"));
  assert.ok(passport.capabilityGraph.accessibleTree.length > 0);
  assert.equal(passport.capabilityGraph.nodes.some((node) => node.sourceAuthority === "PASSPORT_PROJECTION" && node.type !== "LEARNER"), false);
});

test("MET-10 service does not create duplicate durable truth or circular dependency", () => {
  assert.doesNotMatch(service, /INSERT INTO/i);
  assert.doesNotMatch(service, /UPDATE .*credential/i);
  assert.doesNotMatch(service, /UPDATE .*evidence/i);
  assert.doesNotMatch(service, /UPDATE .*career/i);
  assert.doesNotMatch(service, /projectAuthoritativeFact/);
  assert.match(service, /noCircularDependency:\s*true/);
});
