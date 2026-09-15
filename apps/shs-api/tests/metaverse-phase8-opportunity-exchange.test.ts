// MET-8 — Student Opportunity Exchange integration tests. Real running dev
// server and Postgres — same convention as tests/metaverse-mission-
// integration.test.ts. Proves the governed bid/award/work marketplace end
// to end: sponsor authority, source provenance, cross-org denial,
// eligibility, unforgeable identity/team, immutable award snapshot,
// evidence/credential/employment/Treasury boundaries, and real NCA/MET-6/
// MET-7 reuse.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { query } from "../src/db/client.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
// identity-repo.ts's met8Match fixture regex requires user_met8_<digits>_<persona> —
// RUN must be digits only so the ids below actually match it.
const RUN = String(Date.now());
const TITLE_PREFIX = `met8_${RUN}`;

const SPONSOR = "user_instructor_001"; // org_shf_001, instructor — owns opportunities it creates
const ADMIN = "user_admin_001"; // org_shf_001, org_admin — admin-tier override
const STUDENT_A = `user_met8_${RUN}_student_a`;
const STUDENT_B = `user_met8_${RUN}_student_b`;
const INSTRUCTOR_B = `user_met8_${RUN}_instructor_b`;
const PARTNER_STUDENT = `user_met8_${RUN}_partner_student`;
const PROGRAM_ID = "program_phase5_1788147043950_spec"; // real seeded org_shf_001 program

function authHeader(userId?: string) {
  return userId ? { Authorization: `Bearer dev-token:${userId}` } : {};
}
async function api(path: string, opts: { method?: string; userId?: string; body?: unknown } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers: { "Content-Type": "application/json", ...authHeader(opts.userId) },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function iso(daysFromNow: number) {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString();
}

function baseOpportunityInput(overrides: Record<string, unknown> = {}) {
  return {
    title: `${TITLE_PREFIX} Opportunity`,
    summary: "Build a small civic dashboard widget for the district office.",
    opportunityType: "PROJECT",
    sourceType: "INSTRUCTOR",
    difficultyTier: "DEVELOPING",
    participationMode: "INDIVIDUAL",
    deadline: iso(30),
    applicationCloseAt: iso(20),
    compensationType: "SHF_CREDITS",
    compensationAmount: 100,
    currencyType: "SHF",
    selectionMethod: "BEST_FIT",
    maxAwards: 1,
    ...overrides,
  };
}

const createdTeamIds = new Set<string>();

async function createStudioTeam(memberUserIds: string[]) {
  const teamId = `studio_team_${RUN}_${createdTeamIds.size}`;
  await query(
    `INSERT INTO studio_teams (studio_team_id, organization_id, tenant_id, name, created_by_user_id) VALUES ($1,'org_shf_001','tenant:org_shf_001',$2,$3)`,
    [teamId, `${RUN} Team ${createdTeamIds.size}`, ADMIN],
  );
  for (const userId of memberUserIds) {
    await query(
      `INSERT INTO studio_team_members (studio_team_membership_id, studio_team_id, organization_id, tenant_id, user_id, role, added_by_user_id) VALUES ($1,$2,'org_shf_001','tenant:org_shf_001',$3,'MEMBER',$4)`,
      [`studio_team_membership_${RUN}_${teamId}_${userId}`, teamId, userId, ADMIN],
    );
  }
  createdTeamIds.add(teamId);
  return teamId;
}

async function cleanup() {
  await query("DELETE FROM student_opportunity_submissions WHERE organization_id IN ('org_shf_001','org_partner_001') AND award_id IN (SELECT award_id FROM student_opportunity_awards WHERE opportunity_id IN (SELECT opportunity_id FROM student_opportunities WHERE title LIKE $1))", [`${TITLE_PREFIX}%`]);
  await query("DELETE FROM student_opportunity_awards WHERE opportunity_id IN (SELECT opportunity_id FROM student_opportunities WHERE title LIKE $1)", [`${TITLE_PREFIX}%`]);
  await query("DELETE FROM student_opportunity_bids WHERE opportunity_id IN (SELECT opportunity_id FROM student_opportunities WHERE title LIKE $1)", [`${TITLE_PREFIX}%`]);
  await query("DELETE FROM student_opportunities WHERE title LIKE $1", [`${TITLE_PREFIX}%`]);
  for (const teamId of createdTeamIds) {
    await query("DELETE FROM studio_team_members WHERE studio_team_id=$1", [teamId]);
    await query("DELETE FROM studio_teams WHERE studio_team_id=$1", [teamId]);
  }
}

const DYNAMIC_FIXTURE_USERS: Array<{ userId: string; organizationId: string }> = [
  { userId: STUDENT_A, organizationId: "org_shf_001" },
  { userId: STUDENT_B, organizationId: "org_shf_001" },
  { userId: INSTRUCTOR_B, organizationId: "org_shf_001" },
  { userId: PARTNER_STUDENT, organizationId: "org_partner_001" },
];

before(async () => {
  await cleanup();
  // identity-repo.ts's dev-token fixture resolver recognizes these ids by
  // pattern (no DB read needed for auth), but several MET-8 tables FK to a
  // real `users` row — so a matching row must also exist, same as every
  // other named fixture user this suite reuses (user_admin_001, etc.).
  for (const fixture of DYNAMIC_FIXTURE_USERS) {
    await query(
      `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
       VALUES ($1,$2,$3,'MET-8 Test Fixture','active','dev_fixture')
       ON CONFLICT (user_id) DO NOTHING`,
      [fixture.userId, fixture.organizationId, `${fixture.userId}@test.invalid`],
    );
  }
});
after(async () => {
  await cleanup();
  for (const fixture of DYNAMIC_FIXTURE_USERS) {
    await query("DELETE FROM notifications WHERE recipient_user_id=$1", [fixture.userId]);
    await query("DELETE FROM users WHERE user_id=$1", [fixture.userId]);
  }
});

// ---------------------------------------------------------------------------
// Authentication / authority boundaries
// ---------------------------------------------------------------------------

test("an unrecognized identity is rejected (this dev harness auto-logs in only known dev-token ids)", async () => {
  const res = await fetch(`${BASE}/metaverse/opportunity-exchange/opportunities`, { headers: { Authorization: "Bearer dev-token:not-a-real-user" } });
  assert.equal(res.status, 401);
});

test("a student cannot publish an Opportunity (blocked by permission, defense in depth by sponsor-authority check)", async () => {
  const res = await api("/metaverse/opportunity-exchange/opportunities", { method: "POST", userId: STUDENT_A, body: baseOpportunityInput() });
  assert.equal(res.status, 403);
  // Route-level requirePermission(OPPORTUNITY_EXCHANGE_MANAGE) already
  // denies a student before the service layer's own isStudentOnly check
  // (opportunity-service.ts createOpportunity) is ever reached — two
  // independent layers refusing the same forged sponsor action.
  assert.equal(res.json.error.code, "FORBIDDEN");
});

test("an approved sponsor (instructor) can publish, and sponsor identity is server-derived", async () => {
  const created = await api("/metaverse/opportunity-exchange/opportunities", { method: "POST", userId: SPONSOR, body: baseOpportunityInput() });
  assert.equal(created.status, 201, JSON.stringify(created.json));
  assert.equal(created.json.data.status, "DRAFT");
  assert.equal(created.json.data.sourceRef, SPONSOR); // INSTRUCTOR source_ref always the real actor, never client-forgeable
  assert.equal(created.json.data.sponsorUserId, SPONSOR);
});

test("opportunity_type, source_type, and other enums are validated (clean 400s, not raw DB errors)", async () => {
  const res = await api("/metaverse/opportunity-exchange/opportunities", { method: "POST", userId: SPONSOR, body: baseOpportunityInput({ opportunityType: "NOT_A_REAL_TYPE" }) });
  assert.equal(res.status, 400);
  assert.equal(res.json.error.code, "INVALID_ENUM_VALUE");
});

test("INSTRUCTOR source_ref cannot be forged to another user", async () => {
  const res = await api("/metaverse/opportunity-exchange/opportunities", { method: "POST", userId: SPONSOR, body: baseOpportunityInput({ sourceRef: "someone-else" }) });
  assert.equal(res.status, 400);
  assert.equal(res.json.error.code, "SOURCE_PROVENANCE_INVALID");
});

test("career_pathway_id (careerId) is optional — an INSTRUCTOR-sourced opportunity needs no career/program link", async () => {
  const created = await api("/metaverse/opportunity-exchange/opportunities", { method: "POST", userId: SPONSOR, body: baseOpportunityInput() });
  assert.equal(created.status, 201);
  assert.equal(created.json.data.careerId, null);
  assert.equal(created.json.data.programId, null);
});

test("Program Mission opportunity requires a real program in this organization", async () => {
  const bad = await api("/metaverse/opportunity-exchange/opportunities", { method: "POST", userId: SPONSOR, body: baseOpportunityInput({ sourceType: "PROGRAM_MISSION", programId: "not-a-real-program" }) });
  assert.equal(bad.status, 400);
  assert.equal(bad.json.error.code, "PROGRAM_NOT_FOUND");

  const good = await api("/metaverse/opportunity-exchange/opportunities", { method: "POST", userId: SPONSOR, body: baseOpportunityInput({ opportunityType: "PROGRAM_MISSION", sourceType: "PROGRAM_MISSION", programId: PROGRAM_ID }) });
  assert.equal(good.status, 201, JSON.stringify(good.json));
  assert.equal(good.json.data.programId, PROGRAM_ID);
});

test("Side Mission opportunity works the same way as Program Mission", async () => {
  const created = await api("/metaverse/opportunity-exchange/opportunities", { method: "POST", userId: SPONSOR, body: baseOpportunityInput({ opportunityType: "SIDE_MISSION", sourceType: "SIDE_MISSION", programId: PROGRAM_ID }) });
  assert.equal(created.status, 201, JSON.stringify(created.json));
  assert.equal(created.json.data.sourceType, "SIDE_MISSION");
});

test("a mission_projection_id must resolve to a real MET-7 mission (real MET-7 reuse, not a duplicate)", async () => {
  const res = await api("/metaverse/opportunity-exchange/opportunities", { method: "POST", userId: SPONSOR, body: baseOpportunityInput({ missionProjectionId: "not-a-real-mission" }) });
  assert.equal(res.status, 400);
  assert.equal(res.json.error.code, "MISSION_NOT_FOUND");
});

test("district_id/facility_id must be real MET-2 registry entries", async () => {
  const bad = await api("/metaverse/opportunity-exchange/opportunities", { method: "POST", userId: SPONSOR, body: baseOpportunityInput({ districtId: "not-a-real-district" }) });
  assert.equal(bad.status, 400);
  assert.equal(bad.json.error.code, "DISTRICT_NOT_FOUND");

  const good = await api("/metaverse/opportunity-exchange/opportunities", { method: "POST", userId: SPONSOR, body: baseOpportunityInput({ districtId: "career-education-district", facilityId: "career-center" }) });
  assert.equal(good.status, 201, JSON.stringify(good.json));
});

test("a non-owning sponsor (instructor) cannot manage another sponsor's opportunity, but an admin can", async () => {
  const created = await api("/metaverse/opportunity-exchange/opportunities", { method: "POST", userId: SPONSOR, body: baseOpportunityInput() });
  const opportunityId = created.json.data.opportunityId;

  const forbidden = await api(`/metaverse/opportunity-exchange/opportunities/${opportunityId}/status`, { method: "PATCH", userId: INSTRUCTOR_B, body: { status: "OPEN", expectedVersion: created.json.data.version } });
  assert.equal(forbidden.status, 403);
  assert.equal(forbidden.json.error.code, "FORBIDDEN");

  const asAdmin = await api(`/metaverse/opportunity-exchange/opportunities/${opportunityId}/status`, { method: "PATCH", userId: ADMIN, body: { status: "OPEN", expectedVersion: created.json.data.version } });
  assert.equal(asAdmin.status, 200, JSON.stringify(asAdmin.json));
  assert.equal(asAdmin.json.data.status, "OPEN");
});

// ---------------------------------------------------------------------------
// Org scoping / enumeration
// ---------------------------------------------------------------------------

test("opportunities are org-scoped: cross-org read is denied (fail closed, not leaked)", async () => {
  const created = await api("/metaverse/opportunity-exchange/opportunities", { method: "POST", userId: SPONSOR, body: baseOpportunityInput() });
  const opportunityId = created.json.data.opportunityId;
  await api(`/metaverse/opportunity-exchange/opportunities/${opportunityId}/status`, { method: "PATCH", userId: SPONSOR, body: { status: "OPEN", expectedVersion: created.json.data.version } });

  const crossOrgRead = await api(`/metaverse/opportunity-exchange/opportunities/${opportunityId}`, { userId: PARTNER_STUDENT });
  assert.equal(crossOrgRead.status, 404);

  const crossOrgBid = await api(`/metaverse/opportunity-exchange/opportunities/${opportunityId}/bids`, { method: "POST", userId: PARTNER_STUDENT, body: { bidderType: "INDIVIDUAL", proposalSummary: "I would like to help." } });
  assert.equal(crossOrgBid.status, 404);
});

// ---------------------------------------------------------------------------
// Beginner fairness floor
// ---------------------------------------------------------------------------

test("BEGINNER tier structurally strips any reputation gate a sponsor tries to set", async () => {
  const created = await api("/metaverse/opportunity-exchange/opportunities", { method: "POST", userId: SPONSOR, body: baseOpportunityInput({ difficultyTier: "BEGINNER", eligibilityRules: { minPriorCompletedAwards: 5 } }) });
  assert.equal(created.status, 201);
  assert.equal(created.json.data.eligibilityRules.noReputationRequired, true);
  assert.equal(created.json.data.eligibilityRules.minPriorCompletedAwards, undefined);

  await api(`/metaverse/opportunity-exchange/opportunities/${created.json.data.opportunityId}/status`, { method: "PATCH", userId: SPONSOR, body: { status: "OPEN", expectedVersion: created.json.data.version } });
  const asBrandNewStudent = await api(`/metaverse/opportunity-exchange/opportunities/${created.json.data.opportunityId}`, { userId: STUDENT_A });
  assert.equal(asBrandNewStudent.status, 200);
  assert.equal(asBrandNewStudent.json.data.eligibility.result, "ELIGIBLE");
});

// ---------------------------------------------------------------------------
// Eligibility / bidding lifecycle
// ---------------------------------------------------------------------------

async function openOpportunity(overrides: Record<string, unknown> = {}) {
  const created = await api("/metaverse/opportunity-exchange/opportunities", { method: "POST", userId: SPONSOR, body: baseOpportunityInput(overrides) });
  assert.equal(created.status, 201, JSON.stringify(created.json));
  const opened = await api(`/metaverse/opportunity-exchange/opportunities/${created.json.data.opportunityId}/status`, { method: "PATCH", userId: SPONSOR, body: { status: "OPEN", expectedVersion: created.json.data.version } });
  assert.equal(opened.status, 200, JSON.stringify(opened.json));
  return opened.json.data;
}

test("student browses real, org-scoped OPEN opportunities with source-backed eligibility and a real bid count", async () => {
  await openOpportunity();
  const list = await api("/metaverse/opportunity-exchange/opportunities", { userId: STUDENT_A });
  assert.equal(list.status, 200);
  assert.ok(list.json.data.items.length > 0);
  for (const item of list.json.data.items) {
    assert.ok(["ELIGIBLE", "NOT_ELIGIBLE", "CONDITIONALLY_ELIGIBLE", "CLOSED", "FULL", "RESTRICTED"].includes(item.eligibility.result));
    assert.equal(typeof item.bidCount, "number");
    assert.equal(item.status, "OPEN"); // DRAFT never leaks to students
  }
});

test("a closed opportunity rejects a bid", async () => {
  const opportunity = await openOpportunity();
  await api(`/metaverse/opportunity-exchange/opportunities/${opportunity.opportunityId}/status`, { method: "PATCH", userId: SPONSOR, body: { status: "CLOSED", expectedVersion: opportunity.version } });
  const bid = await api(`/metaverse/opportunity-exchange/opportunities/${opportunity.opportunityId}/bids`, { method: "POST", userId: STUDENT_A, body: { bidderType: "INDIVIDUAL", proposalSummary: "Let me help." } });
  assert.equal(bid.status, 403);
  assert.equal(bid.json.error.code, "NOT_ELIGIBLE");
});

test("an opportunity whose application window has already closed rejects a bid", async () => {
  const opportunity = await openOpportunity({ deadline: iso(-1), applicationCloseAt: iso(-2) });
  const bid = await api(`/metaverse/opportunity-exchange/opportunities/${opportunity.opportunityId}/bids`, { method: "POST", userId: STUDENT_A, body: { bidderType: "INDIVIDUAL", proposalSummary: "Let me help." } });
  assert.equal(bid.status, 403);
  assert.equal(bid.json.error.code, "NOT_ELIGIBLE");
});

test("bidder identity is server-derived — a client cannot forge whose bid it is", async () => {
  const opportunity = await openOpportunity();
  const bid = await api(`/metaverse/opportunity-exchange/opportunities/${opportunity.opportunityId}/bids`, {
    method: "POST", userId: STUDENT_A,
    body: { bidderType: "INDIVIDUAL", proposalSummary: "Let me help.", studentId: "someone-else-entirely" },
  });
  assert.equal(bid.status, 201, JSON.stringify(bid.json));
  assert.equal(bid.json.data.studentId, STUDENT_A);
});

test("duplicate bid abuse is rejected", async () => {
  const opportunity = await openOpportunity();
  const first = await api(`/metaverse/opportunity-exchange/opportunities/${opportunity.opportunityId}/bids`, { method: "POST", userId: STUDENT_A, body: { bidderType: "INDIVIDUAL", proposalSummary: "First bid." } });
  assert.equal(first.status, 201);
  const second = await api(`/metaverse/opportunity-exchange/opportunities/${opportunity.opportunityId}/bids`, { method: "POST", userId: STUDENT_A, body: { bidderType: "INDIVIDUAL", proposalSummary: "Second bid." } });
  assert.equal(second.status, 409);
  assert.equal(second.json.error.code, "DUPLICATE_BID");
});

test("a client cannot claim skill/portfolio evidence it does not own", async () => {
  const opportunity = await openOpportunity();
  const bid = await api(`/metaverse/opportunity-exchange/opportunities/${opportunity.opportunityId}/bids`, {
    method: "POST", userId: STUDENT_A,
    body: { bidderType: "INDIVIDUAL", proposalSummary: "Let me help.", skillEvidenceRefs: ["evidence_not_mine_or_fake"] },
  });
  assert.equal(bid.status, 403);
  assert.equal(bid.json.error.code, "EVIDENCE_NOT_OWNED");
});

test("a team bid requires real canonical team membership — a client cannot forge it", async () => {
  const teamId = await createStudioTeam([STUDENT_A]);
  const opportunity = await openOpportunity({ participationMode: "TEAM", teamSizeMin: 1, teamSizeMax: 3 });

  const forged = await api(`/metaverse/opportunity-exchange/opportunities/${opportunity.opportunityId}/bids`, {
    method: "POST", userId: STUDENT_B, // not a member of teamId
    body: { bidderType: "TEAM", teamId, proposalSummary: "We would like to help." },
  });
  assert.equal(forged.status, 403);
  assert.equal(forged.json.error.code, "TEAM_MEMBERSHIP_REQUIRED");

  const real = await api(`/metaverse/opportunity-exchange/opportunities/${opportunity.opportunityId}/bids`, {
    method: "POST", userId: STUDENT_A, // real active member
    body: { bidderType: "TEAM", teamId, proposalSummary: "We would like to help." },
  });
  assert.equal(real.status, 201, JSON.stringify(real.json));
  assert.equal(real.json.data.teamId, teamId);
});

// ---------------------------------------------------------------------------
// Award / submission / review boundaries
// ---------------------------------------------------------------------------

test("sponsor cannot accept a bid on an opportunity it doesn't own; accepted bid creates an immutable award snapshot; submitted bid becomes immutable", async () => {
  const opportunity = await openOpportunity({ compensationType: "SHF_CREDITS", compensationAmount: 250, currencyType: "SHF" });
  const bid = await api(`/metaverse/opportunity-exchange/opportunities/${opportunity.opportunityId}/bids`, { method: "POST", userId: STUDENT_A, body: { bidderType: "INDIVIDUAL", proposalSummary: "Let me help." } });
  assert.equal(bid.status, 201);

  const forbidden = await api(`/metaverse/opportunity-exchange/bids/${bid.json.data.bidId}/accept`, { method: "POST", userId: INSTRUCTOR_B });
  assert.equal(forbidden.status, 403);

  const award = await api(`/metaverse/opportunity-exchange/bids/${bid.json.data.bidId}/accept`, { method: "POST", userId: SPONSOR });
  assert.equal(award.status, 201, JSON.stringify(award.json));
  assert.equal(award.json.data.status, "AWARDED");
  assert.deepEqual(award.json.data.workScopeSnapshot.title, opportunity.title);
  assert.deepEqual(award.json.data.compensationSnapshot, { type: "SHF_CREDITS", amount: 250, currencyType: "SHF", isIntentOnly: true });
  assert.ok(String(award.json.data.paymentIntentRef).startsWith("payment_intent_"));

  // §18/§28: award never asserts employment, credential, or verified skill.
  const awardKeys = Object.keys(award.json.data);
  for (const forbiddenKey of ["employmentStatus", "credentialId", "verifiedSkill", "isEmployed"]) {
    assert.ok(!awardKeys.includes(forbiddenKey), `award response leaked forbidden key ${forbiddenKey}`);
  }

  // Bid is now ACCEPTED and immutable — withdrawal is refused.
  const withdrawAfterAccept = await api(`/metaverse/opportunity-exchange/bids/${bid.json.data.bidId}/withdraw`, { method: "POST", userId: STUDENT_A });
  assert.equal(withdrawAfterAccept.status, 400);
  assert.equal(withdrawAfterAccept.json.error.code, "INVALID_BID_TRANSITION");
});

test("work submission does not auto-verify evidence; accepted work is only ever described as an evidence candidate; NCA notification really fires", async () => {
  const opportunity = await openOpportunity();
  const bid = await api(`/metaverse/opportunity-exchange/opportunities/${opportunity.opportunityId}/bids`, { method: "POST", userId: STUDENT_A, body: { bidderType: "INDIVIDUAL", proposalSummary: "Let me help." } });
  const award = await api(`/metaverse/opportunity-exchange/bids/${bid.json.data.bidId}/accept`, { method: "POST", userId: SPONSOR });
  const awardId = award.json.data.awardId;

  // Real NCA notification fired for the award (bid.accepted).
  const acceptedNotification = await query("SELECT 1 FROM notifications WHERE recipient_user_id=$1 AND notification_type='OPPORTUNITY_EXCHANGE_BID_ACCEPTED' AND source_entity_id=$2", [STUDENT_A, awardId]);
  assert.ok(acceptedNotification.rows[0], "expected a real OPPORTUNITY_EXCHANGE_BID_ACCEPTED notification row");

  // A non-participant cannot submit work for this award.
  const forgedSubmit = await api(`/metaverse/opportunity-exchange/awards/${awardId}/submissions`, { method: "POST", userId: STUDENT_B, body: { artifactRefs: ["not-real"] } });
  assert.equal(forgedSubmit.status, 403);

  const submitted = await api(`/metaverse/opportunity-exchange/awards/${awardId}/submissions`, { method: "POST", userId: STUDENT_A, body: { artifactRefs: ["artifact_1"], studentComment: "Done!" } });
  assert.equal(submitted.status, 201, JSON.stringify(submitted.json));
  assert.equal(submitted.json.data.status, "SUBMITTED");

  const submittedNotification = await query("SELECT 1 FROM notifications WHERE recipient_user_id=$1 AND notification_type='OPPORTUNITY_EXCHANGE_WORK_SUBMITTED' AND source_entity_id=$2", [SPONSOR, submitted.json.data.submissionId]);
  assert.ok(submittedNotification.rows[0], "expected a real OPPORTUNITY_EXCHANGE_WORK_SUBMITTED notification row");

  const forbiddenReview = await api(`/metaverse/opportunity-exchange/submissions/${submitted.json.data.submissionId}/review`, { method: "POST", userId: STUDENT_A, body: { decision: "ACCEPT" } });
  assert.equal(forbiddenReview.status, 403);

  const reviewed = await api(`/metaverse/opportunity-exchange/submissions/${submitted.json.data.submissionId}/review`, { method: "POST", userId: SPONSOR, body: { decision: "ACCEPT", feedback: "Great work." } });
  assert.equal(reviewed.status, 200, JSON.stringify(reviewed.json));
  assert.equal(reviewed.json.data.submission.status, "ACCEPTED");
  assert.equal(reviewed.json.data.evidenceExpectation.isVerifiedEvidence, false);
  assert.equal(reviewed.json.data.evidenceExpectation.canBecomeEvidenceCandidate, true);

  const finalAward = await api(`/metaverse/opportunity-exchange/awards/${awardId}`, { userId: STUDENT_A });
  assert.equal(finalAward.json.data.status, "COMPLETED");

  // Never silently creates real Evidence — no verified-evidence row exists for this submission.
  const evidenceRows = await query("SELECT 1 FROM prepare_prove_evidence WHERE source_record_id=$1", [submitted.json.data.submissionId]);
  assert.equal(evidenceRows.rows.length, 0);
});

test("a revision-requested submission returns the award to ACTIVE, not COMPLETED", async () => {
  const opportunity = await openOpportunity();
  const bid = await api(`/metaverse/opportunity-exchange/opportunities/${opportunity.opportunityId}/bids`, { method: "POST", userId: STUDENT_A, body: { bidderType: "INDIVIDUAL", proposalSummary: "Let me help." } });
  const award = await api(`/metaverse/opportunity-exchange/bids/${bid.json.data.bidId}/accept`, { method: "POST", userId: SPONSOR });
  const submitted = await api(`/metaverse/opportunity-exchange/awards/${award.json.data.awardId}/submissions`, { method: "POST", userId: STUDENT_A, body: {} });
  const reviewed = await api(`/metaverse/opportunity-exchange/submissions/${submitted.json.data.submissionId}/review`, { method: "POST", userId: SPONSOR, body: { decision: "REQUEST_REVISION", feedback: "Please add more detail." } });
  assert.equal(reviewed.json.data.submission.status, "NEEDS_REVISION");
  const refreshedAward = await api(`/metaverse/opportunity-exchange/awards/${award.json.data.awardId}`, { userId: STUDENT_A });
  assert.equal(refreshedAward.json.data.status, "ACTIVE");
});

// ---------------------------------------------------------------------------
// Structural/source-level boundaries (no live DB round-trip needed)
// ---------------------------------------------------------------------------

test("MET-8 never imports Treasury/payment execution authority (compensation stays an intent)", () => {
  const files = [
    "../src/domain/metaverse/opportunities/service/opportunity-service.ts",
    "../src/domain/metaverse/opportunities/service/bid-service.ts",
    "../src/domain/metaverse/opportunities/service/award-service.ts",
    "../src/domain/metaverse/opportunities/service/submission-service.ts",
  ];
  for (const relative of files) {
    const source = readFileSync(new URL(relative, import.meta.url), "utf8");
    assert.ok(!source.includes("payment-readiness"), `${relative} must not import Treasury/payment execution authority`);
    assert.ok(!source.includes("PaymentReadinessStore"), `${relative} must not touch the payments ledger`);
  }
});

test("MET-8 never calls verified-evidence's write authority directly (evidence candidate only)", () => {
  const source = readFileSync(new URL("../src/domain/metaverse/opportunities/service/opportunity-evidence-adapter.ts", import.meta.url), "utf8");
  // Both names are named in this file's own documentation comment, so check
  // for an actual call (open paren), not the bare word.
  assert.equal(source.includes("projectAuthoritativeFact("), false);
  assert.equal(source.includes("createEvidenceRule("), false);
});

test("MET-6 room contract is reused, not duplicated — no new room type was introduced", () => {
  const roomContract = readFileSync(new URL("../src/domain/metaverse/communication/room-contract.ts", import.meta.url), "utf8");
  assert.ok(roomContract.includes("TEAM_ROOM") && roomContract.includes("PROJECT_ROOM") && roomContract.includes("HELP_SUPPORT_ROOM"));
  for (const relative of ["../src/domain/metaverse/opportunities/model/opportunity-contract.ts", "../src/domain/metaverse/opportunities/api/routes.ts"]) {
    const source = readFileSync(new URL(relative, import.meta.url), "utf8");
    assert.ok(!/_ROOM"/.test(source), `${relative} must not define a new room type`);
  }
});
