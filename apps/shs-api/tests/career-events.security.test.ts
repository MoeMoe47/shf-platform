import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase4ce_${Date.now()}`;
const IDS = {
  programA: `program_${RUN}_a`,
  programB: `program_${RUN}_b`,
  cohortA: `cohort_${RUN}_a`,
  cohortB: `cohort_${RUN}_b`,
  familyX: `career_family_${RUN}_x`,
  careerX: `career_${RUN}_x`,
};

const BASE_USERS = [
  ["user_admin_001", "org_shf_001", "admin@siliconheartland.org", "SHF Admin"],
  ["user_instructor_001", "org_shf_001", "instructor@siliconheartland.org", "SHF Instructor"],
  ["user_student_001", "org_shf_001", "student@siliconheartland.org", "SHF Student"],
  [`user_${RUN}_org_only`, "org_shf_001", `orgonly@${RUN}.test`, "Org Only Learner"],
  [`user_${RUN}_program_a`, "org_shf_001", `programa@${RUN}.test`, "Program A Learner"],
  [`user_${RUN}_program_b`, "org_shf_001", `programb@${RUN}.test`, "Program B Learner"],
  [`user_${RUN}_cohort_a`, "org_shf_001", `cohorta@${RUN}.test`, "Cohort A Learner"],
  [`user_${RUN}_cohort_b`, "org_shf_001", `cohortb@${RUN}.test`, "Cohort B Learner"],
  ["user_partner_student_001", "org_partner_001", "student@partner.test", "Partner Learner"],
  ["user_other_admin_001", "org_other", "admin@other.test", "Other Admin"],
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

function eventInput(title: string, overrides: Record<string, unknown> = {}) {
  return {
    title: `${RUN} ${title}`,
    eventType: "CAREER_FAIR",
    deliveryMode: "VIRTUAL",
    startsAt: new Date(Date.now() + 3600_000).toISOString(),
    endsAt: new Date(Date.now() + 7200_000).toISOString(),
    ...overrides,
  };
}

async function createEvent(title: string, body: Record<string, unknown> = {}, userId = "user_admin_001") {
  return api("/career-events", { method: "POST", userId, body: eventInput(title, body) });
}

async function publish(id: string, userId = "user_admin_001") {
  return api(`/career-events/${id}/status`, { method: "PATCH", userId, body: { status: "PUBLISHED" } });
}

async function visibleIds(userId: string) {
  const { status, json } = await api("/career-events", { userId });
  assert.equal(status, 200);
  return new Set((json.data.items || []).map((item: any) => item.id));
}

async function cleanup() {
  await query("DELETE FROM career_events WHERE title LIKE $1", [`${RUN} %`]);
  await query("DELETE FROM cohort_staff WHERE cohort_id = ANY($1::text[])", [[IDS.cohortA, IDS.cohortB]]);
  await query("DELETE FROM enrollments WHERE enrollment_id LIKE $1", [`enr_${RUN}_%`]);
  await query("DELETE FROM cohorts WHERE cohort_id = ANY($1::text[])", [[IDS.cohortA, IDS.cohortB]]);
  await query("DELETE FROM programs WHERE program_id = ANY($1::text[])", [[IDS.programA, IDS.programB]]);
  await query("DELETE FROM careers WHERE career_id = $1", [IDS.careerX]);
  await query("DELETE FROM career_families WHERE career_family_id = $1", [IDS.familyX]);
}

before(async () => {
  await cleanup();
  await query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
     VALUES
      ('org_shf_001', 'Silicon Heartland Foundation', 'Silicon Heartland Foundation', 'nonprofit', 'active'),
      ('org_partner_001', 'Partner Organization', 'Partner Organization', 'partner', 'active'),
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
     VALUES ($1, 'org_shf_001', 'Phase 4 CE Program A', 'education', 'active'),
            ($2, 'org_shf_001', 'Phase 4 CE Program B', 'education', 'active')
     ON CONFLICT (program_id) DO NOTHING`,
    [IDS.programA, IDS.programB],
  );
  await query(
    `INSERT INTO cohorts (cohort_id, organization_id, tenant_id, program_id, name, status, starts_at, ends_at, created_by_user_id)
     VALUES
      ($1, 'org_shf_001', 'tenant:org_shf_001', $3, 'Phase 4 CE Cohort A', 'ACTIVE', NOW() - INTERVAL '1 day', NOW() + INTERVAL '20 days', 'user_admin_001'),
      ($2, 'org_shf_001', 'tenant:org_shf_001', $4, 'Phase 4 CE Cohort B', 'ACTIVE', NOW() - INTERVAL '1 day', NOW() + INTERVAL '20 days', 'user_admin_001')
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
  await query(
    `INSERT INTO career_families (career_family_id, slug, name, status)
     VALUES ($1, $2, 'Phase 4 CE Test Family', 'active')
     ON CONFLICT (career_family_id) DO NOTHING`,
    [IDS.familyX, `phase4ce-family-${RUN}`],
  );
  await query(
    `INSERT INTO careers (career_id, slug, title, description, status, career_family_id, sector)
     VALUES ($1, $2, 'Phase 4 CE Test Career', 'test fixture', 'active', $3, 'technology')
     ON CONFLICT (career_id) DO NOTHING`,
    [IDS.careerX, `phase4ce-career-${RUN}`, IDS.familyX],
  );
});

after(async () => {
  await cleanup();
});

test("eligible learner sees ORGANIZATION-scoped published event", async () => {
  const created = await createEvent("Org Career Fair");
  await publish(created.json.data.id);
  assert.ok((await visibleIds(`user_${RUN}_org_only`)).has(created.json.data.id));
});

test("Program-enrolled learner sees PROGRAM-scoped event; non-enrolled same-org learner does not", async () => {
  const created = await createEvent("Program A Session", { eventType: "EMPLOYER_SESSION", audienceScope: "PROGRAM", programId: IDS.programA });
  await publish(created.json.data.id);
  assert.ok((await visibleIds(`user_${RUN}_program_a`)).has(created.json.data.id));
  assert.ok(!(await visibleIds(`user_${RUN}_program_b`)).has(created.json.data.id));
});

test("Cohort-enrolled learner sees COHORT-scoped event; learner in a different cohort does not", async () => {
  const created = await createEvent("Cohort A Workshop", { eventType: "WORKSHOP", audienceScope: "COHORT", cohortId: IDS.cohortA }, "user_instructor_001");
  await publish(created.json.data.id, "user_instructor_001");
  assert.ok((await visibleIds(`user_${RUN}_cohort_a`)).has(created.json.data.id));
  assert.ok(!(await visibleIds(`user_${RUN}_cohort_b`)).has(created.json.data.id));
});

test("cross-organization learner does not see this organization's event", async () => {
  const created = await createEvent("Cross Org Fair", { eventType: "HIRING_EVENT" });
  await publish(created.json.data.id);
  assert.ok(!(await visibleIds("user_partner_student_001")).has(created.json.data.id));
  assert.equal((await api(`/career-events/${created.json.data.id}`, { userId: "user_partner_student_001" })).status, 404);
});

test("DRAFT event is not student-visible, but is visible to its creator", async () => {
  const created = await createEvent("Draft Only Event");
  assert.equal(created.json.data.status, "DRAFT");
  assert.ok(!(await visibleIds(`user_${RUN}_org_only`)).has(created.json.data.id));
  assert.ok((await visibleIds("user_admin_001")).has(created.json.data.id));
});

test("direct-ID read cannot bypass Cohort entitlement", async () => {
  const created = await createEvent("Cohort A Interview Day", { eventType: "INTERVIEW", audienceScope: "COHORT", cohortId: IDS.cohortA }, "user_instructor_001");
  await publish(created.json.data.id, "user_instructor_001");
  assert.equal((await api(`/career-events/${created.json.data.id}`, { userId: `user_${RUN}_cohort_b` })).status, 404);
  assert.equal((await api(`/career-events/${created.json.data.id}`, { userId: `user_${RUN}_cohort_a` })).status, 200);
});

test("instructor without authorized cohort_staff cannot view or manage a Cohort B-scoped event", async () => {
  const created = await createEvent("Cohort B Mentor Session", { eventType: "MENTOR_SESSION", audienceScope: "COHORT", cohortId: IDS.cohortB }, "user_admin_001");
  const id = created.json.data.id;
  assert.equal((await api(`/career-events/${id}`, { userId: "user_instructor_001" })).status, 404);
  const publishAttempt = await publish(id, "user_instructor_001");
  assert.equal(publishAttempt.status, 403);
  assert.equal(publishAttempt.json.error.code, "FORBIDDEN");
});

test("authorized cohort_staff CAN manage and then view their cohort's event even when they did not create it", async () => {
  // DRAFT visibility is creator-or-admin only (see canView in
  // career-event-service.ts) — active cohort_staff is a MANAGEMENT
  // entitlement (canManageAudienceScopedRecord), not a DRAFT-view
  // entitlement, mirroring the "CLOSED opportunity visible only to its
  // creator" precedent in opportunities.security.test.ts. So a non-creator
  // cohort_staff instructor cannot view this event while it is still
  // DRAFT, but CAN publish it, and can view it once PUBLISHED.
  const created = await createEvent("Cohort A Staff Managed Event", { audienceScope: "COHORT", cohortId: IDS.cohortA }, "user_admin_001");
  const id = created.json.data.id;
  assert.equal((await api(`/career-events/${id}`, { userId: "user_instructor_001" })).status, 404);
  const publishAttempt = await publish(id, "user_instructor_001");
  assert.equal(publishAttempt.status, 200);
  assert.equal(publishAttempt.json.data.status, "PUBLISHED");
  assert.equal((await api(`/career-events/${id}`, { userId: "user_instructor_001" })).status, 200);
});

test("student cannot create a career event", async () => {
  const attempt = await createEvent("Student Attempted Event", {}, "user_student_001");
  assert.equal(attempt.status, 403);
  assert.equal(attempt.json.error.code, "FORBIDDEN");
});

test("admin remains organization-scoped: cannot view or manage another organization's event", async () => {
  const created = await createEvent("SHF-Only Fair", { eventType: "CAREER_FAIR" });
  await publish(created.json.data.id);
  const crossOrgView = await api(`/career-events/${created.json.data.id}`, { userId: "user_other_admin_001" });
  assert.equal(crossOrgView.status, 404);
  const crossOrgManage = await api(`/career-events/${created.json.data.id}/status`, { method: "PATCH", userId: "user_other_admin_001", body: { status: "CANCELLED" } });
  assert.equal(crossOrgManage.status, 403);
  assert.equal(crossOrgManage.json.error.code, "FORBIDDEN");
});

test("Career linkage does not bypass Cohort audience entitlement", async () => {
  const created = await createEvent("Career-Linked Cohort Event", { audienceScope: "COHORT", cohortId: IDS.cohortA, careerId: IDS.careerX }, "user_instructor_001");
  assert.equal(created.status, 201);
  assert.equal(created.json.data.careerId, IDS.careerX);
  await publish(created.json.data.id, "user_instructor_001");
  // A mismatched-cohort learner still cannot see it, even though the event
  // carries a Career linkage — Career association is never a substitute
  // for the canonical Cohort/Enrollment entitlement chain.
  assert.equal((await api(`/career-events/${created.json.data.id}`, { userId: `user_${RUN}_cohort_b` })).status, 404);
});

test("student-facing DTO does not leak organizationId, tenantId, or targeting internals", async () => {
  const created = await createEvent("Student DTO Event", { audienceScope: "COHORT", cohortId: IDS.cohortA }, "user_instructor_001");
  await publish(created.json.data.id, "user_instructor_001");
  const view = await api(`/career-events/${created.json.data.id}`, { userId: `user_${RUN}_cohort_a` });
  assert.equal(view.status, 200);
  for (const field of ["organizationId", "tenantId", "audienceScope", "programId", "cohortId", "createdByUserId"]) {
    assert.equal(view.json.data[field], undefined, `student-facing response leaked ${field}`);
  }
});

test("invalid date range is rejected", async () => {
  const badRange = await createEvent("Bad Range Event", { startsAt: new Date(Date.now() + 7200_000).toISOString(), endsAt: new Date(Date.now() + 3600_000).toISOString() });
  assert.equal(badRange.status, 400);
  assert.equal(badRange.json.error.code, "INVALID_DATE_RANGE");
});
