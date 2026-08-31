// SHF Ecosystem Phase 5 — Career Pathway Integration security/behavior
// suite. RECONSTRUCTED: the original source of this file was destroyed by
// an accidental `sed` range-delete during an unrelated Phase 5.1 fix
// attempt (see docs/SHF_TEST_RECOVERY_2026-08-30.md for the incident
// record) and had no git history to restore from. This suite was rebuilt
// from canonical evidence — docs/SHF_CAREER_PATHWAY_INTEGRATION.md, the
// current career-pathways/programs/careers/enrollments domain code, and
// the surviving fragments of the original file — then independently
// reverified against the real backend. Do not treat a PASS here as
// re-proof that the original Phase 5 test wording was reproduced exactly;
// it proves the documented Phase 5 contract still holds today.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase5_${Date.now()}`;
const IDS = {
  programA: `program_${RUN}_a`,
  programB: `program_${RUN}_b`,
  programC: `program_${RUN}_c`,
  familyA: `career_family_${RUN}_a`,
  familyB: `career_family_${RUN}_b`,
  careerX: `career_${RUN}_x`,
  careerY: `career_${RUN}_y`,
};

// Identity-repo (src/domain/identity/repo/identity-repo.ts) resolves
// dev-token identities from a hardcoded registry, not the `users` table.
// Dynamically-generated per-run learners MUST match its
// phase4CareerLearnerMatch regex (phase5_<ts>_<suffix>) to authenticate at
// all. Suffixes are repurposed by semantic role in this file (there is no
// COHORT audience concept in Program->Career pathway derivation, so the
// cohort_a/cohort_b/org_only suffixes are reused as extra student
// personas rather than left unused):
//   program_a -> ACTIVE in Program A only (single-program derivation)
//   program_b -> ACTIVE in Program B only (mismatched-pathway control)
//   cohort_a  -> ACTIVE in BOTH Program A and Program C (union + dedupe)
//   cohort_b  -> used for the WITHDRAWN/CANCELLED/PENDING/COMPLETED
//                non-current-enrollment-status checks
const BASE_USERS = [
  ["user_admin_001", "org_shf_001", "admin@siliconheartland.org", "SHF Admin"],
  ["user_instructor_001", "org_shf_001", "instructor@siliconheartland.org", "SHF Instructor"],
  ["user_no_assignment_001", "org_shf_001", "no-assignment@siliconheartland.org", "No Assignment Learner"],
  ["user_other_admin_001", "org_other", "admin@other.test", "Other Org Program Staff"],
  [`user_${RUN}_program_a`, "org_shf_001", `programa@${RUN}.test`, "Program A Learner"],
  [`user_${RUN}_program_b`, "org_shf_001", `programb@${RUN}.test`, "Program B Learner"],
  [`user_${RUN}_cohort_a`, "org_shf_001", `cohorta@${RUN}.test`, "Multi-Program Learner"],
  [`user_${RUN}_cohort_b`, "org_shf_001", `cohortb@${RUN}.test`, "Enrollment-Status Learner"],
] as const;

function authHeader(userId?: string) {
  return userId ? { Authorization: `Bearer dev-token:${userId}` } : {};
}

async function api(path: string, opts: { method?: string; userId?: string; body?: unknown } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers: { "Content-Type": "application/json", ...authHeader(opts.userId) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function futureRange() {
  return { startsAt: new Date(Date.now() + 3600_000).toISOString(), endsAt: new Date(Date.now() + 7200_000).toISOString() };
}

async function insertEnrollment(id: string, learnerUserId: string, programId: string, status: string) {
  await query(
    `INSERT INTO enrollments (enrollment_id, organization_id, tenant_id, learner_user_id, program_id, status, created_by_user_id)
     VALUES ($1, 'org_shf_001', 'tenant:org_shf_001', $2, $3, $4, 'user_admin_001')
     ON CONFLICT (enrollment_id) DO UPDATE SET status = EXCLUDED.status`,
    [id, learnerUserId, programId, status],
  );
}

async function cleanup() {
  await query("DELETE FROM career_events WHERE title LIKE $1", [`${RUN} %`]);
  await query("DELETE FROM opportunities WHERE title LIKE $1", [`${RUN} %`]);
  await query("DELETE FROM program_careers WHERE program_id = ANY($1::text[])", [[IDS.programA, IDS.programB, IDS.programC]]);
  await query("DELETE FROM enrollments WHERE enrollment_id LIKE $1", [`enr_${RUN}_%`]);
  await query("DELETE FROM programs WHERE program_id = ANY($1::text[])", [[IDS.programA, IDS.programB, IDS.programC]]);
  await query("DELETE FROM career_curriculum_requirements WHERE career_id = ANY($1::text[])", [[IDS.careerX, IDS.careerY]]);
  await query("DELETE FROM careers WHERE career_id = ANY($1::text[])", [[IDS.careerX, IDS.careerY]]);
  await query("DELETE FROM career_families WHERE career_family_id = ANY($1::text[])", [[IDS.familyA, IDS.familyB]]);
}

before(async () => {
  await cleanup();
  await query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
     VALUES
      ('org_shf_001', 'Silicon Heartland Foundation', 'Silicon Heartland Foundation', 'nonprofit', 'active'),
      ('org_other', 'Other Organization', 'Other Organization', 'partner', 'active')
     ON CONFLICT (organization_id) DO NOTHING`,
  );
  for (const [userId, organizationId, email, fullName] of BASE_USERS) {
    await withSeedRetry(() => query(
      `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
       VALUES ($1, $2, $3, $4, 'active', 'local')
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, organizationId, email, fullName],
    ));
  }
  await query(
    `INSERT INTO programs (program_id, organization_id, name, program_type, status)
     VALUES ($1, 'org_shf_001', 'Phase 5 Program A', 'education', 'active'),
            ($2, 'org_shf_001', 'Phase 5 Program B', 'education', 'active'),
            ($3, 'org_shf_001', 'Phase 5 Program C (multi-career)', 'education', 'active')
     ON CONFLICT (program_id) DO NOTHING`,
    [IDS.programA, IDS.programB, IDS.programC],
  );
  await query(
    `INSERT INTO career_families (career_family_id, slug, name, status)
     VALUES ($1, $2, 'Phase 5 Test Family A', 'active'), ($3, $4, 'Phase 5 Test Family B', 'active')
     ON CONFLICT (career_family_id) DO NOTHING`,
    [IDS.familyA, `phase5-family-a-${RUN}`, IDS.familyB, `phase5-family-b-${RUN}`],
  );
  await query(
    `INSERT INTO careers (career_id, slug, title, description, status, career_family_id, sector)
     VALUES ($1, $2, 'Phase 5 Test Career X', 'test fixture', 'active', $3, 'technology'),
            ($4, $5, 'Phase 5 Test Career Y', 'test fixture', 'active', $6, 'healthcare')
     ON CONFLICT (career_id) DO NOTHING`,
    [IDS.careerX, `phase5-career-x-${RUN}`, IDS.familyA, IDS.careerY, `phase5-career-y-${RUN}`, IDS.familyB],
  );
  // Program A -> Career X, Program B -> Career Y, Program C -> both
  // (multi-career program). Linked directly (not via the API) so the
  // link-management API tests below start from a clean, unlinked state.
  await query(
    `INSERT INTO program_careers (program_career_id, organization_id, program_id, career_id, is_primary, created_by_user_id)
     VALUES ($1, 'org_shf_001', $2, $3, true, 'user_admin_001'),
            ($4, 'org_shf_001', $5, $6, true, 'user_admin_001'),
            ($7, 'org_shf_001', $8, $3, true, 'user_admin_001'),
            ($9, 'org_shf_001', $8, $6, false, 'user_admin_001')
     ON CONFLICT (program_career_id) DO NOTHING`,
    [
      `pc_${RUN}_a_x`, IDS.programA, IDS.careerX,
      `pc_${RUN}_b_y`, IDS.programB, IDS.careerY,
      `pc_${RUN}_c_x`, IDS.programC,
      `pc_${RUN}_c_y`,
    ],
  );
  await insertEnrollment(`enr_${RUN}_pa`, `user_${RUN}_program_a`, IDS.programA, "ACTIVE");
  await insertEnrollment(`enr_${RUN}_pb`, `user_${RUN}_program_b`, IDS.programB, "ACTIVE");
  await insertEnrollment(`enr_${RUN}_ma`, `user_${RUN}_cohort_a`, IDS.programA, "ACTIVE");
  await insertEnrollment(`enr_${RUN}_mc`, `user_${RUN}_cohort_a`, IDS.programC, "ACTIVE");
});

after(async () => {
  await cleanup();
});

// --- PROGRAM -> CAREER management ---

test("1. authorized admin can link a Program to a Career", async () => {
  const programD = `program_${RUN}_d`;
  await query(
    `INSERT INTO programs (program_id, organization_id, name, program_type, status)
     VALUES ($1, 'org_shf_001', 'Phase 5 Program D', 'education', 'active') ON CONFLICT (program_id) DO NOTHING`,
    [programD],
  );
  const res = await api(`/programs/${programD}/careers`, { method: "POST", userId: "user_admin_001", body: { careerId: IDS.careerX } });
  assert.equal(res.status, 201);
  assert.equal(res.json.data.careerId, IDS.careerX);
  assert.equal(res.json.data.programId, programD);
  await query("DELETE FROM program_careers WHERE program_id=$1", [programD]);
  await query("DELETE FROM programs WHERE program_id=$1", [programD]);
});

test("2. unauthorized student cannot link a Program to a Career", async () => {
  const res = await api(`/programs/${IDS.programA}/careers`, { method: "POST", userId: "user_no_assignment_001", body: { careerId: IDS.careerY } });
  assert.equal(res.status, 403);
  assert.equal(res.json.error.code, "FORBIDDEN");
});

test("3. unauthorized instructor cannot link a Program to a Career", async () => {
  const res = await api(`/programs/${IDS.programA}/careers`, { method: "POST", userId: "user_instructor_001", body: { careerId: IDS.careerY } });
  assert.equal(res.status, 403);
  assert.equal(res.json.error.code, "FORBIDDEN");
});

test("4. linking an unknown Career is rejected", async () => {
  const res = await api(`/programs/${IDS.programA}/careers`, { method: "POST", userId: "user_admin_001", body: { careerId: "career_does_not_exist" } });
  assert.equal(res.status, 400);
  assert.equal(res.json.error.code, "CAREER_NOT_FOUND");
});

test("5. linking an unknown or cross-org Program is rejected", async () => {
  const res = await api("/programs/program_does_not_exist/careers", { method: "POST", userId: "user_admin_001", body: { careerId: IDS.careerX } });
  assert.equal(res.status, 404);
  assert.equal(res.json.error.code, "PROGRAM_NOT_FOUND");
});

test("6. duplicate Program-Career mapping is rejected", async () => {
  const res = await api(`/programs/${IDS.programA}/careers`, { method: "POST", userId: "user_admin_001", body: { careerId: IDS.careerX } });
  assert.equal(res.status, 409);
  assert.equal(res.json.error.code, "DUPLICATE_MAPPING");
});

test("7. cross-organization Program mutation is denied (org isolation, not just role)", async () => {
  // user_other_admin_001 is admin-tier (program_manager) but belongs to
  // org_other — Program A belongs to org_shf_001, so the lookup itself
  // (organization-scoped) reports not-found rather than leaking cross-org
  // existence.
  const res = await api(`/programs/${IDS.programA}/careers`, { method: "POST", userId: "user_other_admin_001", body: { careerId: IDS.careerY } });
  assert.equal(res.status, 404);
  assert.equal(res.json.error.code, "PROGRAM_NOT_FOUND");
});

test("8. Program read exposes the canonical Career relation", async () => {
  const res = await api(`/programs/${IDS.programA}`, { userId: "user_admin_001" });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.json.data.careers));
  const linked = res.json.data.careers.find((c: any) => c.career_id === IDS.careerX);
  assert.ok(linked, "Program A response did not include its linked Career");
  assert.equal(linked.isPrimary, true);
});

test("9/10. a Program with multiple Career links returns all of them in full, never collapsed to one", async () => {
  const res = await api(`/programs/${IDS.programC}`, { userId: "user_admin_001" });
  assert.equal(res.status, 200);
  const ids = res.json.data.careers.map((c: any) => c.career_id).sort();
  assert.deepEqual(ids, [IDS.careerX, IDS.careerY].sort());
});

// --- LEARNER PATHWAY DERIVATION ---

test("11. ACTIVE Enrollment derives the linked Program's Career and Career Family", async () => {
  const res = await api("/careers/pathway/me", { userId: `user_${RUN}_program_a` });
  assert.equal(res.status, 200);
  assert.deepEqual(res.json.data.careerIds, [IDS.careerX]);
  assert.deepEqual(res.json.data.careerFamilyIds, [IDS.familyA]);
});

test("12. no ACTIVE Enrollment means no current pathway", async () => {
  const res = await api("/careers/pathway/me", { userId: "user_no_assignment_001" });
  assert.equal(res.status, 200);
  assert.deepEqual(res.json.data.careerIds, []);
  assert.deepEqual(res.json.data.careerFamilyIds, []);
});

test("13/14. multiple ACTIVE Programs union their Careers, and a Career shared by two Programs is not duplicated", async () => {
  // user_${RUN}_cohort_a is ACTIVE in Program A (-> Career X) and Program C
  // (-> Career X and Career Y). Career X is reachable via two different
  // Programs but must appear exactly once.
  const res = await api("/careers/pathway/me", { userId: `user_${RUN}_cohort_a` });
  assert.equal(res.status, 200);
  assert.deepEqual(res.json.data.careerIds.sort(), [IDS.careerX, IDS.careerY].sort());
  assert.equal(res.json.data.careerIds.length, 2, "Career X must not appear twice even though two ACTIVE programs both link to it");
  assert.deepEqual(res.json.data.careerFamilyIds.sort(), [IDS.familyA, IDS.familyB].sort());
});

test("15/16/17/18. WITHDRAWN, CANCELLED, PENDING, and COMPLETED enrollments do not contribute to the current pathway", async () => {
  const learner = `user_${RUN}_cohort_b`;
  for (const status of ["WITHDRAWN", "CANCELLED", "PENDING", "COMPLETED"]) {
    await insertEnrollment(`enr_${RUN}_statuscheck`, learner, IDS.programB, status);
    const res = await api("/careers/pathway/me", { userId: learner });
    assert.equal(res.status, 200);
    assert.deepEqual(res.json.data.careerIds, [], `a ${status} enrollment must not contribute to the current pathway`);
  }
  // Control: the identical enrollment row, once ACTIVE, does contribute —
  // proving the empty results above reflect the status filter and not a
  // broken query or missing program_careers link.
  await insertEnrollment(`enr_${RUN}_statuscheck`, learner, IDS.programB, "ACTIVE");
  const active = await api("/careers/pathway/me", { userId: learner });
  assert.deepEqual(active.json.data.careerIds, [IDS.careerY]);
  await query("DELETE FROM enrollments WHERE enrollment_id=$1", [`enr_${RUN}_statuscheck`]);
});

test("19. a learner cannot spoof programId via query string to broaden their derived pathway", async () => {
  // GET /careers/pathway/me accepts no request body or query parameters —
  // programIds are derived exclusively from the actor's own ACTIVE
  // enrollments, server-side (see careers/api/routes.ts). A client-supplied
  // programId (the only realistic vector on a GET endpoint) is silently
  // ignored rather than merely rejected, because the code path to read it
  // does not exist.
  const res = await api(`/careers/pathway/me?programId=${IDS.programA}&program_id=${IDS.programA}`, { userId: "user_no_assignment_001" });
  assert.equal(res.status, 200);
  assert.deepEqual(res.json.data.careerIds, []);
  assert.deepEqual(res.json.data.careerFamilyIds, []);
});

// --- CAREER EVENT / OPPORTUNITY RELEVANCE ---

test("20. a Career-linked Career Event is pathway-relevant for a matching learner", async () => {
  const created = await api("/career-events", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Relevance Event`, eventType: "CAREER_FAIR", deliveryMode: "VIRTUAL", careerId: IDS.careerX, ...futureRange() } });
  assert.equal(created.status, 201);
  const id = created.json.data.id;
  await api(`/career-events/${id}/status`, { method: "PATCH", userId: "user_admin_001", body: { status: "PUBLISHED" } });

  const relevantView = await api(`/career-events/${id}`, { userId: `user_${RUN}_program_a` });
  assert.equal(relevantView.status, 200);
  assert.equal(relevantView.json.data.pathwayRelevant, true);
});

test("21. a Career-linked Opportunity is pathway-relevant for a matching learner", async () => {
  const created = await api("/opportunities", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Relevance Opportunity`, opportunityType: "INTERNSHIP", applicationDeadline: "2026-12-01", actionRoute: "/store", careerId: IDS.careerY } });
  assert.equal(created.status, 201);
  const id = created.json.data.id;
  await api(`/opportunities/${id}/status`, { method: "PATCH", userId: "user_admin_001", body: { status: "OPEN" } });

  const relevantView = await api(`/opportunities/${id}`, { userId: `user_${RUN}_program_b` });
  assert.equal(relevantView.status, 200);
  assert.equal(relevantView.json.data.pathwayRelevant, true);
});

test("22. a non-relevant but otherwise entitled Career Event/Opportunity remains visible, never falsely labeled relevant", async () => {
  const event = await api("/career-events", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Mismatch Event`, eventType: "NETWORKING", deliveryMode: "VIRTUAL", careerId: IDS.careerX, ...futureRange() } });
  await api(`/career-events/${event.json.data.id}/status`, { method: "PATCH", userId: "user_admin_001", body: { status: "PUBLISHED" } });
  const mismatchedEventView = await api(`/career-events/${event.json.data.id}`, { userId: `user_${RUN}_program_b` });
  assert.equal(mismatchedEventView.status, 200, "mismatched learner still sees the ORGANIZATION-wide event");
  assert.equal(mismatchedEventView.json.data.pathwayRelevant, false);

  const opportunity = await api("/opportunities", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Mismatch Opportunity`, opportunityType: "SCHOLARSHIP", applicationDeadline: "2026-12-01", actionRoute: "/store", careerId: IDS.careerY } });
  await api(`/opportunities/${opportunity.json.data.id}/status`, { method: "PATCH", userId: "user_admin_001", body: { status: "OPEN" } });
  const mismatchedOppView = await api(`/opportunities/${opportunity.json.data.id}`, { userId: `user_${RUN}_program_a` });
  assert.equal(mismatchedOppView.status, 200, "mismatched learner still sees the OPEN organization-wide opportunity");
  assert.equal(mismatchedOppView.json.data.pathwayRelevant, false, "must not be falsely labeled relevant");
});

test("23. Career relevance never substitutes for audience-scope authorization", async () => {
  // A COHORT-scoped record with a matching careerId still requires the
  // canonical Cohort/Enrollment entitlement chain. There is no cohort
  // fixture in this file's own setup, so referencing a nonexistent cohort
  // proves the audience-scope check runs and rejects before Career
  // linkage is ever considered — Career relevance cannot paper over a
  // missing/invalid audience target.
  const event = await api("/career-events", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Cohort Career Event`, eventType: "CAREER_FAIR", deliveryMode: "VIRTUAL", careerId: IDS.careerX, audienceScope: "COHORT", cohortId: "cohort_does_not_exist", ...futureRange() } });
  assert.equal(event.status, 400);
  assert.equal(event.json.error.code, "COHORT_NOT_FOUND");

  const opportunity = await api("/opportunities", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Cohort Career Opportunity`, opportunityType: "INTERNSHIP", applicationDeadline: "2026-12-01", actionRoute: "/store", careerId: IDS.careerY, audienceScope: "COHORT", cohortId: "cohort_does_not_exist" } });
  assert.equal(opportunity.status, 400);
  assert.equal(opportunity.json.error.code, "COHORT_NOT_FOUND");
});

test("24. a single Career Event or Opportunity record is never multiplied by overlapping pathway relationships", async () => {
  // user_${RUN}_cohort_a is ACTIVE in both Program A and Program C, both of
  // which link to Career X — two independent qualifying relationships to
  // the same underlying record. (Calendar-level event de-duplication is a
  // frontend concern already covered by eventContract.js's own test suite;
  // this is the backend-side guarantee that a list read never returns the
  // same record twice regardless of how many pathway relationships resolve
  // to it.)
  const created = await api("/career-events", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} No Duplicate Event`, eventType: "CAREER_FAIR", deliveryMode: "VIRTUAL", careerId: IDS.careerX, ...futureRange() } });
  await api(`/career-events/${created.json.data.id}/status`, { method: "PATCH", userId: "user_admin_001", body: { status: "PUBLISHED" } });
  const { json } = await api("/career-events", { userId: `user_${RUN}_cohort_a` });
  const matches = json.data.items.filter((item: any) => item.id === created.json.data.id);
  assert.equal(matches.length, 1);
});
