import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CIVIC_AUTHORITY_REUSE,
  CIVIC_NEUTRALITY_RULES,
  SHF_CIVIC_AUTHORITY,
} from "../src/domain/shf-civic/model/civic-contract.ts";
import {
  activeTermFor,
  assertNoCivicSureAuthority,
  buildCivicPublicProjection,
  castCouncilVote,
  castStudentBallot,
  certifyElection,
  civicBudgetDecision,
  civicMissionProjection,
  createCityProjectPath,
  currentElection,
  defaultOffices,
  deriveCivicEligibility,
  fileCandidacy,
  fixtureCandidates,
  generateBallot,
  getCivicHall,
  neutralCandidateOrdering,
  readPrivateCivicRecord,
  reviewCandidacy,
  SHF_CIVIC_INTEGRATION_POLICY,
  SHF_CIVIC_PERSISTENCE_POLICY,
  submitProposal,
  tallyElection,
  transitionProposal,
} from "../src/domain/shf-civic/service/shf-civic-service.ts";
import { buildMetaverseCivicProjection } from "../src/domain/metaverse/civic/civic-authority-adapter.ts";
import { buildCityOrchestrationProjection, deriveGuidedNextAction } from "../src/domain/metaverse/orchestration/service/city-orchestration-service.ts";

const serviceSource = readFileSync(new URL("../src/domain/shf-civic/service/shf-civic-service.ts", import.meta.url), "utf8");
const adapterSource = readFileSync(new URL("../src/domain/metaverse/civic/civic-authority-adapter.ts", import.meta.url), "utf8");
const routesSource = readFileSync(new URL("../src/domain/shf-civic/api/routes.ts", import.meta.url), "utf8");
const migrationSource = readFileSync(new URL("../migrations/148_civic_government_city_operations.sql", import.meta.url), "utf8");
const routerSource = readFileSync(new URL("../src/api/router.ts", import.meta.url), "utf8");

const student = { user_id: "learner_met14_a", active_organization_id: "org_shf_001", tenant_id: "tenant:org_shf_001", roles: ["student"], permissions: ["studio.project.view", "studio.project.create", "studio.project.update"] };
const studentB = { user_id: "learner_met14_b", active_organization_id: "org_shf_001", tenant_id: "tenant:org_shf_001", roles: ["student"], permissions: ["studio.project.view", "studio.project.create", "studio.project.update"] };
const reviewer = { user_id: "instructor_met14", active_organization_id: "org_shf_001", tenant_id: "tenant:org_shf_001", roles: ["instructor"], permissions: ["project.submission.review", "studio.project.view"] };
const officer = { user_id: "learner_civic_officer", active_organization_id: "org_shf_001", tenant_id: "tenant:org_shf_001", roles: ["student"], permissions: ["studio.project.view"] };

test("MET-14 auth, active org, authority, and CivicSure exclusion are explicit", () => {
  assert.throws(() => getCivicHall(null as any), /Authentication required/);
  assert.throws(() => getCivicHall({ user_id: "x" }), /Active organization context/);
  assert.equal(SHF_CIVIC_AUTHORITY.authority, "SHF_CIVIC");
  assert.equal(SHF_CIVIC_AUTHORITY.excludedAuthority, "CivicSure");
  assert.equal(assertNoCivicSureAuthority(), true);
  assert.equal(SHF_CIVIC_PERSISTENCE_POLICY.metaverseOnlyCivicTruth, false);
  assert.equal(SHF_CIVIC_PERSISTENCE_POLICY.civicSureTablesUsed, false);
  assert.match(routerSource, /registerShfCivicRoutes\(app\)/);
  assert.match(routesSource, /\/shf-civic\/hall/);
  assert.doesNotMatch(serviceSource, /government-assurance/i);
  assert.doesNotMatch(serviceSource, /civicSure[A-Za-z]*:\s*true/i);
  assert.doesNotMatch(adapterSource, /government-assurance|CivicSure.*true/i);
});

test("MET-14 identity, constituency, office eligibility, and disallowed factors are server-derived", () => {
  const office = defaultOffices()[1];
  const eligibility = deriveCivicEligibility(student, office, { activeStudent: true, civicCourseEnrolled: true });
  assert.equal(eligibility.eligible, true);
  assert.equal(eligibility.representation.serverDerived, true);
  assert.equal(eligibility.representation.scope, "SCHOOL_DISTRICT");
  assert.ok(eligibility.disallowedFactors.includes("SHF_CREDIT_BALANCE"));
  assert.ok(eligibility.disallowedFactors.includes("POLITICAL_VIEWPOINT"));
  assert.equal(JSON.stringify(eligibility).includes("wealth"), false);
  assert.equal(SHF_CIVIC_INTEGRATION_POLICY.creditBoundary.creditsCanBuyEligibility, false);
  assert.equal(CIVIC_NEUTRALITY_RULES.includes("NO_POLITICAL_VIEWPOINT_ELIGIBILITY"), true);
});

test("MET-14 private cross-org reads and cross-tenant enumeration fail closed", () => {
  assert.throws(() => readPrivateCivicRecord(student, "org_partner_001"), /not available in this organization/);
  assert.throws(() => getCivicHall({ ...student, tenant_id: "tenant:wrong" }), /Active organization context/);
});

test("MET-14 candidacy filing and approval are governed and cannot be client-forged", () => {
  const filed = fileCandidacy(student, { statement: "Accessible agenda and project transparency." });
  assert.equal(filed.studentUserId, "learner_met14_a");
  assert.equal(filed.status, "SUBMITTED");
  assert.equal(filed.eligibilitySnapshot.representation.serverDerived, true);
  assert.throws(() => reviewCandidacy(student, filed, "APPROVE"), /review authority/);
  const approved = reviewCandidacy(reviewer, { ...filed, status: "APPROVED", reviewedBy: "client" } as any, "APPROVE");
  assert.equal(approved.status, "APPROVED");
  assert.equal(approved.reviewedBy, "instructor_met14");
});

test("MET-14 campaign presentation is neutral, equal access, and not paid", () => {
  const ordered = neutralCandidateOrdering(fixtureCandidates());
  assert.deepEqual(ordered.map((candidate) => candidate.displayName), ["Alex Student", "Bailey Student"]);
  assert.equal(ordered.every((candidate) => candidate.visibilityBoostPurchased === false), true);
  assert.equal(ordered.every((candidate) => candidate.privateContactExposed === false), true);
  assert.equal(SHF_CIVIC_INTEGRATION_POLICY.campaignFairness.noPaidPromotion, true);
  assert.equal(SHF_CIVIC_INTEGRATION_POLICY.campaignFairness.shfCreditsCanBoostVisibility, false);
  assert.doesNotMatch(serviceSource, /rankCandidates|favored|momentum|likely winner|pay.*boost/i);
});

test("MET-14 ballot is server-generated, windowed, private, and rejects injection/duplicates/replay", () => {
  const election = currentElection(new Date("2026-09-15T12:00:00Z"));
  const ballot = generateBallot(student, election, new Date("2026-09-15T12:00:00Z"));
  assert.equal(ballot.voterUserId, "learner_met14_a");
  assert.equal(ballot.candidates.length, 2);
  assert.equal(ballot.privacy.publicChoiceExposure, false);
  assert.throws(() => generateBallot(student, { ...election, opensAt: "2026-09-16T00:00:00Z", closesAt: "2026-09-17T00:00:00Z" }, new Date("2026-09-15T12:00:00Z")), /not opened/);
  assert.throws(() => generateBallot(student, { ...election, opensAt: "2026-09-10T00:00:00Z", closesAt: "2026-09-11T00:00:00Z" }, new Date("2026-09-15T12:00:00Z")), /closed/);
  assert.throws(() => castStudentBallot(studentB, { electionId: election.electionId, candidateId: "forged_candidate" }), /not server-generated/);
  const receipt = castStudentBallot(student, { electionId: election.electionId, candidateId: ballot.candidates[0].candidacyId });
  assert.equal(receipt.choicePublic, false);
  assert.equal(receipt.auditEvent.exposes_choice, false);
  assert.throws(() => castStudentBallot(student, { electionId: election.electionId, candidateId: ballot.candidates[0].candidacyId }), /Duplicate ballot/);
  const idempotent = castStudentBallot({ ...student, user_id: "learner_met14_idempotent" }, { electionId: election.electionId, candidateId: ballot.candidates[0].candidacyId, idempotencyKey: "org_shf_001:election_student_mayor_fall:learner_met14_idempotent" });
  assert.equal(idempotent.idempotent, false);
  assert.equal(castStudentBallot({ ...student, user_id: "learner_met14_idempotent" }, { electionId: election.electionId, candidateId: ballot.candidates[0].candidacyId, idempotencyKey: "org_shf_001:election_student_mayor_fall:learner_met14_idempotent" }).idempotent, true);
});

test("MET-14 tally, certification, tie, term, and expired authority are server-governed", () => {
  assert.throws(() => tallyElection(student, { winnerId: "client" }), /server-derived/);
  const tally = tallyElection(reviewer);
  assert.equal(tally.aggregateOnly, true);
  assert.equal(tally.tiePolicy, "RUNOFF_REQUIRED");
  assert.throws(() => certifyElection(student), /review authority/);
  assert.equal(certifyElection(reviewer).certification.governed, true);
  assert.equal(activeTermFor(student, "learner_civic_officer", new Date("2026-09-15T12:00:00Z")).grantsCouncilVote, true);
  assert.equal(activeTermFor(student, "learner_civic_officer", new Date("2027-01-01T12:00:00Z")).grantsCouncilVote, false);
});

test("MET-14 proposals, council voting, public comment, budget, projects, and Student Enterprise boundaries hold", () => {
  const proposal = submitProposal(student, { title: "Data Center sustainability review", shfCreditBudget: 100 });
  assert.equal(proposal.authorUserId, "learner_met14_a");
  assert.throws(() => transitionProposal(student, proposal.proposalId, "APPROVED"), /review authority/);
  const approved = transitionProposal(reviewer, proposal.proposalId, "APPROVED");
  assert.equal(approved.status, "APPROVED");
  assert.throws(() => castCouncilVote(student, approved, "YES"), /office-holder authority/);
  const vote = castCouncilVote(officer, approved, "YES");
  assert.equal(vote.rollCallPublic, true);
  assert.throws(() => castCouncilVote(officer, approved, "YES"), /Duplicate council vote/);
  assert.equal(civicBudgetDecision(student, { simulatedCityAllocation: 50 }).personalWalletMutation, false);
  const projectPath = createCityProjectPath(reviewer, approved);
  assert.equal(projectPath.opportunityExchangeRequired, true);
  assert.equal(projectPath.studentEnterpriseUsesMet8, true);
  assert.equal(projectPath.directAwardByCouncil, false);
});

test("MET-14 mission, Arcade, Work Passport, rewards, NCA, communication, MET-13 and MET-11 boundaries hold", () => {
  const mission = civicMissionProjection(student);
  assert.equal(mission.source, "SHF_CIVIC");
  assert.equal(mission.consumesCivicSure, false);
  assert.equal(SHF_CIVIC_INTEGRATION_POLICY.arcadeBoundary.canGrantOffice, false);
  assert.equal(SHF_CIVIC_INTEGRATION_POLICY.workPassportBoundary.officeAloneCreatesVerifiedSkill, false);
  assert.equal(SHF_CIVIC_INTEGRATION_POLICY.communicationBoundary.studentDmEnabled, false);
  assert.equal(SHF_CIVIC_INTEGRATION_POLICY.notificationBoundary.ncaReused, true);
  assert.equal(SHF_CIVIC_INTEGRATION_POLICY.notificationBoundary.favorsCandidate, false);
  assert.equal(SHF_CIVIC_INTEGRATION_POLICY.creditBoundary.creditsCanBuyVote, false);
  assert.equal(SHF_CIVIC_INTEGRATION_POLICY.creditBoundary.creditsCanBuyCampaignVisibility, false);
});

test("MET-14 public-safe projection omits private voter choice and contact info", () => {
  const projection = buildCivicPublicProjection(student);
  assert.equal(projection.authority.authority, "SHF_CIVIC");
  assert.equal(projection.privacy.exposesIndividualVoteChoice, false);
  assert.equal(projection.privacy.exposesContactInfo, false);
  assert.equal(projection.results[0].aggregateOnly, true);
  assert.equal(JSON.stringify(projection).includes("@"), false);
  assert.equal(JSON.stringify(projection).includes("phone"), false);
});

test("MET-14 metaverse projection and orchestration reuse SHF Civic without duplicate authority", async () => {
  const civic = await buildMetaverseCivicProjection(student, {
    hall: async () => getCivicHall(student),
    publicProjection: async () => buildCivicPublicProjection(student),
  });
  assert.equal(civic.authority.authority, "SHF_CIVIC");
  assert.equal(civic.adapter.metaverseOwnsElectionTruth, false);
  assert.equal(civic.dataCenterConnection.civicVoteOverridesTechnicalAuthority, false);
  assert.equal(civic.dataCenterConnection.simulationId, "civic-budget-tradeoff-simulation");
  const action = deriveGuidedNextAction({ missions: [], opportunities: [], marketListings: [], marketOrders: [], marketBalance: null, passport: null, civic });
  assert.equal(action.action_type, "COMPLETE_CIVIC_COURSE");
  const projection = buildCityOrchestrationProjection(student, { missions: [], opportunities: [], marketListings: [], marketOrders: [], marketBalance: null, passport: null, civic }, new Date("2026-09-15T12:00:00Z"));
  assert.equal(projection.civic_state?.authority, "SHF_CIVIC");
  assert.equal(projection.civic_state?.civic_sure_authority, false);
  assert.equal(projection.authority_reuse.shf_civic.includes("shf-civic"), true);
});

test("MET-14 persistence migration creates SHF Civic records and no CivicSure authority", () => {
  for (const table of SHF_CIVIC_PERSISTENCE_POLICY.canonicalTables) assert.match(migrationSource, new RegExp(table));
  assert.match(migrationSource, /shf_civic_vote_participation/);
  assert.match(migrationSource, /shf_civic_vote_choice_vault/);
  assert.match(migrationSource, /UNIQUE \(organization_id, tenant_id, election_id, voter_user_id\)/);
  assert.match(migrationSource, /visibility_boost_purchased BOOLEAN NOT NULL DEFAULT FALSE CHECK \(visibility_boost_purchased = FALSE\)/);
  assert.doesNotMatch(migrationSource, /civicsure_/i);
});

test("MET-14 authority reuse map covers canonical dependencies", () => {
  for (const key of ["identity", "organization", "enrollment", "curriculum", "missions", "opportunityExchange", "treasury", "workPassport", "orchestration", "studentEnterprise", "simulations", "communication", "notifications", "evidence"]) {
    assert.ok(CIVIC_AUTHORITY_REUSE[key], key);
  }
});
