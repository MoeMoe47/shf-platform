import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase4opp_${Date.now()}`;
const IDS = {
  programA: `program_${RUN}_a`,
  programB: `program_${RUN}_b`,
  cohortA: `cohort_${RUN}_a`,
  cohortB: `cohort_${RUN}_b`,
};

const BASE_USERS = [
  ["user_admin_001", "org_shf_001", "admin@siliconheartland.org", "SHF Admin"],
  ["user_instructor_001", "org_shf_001", "instructor@siliconheartland.org", "SHF Instructor"],
  [`user_${RUN}_org_only`, "org_shf_001", `orgonly@${RUN}.test`, "Org Only Learner"],
  [`user_${RUN}_program_a`, "org_shf_001", `programa@${RUN}.test`, "Program A Learner"],
  [`user_${RUN}_program_b`, "org_shf_001", `programb@${RUN}.test`, "Program B Learner"],
  [`user_${RUN}_cohort_a`, "org_shf_001", `cohorta@${RUN}.test`, "Cohort A Learner"],
  [`user_${RUN}_cohort_b`, "org_shf_001", `cohortb@${RUN}.test`, "Cohort B Learner"],
  ["user_partner_student_001", "org_partner_001", "student@partner.test", "Partner Learner"],
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

function opportunityInput(title: string, overrides: Record<string, unknown> = {}) {
  return {
    title: `${RUN} ${title}`,
    opportunityType: "INTERNSHIP",
    applicationDeadline: "2026-12-01",
    actionRoute: "/store",
    ...overrides,
  };
}

async function createOpportunity(title: string, body: Record<string, unknown> = {}, userId = "user_admin_001") {
  return api("/opportunities", { method: "POST", userId, body: opportunityInput(title, body) });
}

async function open(id: string, userId = "user_admin_001") {
  return api(`/opportunities/${id}/status`, { method: "PATCH", userId, body: { status: "OPEN" } });
}

async function visibleIds(userId: string) {
  const { status, json } = await api("/opportunities", { userId });
  assert.equal(status, 200);
  return new Set((json.data.items || []).map((item: any) => item.id));
}

async function cleanup() {
  await query("DELETE FROM opportunities WHERE title LIKE $1", [`${RUN} %`]);
  await query("DELETE FROM cohort_staff WHERE cohort_id = ANY($1::text[])", [[IDS.cohortA, IDS.cohortB]]);
  await query("DELETE FROM enrollments WHERE enrollment_id LIKE $1", [`enr_${RUN}_%`]);
  await query("DELETE FROM cohorts WHERE cohort_id = ANY($1::text[])", [[IDS.cohortA, IDS.cohortB]]);
  await query("DELETE FROM programs WHERE program_id = ANY($1::text[])", [[IDS.programA, IDS.programB]]);
}

before(async () => {
  await cleanup();
  await query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
     VALUES
      ('org_shf_001', 'Silicon Heartland Foundation', 'Silicon Heartland Foundation', 'nonprofit', 'active'),
      ('org_partner_001', 'Partner Organization', 'Partner Organization', 'partner', 'active')
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
     VALUES ($1, 'org_shf_001', 'Phase 4 Opp Program A', 'education', 'active'),
            ($2, 'org_shf_001', 'Phase 4 Opp Program B', 'education', 'active')
     ON CONFLICT (program_id) DO NOTHING`,
    [IDS.programA, IDS.programB],
  );
  await query(
    `INSERT INTO cohorts (cohort_id, organization_id, tenant_id, program_id, name, status, starts_at, ends_at, created_by_user_id)
     VALUES
      ($1, 'org_shf_001', 'tenant:org_shf_001', $3, 'Phase 4 Opp Cohort A', 'ACTIVE', NOW() - INTERVAL '1 day', NOW() + INTERVAL '20 days', 'user_admin_001'),
      ($2, 'org_shf_001', 'tenant:org_shf_001', $4, 'Phase 4 Opp Cohort B', 'ACTIVE', NOW() - INTERVAL '1 day', NOW() + INTERVAL '20 days', 'user_admin_001')
     ON CONFLICT (cohort_id) DO NOTHING`,
    [IDS.cohortA, IDS.cohortB, IDS.programA, IDS.programB],
  );
  const enrollmentRows: Array<[string, string, string, string | null]> = [
    [`enr_${RUN}_pa`, `user_${RUN}_program_a`, IDS.programA, null],
    [`enr_${RUN}_pb`, `user_${RUN}_program_b`, IDS.programB, null],
    [`enr_${RUN}_ca`, `user_${RUN}_cohort_a`, IDS.programA, IDS.cohortA],
    [`enr_${RUN}_cb`, `user_${RUN}_cohort_b`, IDS.programB, IDS.cohortB],
  ];
  for (const [enrollmentId, learnerUserId, programId, cohortId] of enrollmentRows) {
    await query(
      `INSERT INTO enrollments (enrollment_id, organization_id, tenant_id, learner_user_id, program_id, cohort_id, status, created_by_user_id)
       VALUES ($1, 'org_shf_001', 'tenant:org_shf_001', $2, $3, $4, 'ACTIVE', 'user_admin_001')
       ON CONFLICT (enrollment_id) DO NOTHING`,
      [enrollmentId, learnerUserId, programId, cohortId],
    );
  }
  await query(
    `INSERT INTO cohort_staff (cohort_staff_id, organization_id, tenant_id, cohort_id, user_id, role, status, created_by_user_id)
     VALUES ($1, 'org_shf_001', 'tenant:org_shf_001', $2, 'user_instructor_001', 'INSTRUCTOR', 'ACTIVE', 'user_admin_001')
     ON CONFLICT DO NOTHING`,
    [`cstaff_${RUN}`, IDS.cohortA],
  );
});

after(async () => {
  await cleanup();
});

test("13. eligible learner sees OPEN Organization-scope opportunity", async () => {
  const created = await createOpportunity("Org Internship");
  await open(created.json.data.id);
  assert.ok((await visibleIds(`user_${RUN}_org_only`)).has(created.json.data.id));
});

test("14. non-entitled learner does not see a Program-scoped opportunity", async () => {
  const created = await createOpportunity("Program A Scholarship", { opportunityType: "SCHOLARSHIP", audienceScope: "PROGRAM", programId: IDS.programA });
  await open(created.json.data.id);
  assert.ok((await visibleIds(`user_${RUN}_program_a`)).has(created.json.data.id));
  assert.ok(!(await visibleIds(`user_${RUN}_program_b`)).has(created.json.data.id));
});

test("15. CLOSED opportunity is not visible to students, but is to its creator", async () => {
  const created = await createOpportunity("Closed Fellowship", { opportunityType: "FELLOWSHIP" });
  await open(created.json.data.id);
  await api(`/opportunities/${created.json.data.id}/status`, { method: "PATCH", userId: "user_admin_001", body: { status: "CLOSED" } });
  assert.ok(!(await visibleIds(`user_${RUN}_org_only`)).has(created.json.data.id));
  assert.ok((await visibleIds("user_admin_001")).has(created.json.data.id));
});

test("16. cross-organization access is denied", async () => {
  const created = await createOpportunity("Cross Org Job", { opportunityType: "JOB" });
  await open(created.json.data.id);
  assert.ok(!(await visibleIds("user_partner_student_001")).has(created.json.data.id));
  assert.equal((await api(`/opportunities/${created.json.data.id}`, { userId: "user_partner_student_001" })).status, 404);
});

test("17. direct-ID read cannot bypass Cohort entitlement", async () => {
  const created = await createOpportunity("Cohort A Apprenticeship", { opportunityType: "APPRENTICESHIP", audienceScope: "COHORT", cohortId: IDS.cohortA }, "user_instructor_001");
  await open(created.json.data.id, "user_instructor_001");
  assert.equal((await api(`/opportunities/${created.json.data.id}`, { userId: `user_${RUN}_cohort_b` })).status, 404);
  assert.equal((await api(`/opportunities/${created.json.data.id}`, { userId: `user_${RUN}_cohort_a` })).status, 200);
});

test("18. Program/Cohort eligibility both work end-to-end for OPEN opportunities", async () => {
  const programOpp = await createOpportunity("Program B Training", { opportunityType: "TRAINING", audienceScope: "PROGRAM", programId: IDS.programB });
  await open(programOpp.json.data.id);
  assert.ok((await visibleIds(`user_${RUN}_program_b`)).has(programOpp.json.data.id));

  const cohortOpp = await createOpportunity("Cohort B Internship", { audienceScope: "COHORT", cohortId: IDS.cohortB }, "user_admin_001");
  await open(cohortOpp.json.data.id);
  assert.ok((await visibleIds(`user_${RUN}_cohort_b`)).has(cohortOpp.json.data.id));
  assert.ok(!(await visibleIds(`user_${RUN}_cohort_a`)).has(cohortOpp.json.data.id));
});

test("19. deadline serializes as a plain YYYY-MM-DD date, not a shifted timestamp", async () => {
  const created = await createOpportunity("Deadline Serialization", { applicationDeadline: "2026-11-15" });
  assert.equal(created.json.data.applicationDeadline, "2026-11-15");
  const fetched = await api(`/opportunities/${created.json.data.id}`, { userId: "user_admin_001" });
  assert.equal(fetched.json.data.applicationDeadline, "2026-11-15");
});

test("20. invalid date range is rejected", async () => {
  const badOpensAt = await createOpportunity("Bad Opens At", { opensAt: "2026-12-15", applicationDeadline: "2026-12-01" });
  assert.equal(badOpensAt.status, 400);
  assert.equal(badOpensAt.json.error.code, "INVALID_DATE_RANGE");

  const badProgramWindow = await createOpportunity("Bad Program Window", { startsAt: "2027-02-01", endsAt: "2027-01-01" });
  assert.equal(badProgramWindow.status, 400);
  assert.equal(badProgramWindow.json.error.code, "INVALID_DATE_RANGE");

  const malformed = await createOpportunity("Malformed Date", { applicationDeadline: "not-a-date" });
  assert.equal(malformed.status, 400);
  assert.equal(malformed.json.error.code, "INVALID_DATE");
});

test("21. action destination validation is safe", async () => {
  const noDestination = await api("/opportunities", {
    method: "POST",
    userId: "user_admin_001",
    body: { title: `${RUN} No Destination`, opportunityType: "OTHER", applicationDeadline: "2026-12-01" },
  });
  assert.equal(noDestination.status, 400);
  assert.equal(noDestination.json.error.code, "ACTION_DESTINATION_REQUIRED");

  const badUrl = await createOpportunity("Bad Url", { actionRoute: undefined, actionUrl: "javascript:alert(1)" });
  assert.equal(badUrl.status, 400);
  assert.equal(badUrl.json.error.code, "INVALID_ACTION_URL");

  const badRoute = await createOpportunity("Bad Route", { actionRoute: "not-a-path" });
  assert.equal(badRoute.status, 400);
  assert.equal(badRoute.json.error.code, "INVALID_ACTION_ROUTE");

  const goodUrl = await createOpportunity("Good External Url", { actionRoute: undefined, actionUrl: "https://example.org/apply" });
  assert.equal(goodUrl.status, 201);
});

test("student-facing DTO does not leak organizationId, tenantId, or targeting internals", async () => {
  const created = await createOpportunity("Student DTO Opportunity", { audienceScope: "COHORT", cohortId: IDS.cohortA }, "user_instructor_001");
  await open(created.json.data.id, "user_instructor_001");
  const view = await api(`/opportunities/${created.json.data.id}`, { userId: `user_${RUN}_cohort_a` });
  assert.equal(view.status, 200);
  for (const field of ["organizationId", "tenantId", "audienceScope", "programId", "cohortId", "createdByUserId"]) {
    assert.equal(view.json.data[field], undefined, `student-facing response leaked ${field}`);
  }
});
