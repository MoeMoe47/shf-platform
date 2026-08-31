import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase3_${Date.now()}`;
const IDS = {
  programA: `program_${RUN}_a`,
  programB: `program_${RUN}_b`,
  cohortA: `cohort_${RUN}_a`,
  cohortB: `cohort_${RUN}_b`,
  archivedCohort: `cohort_${RUN}_archived`,
};

const BASE_USERS = [
  ["user_admin_001", "org_shf_001", "admin@siliconheartland.org", "SHF Admin"],
  ["user_instructor_001", "org_shf_001", "instructor@siliconheartland.org", "SHF Instructor"],
  ["user_student_001", "org_shf_001", "student@siliconheartland.org", "SHF Student"],
  ["user_no_assignment_001", "org_shf_001", "no-assignment@siliconheartland.org", "No Assignment Learner"],
  ["user_assignment_technical_001", "org_shf_001", "technical@test.invalid", "Technical Learner"],
  ["user_assignment_networking_001", "org_shf_001", "networking@test.invalid", "Networking Learner"],
  ["user_assignment_electrical_001", "org_shf_001", "electrical@test.invalid", "Electrical Learner"],
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

function sessionInput(title: string, overrides: Record<string, unknown> = {}) {
  return {
    title: `${RUN} ${title}`,
    startsAt: new Date(Date.now() + 60_000).toISOString(),
    durationMinutes: 30,
    ...overrides,
  };
}

async function createSession(title: string, body: Record<string, unknown> = {}, userId = "user_instructor_001") {
  return api("/live-learning/sessions", {
    method: "POST",
    userId,
    body: sessionInput(title, body),
  });
}

async function visibleSessionIds(userId: string) {
  const { status, json } = await api("/live-learning/sessions", { userId });
  assert.equal(status, 200);
  return new Set((json.data.items || []).map((item: any) => item.id));
}

async function cleanup() {
  await query("DELETE FROM live_session_join_events WHERE live_session_id IN (SELECT live_session_id FROM live_sessions WHERE title LIKE $1)", [`${RUN} %`]);
  await query("DELETE FROM live_sessions WHERE title LIKE $1", [`${RUN} %`]);
  await query("DELETE FROM cohort_staff WHERE cohort_id = ANY($1::text[])", [[IDS.cohortA, IDS.cohortB, IDS.archivedCohort]]);
  await query("DELETE FROM enrollments WHERE enrollment_id LIKE $1", [`enr_${RUN}_%`]);
  await query("DELETE FROM cohorts WHERE cohort_id = ANY($1::text[])", [[IDS.cohortA, IDS.cohortB, IDS.archivedCohort]]);
  await query("DELETE FROM programs WHERE program_id = ANY($1::text[])", [[IDS.programA, IDS.programB]]);
}

before(async () => {
  await cleanup();
  await query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
     VALUES
      ('org_shf_001', 'Silicon Heartland Foundation', 'Silicon Heartland Foundation', 'nonprofit', 'active'),
      ('org_partner_001', 'Partner Organization', 'Partner Organization', 'partner', 'active'),
      ('org_other', 'Other Organization', 'Other Organization', 'partner', 'active')
     ON CONFLICT (organization_id) DO NOTHING`
  );
  for (const [userId, organizationId, email, fullName] of BASE_USERS) {
    await withSeedRetry(() => query(
      `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
       VALUES ($1, $2, $3, $4, 'active', 'local')
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, organizationId, email, fullName]
    ));
  }
  await query(
    `INSERT INTO programs (program_id, organization_id, name, program_type, status)
     VALUES ($1, 'org_shf_001', 'Phase 3 Program A', 'education', 'active'),
            ($2, 'org_shf_001', 'Phase 3 Program B', 'education', 'active')
     ON CONFLICT (program_id) DO NOTHING`,
    [IDS.programA, IDS.programB]
  );
  await query(
    `INSERT INTO cohorts (cohort_id, organization_id, tenant_id, program_id, name, status, starts_at, ends_at, created_by_user_id)
     VALUES
      ($1, 'org_shf_001', 'tenant:org_shf_001', $4, 'Phase 3 Cohort A', 'ACTIVE', NOW() - INTERVAL '1 day', NOW() + INTERVAL '20 days', 'user_admin_001'),
      ($2, 'org_shf_001', 'tenant:org_shf_001', $5, 'Phase 3 Cohort B', 'ACTIVE', NOW() - INTERVAL '1 day', NOW() + INTERVAL '20 days', 'user_admin_001'),
      ($3, 'org_shf_001', 'tenant:org_shf_001', $4, 'Phase 3 Archived Cohort', 'ARCHIVED', NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day', 'user_admin_001')
     ON CONFLICT (cohort_id) DO NOTHING`,
    [IDS.cohortA, IDS.cohortB, IDS.archivedCohort, IDS.programA, IDS.programB]
  );
  await query(
    `INSERT INTO enrollments (enrollment_id, organization_id, tenant_id, learner_user_id, program_id, cohort_id, status, created_by_user_id)
     VALUES
      ($1, 'org_shf_001', 'tenant:org_shf_001', 'user_student_001', $6, $8, 'ACTIVE', 'user_admin_001'),
      ($2, 'org_shf_001', 'tenant:org_shf_001', 'user_assignment_technical_001', $6, $8, 'ACTIVE', 'user_admin_001'),
      ($3, 'org_shf_001', 'tenant:org_shf_001', 'user_assignment_networking_001', $7, $9, 'ACTIVE', 'user_admin_001'),
      ($4, 'org_shf_001', 'tenant:org_shf_001', 'user_no_assignment_001', $6, $8, 'WITHDRAWN', 'user_admin_001'),
      ($5, 'org_shf_001', 'tenant:org_shf_001', 'user_assignment_electrical_001', $6, $8, 'CANCELLED', 'user_admin_001')
     ON CONFLICT (enrollment_id) DO NOTHING`,
    [
      `enr_${RUN}_student`,
      `enr_${RUN}_tech`,
      `enr_${RUN}_network`,
      `enr_${RUN}_withdrawn`,
      `enr_${RUN}_cancelled`,
      IDS.programA,
      IDS.programB,
      IDS.cohortA,
      IDS.cohortB,
    ]
  );
  await query(
    `INSERT INTO cohort_staff (cohort_staff_id, organization_id, tenant_id, cohort_id, user_id, role, status, created_by_user_id)
     VALUES ($1, 'org_shf_001', 'tenant:org_shf_001', $2, 'user_instructor_001', 'INSTRUCTOR', 'ACTIVE', 'user_admin_001')
     ON CONFLICT DO NOTHING`,
    [`cstaff_${RUN}`, IDS.cohortA]
  );
});

after(async () => {
  await cleanup();
});

test("cohort-scoped session is visible only to active learners in that canonical cohort", async () => {
  const created = await createSession("Cohort Visibility", { cohortId: IDS.cohortA });
  assert.equal(created.status, 201);
  const id = created.json.data.id;

  assert.ok((await visibleSessionIds("user_student_001")).has(id));
  assert.ok((await visibleSessionIds("user_assignment_technical_001")).has(id));
  assert.ok(!(await visibleSessionIds("user_assignment_networking_001")).has(id));
  assert.ok(!(await visibleSessionIds("user_no_assignment_001")).has(id));
  assert.ok(!(await visibleSessionIds("user_assignment_electrical_001")).has(id));
  assert.ok(!(await visibleSessionIds("user_partner_student_001")).has(id));
});

test("direct-id read and join cannot bypass cohort enrollment entitlement", async () => {
  const created = await createSession("Direct Id Cohort", { cohortId: IDS.cohortA });
  assert.equal(created.status, 201);
  const id = created.json.data.id;

  assert.equal((await api(`/live-learning/sessions/${id}`, { userId: "user_assignment_networking_001" })).status, 404);
  assert.equal((await api(`/live-learning/sessions/${id}`, { userId: "user_partner_student_001" })).status, 404);
  const deniedJoin = await api(`/live-learning/sessions/${id}/join`, { method: "POST", userId: "user_assignment_networking_001" });
  assert.equal(deniedJoin.status, 403);
  assert.equal(deniedJoin.json.error.allowed, false);

  const allowedJoin = await api(`/live-learning/sessions/${id}/join`, { method: "POST", userId: "user_student_001" });
  assert.equal(allowedJoin.status, 200);
  assert.equal(allowedJoin.json.data.allowed, true);
});

test("instructor cohort_staff can create/view/manage only authorized cohort-scoped sessions", async () => {
  const authorized = await createSession("Authorized Staff", { cohortId: IDS.cohortA });
  assert.equal(authorized.status, 201);
  assert.equal(authorized.json.data.audienceScope, "COHORT");

  const unauthorizedCreate = await createSession("Unauthorized Staff", { cohortId: IDS.cohortB });
  assert.equal(unauthorizedCreate.status, 403);
  assert.equal(unauthorizedCreate.json.error.code, "COHORT_STAFF_REQUIRED");

  const ids = await visibleSessionIds("user_instructor_001");
  assert.ok(ids.has(authorized.json.data.id));
  const joinEvents = await api(`/live-learning/sessions/${authorized.json.data.id}/join-events`, { userId: "user_instructor_001" });
  assert.equal(joinEvents.status, 200);
});

test("admin remains organization-scoped and cross-org admin cannot bypass", async () => {
  const created = await createSession("Admin Scope", { cohortId: IDS.cohortA });
  const id = created.json.data.id;

  assert.equal((await api(`/live-learning/sessions/${id}`, { userId: "user_admin_001" })).status, 200);
  assert.equal((await api(`/live-learning/sessions/${id}`, { userId: "user_other_admin_001" })).status, 404);
});

test("cohort validation rejects archived cohorts and client organization smuggling", async () => {
  const archived = await createSession("Archived Cohort", { cohortId: IDS.archivedCohort });
  assert.equal(archived.status, 400);
  assert.equal(archived.json.error.code, "COHORT_INACTIVE");

  const crossOrg = await createSession("Cross Org Smuggle", { cohortId: IDS.cohortA, organizationId: "org_partner_001" });
  assert.equal(crossOrg.status, 201);
  assert.equal((await api(`/live-learning/sessions/${crossOrg.json.data.id}`, { userId: "user_partner_student_001" })).status, 404);
});

test("enrollment entitlement does not bypass closed window, provider denial, or inactive session status", async () => {
  const far = await createSession("Far Future Cohort", {
    cohortId: IDS.cohortA,
    startsAt: new Date(Date.now() + 24 * 3600_000).toISOString(),
  });
  const farJoin = await api(`/live-learning/sessions/${far.json.data.id}/join`, { method: "POST", userId: "user_student_001" });
  assert.equal(farJoin.status, 403);
  assert.equal(farJoin.json.error.allowed, false);

  const zoom = await createSession("Zoom Cohort", { cohortId: IDS.cohortA, provider: "zoom" });
  assert.equal(zoom.status, 503);
  assert.equal(zoom.json.error.code, "PROVIDER_NOT_CONFIGURED");

  const cancellable = await createSession("Cancelled Cohort", { cohortId: IDS.cohortA });
  const cancel = await api(`/live-learning/sessions/${cancellable.json.data.id}/cancel`, { method: "POST", userId: "user_instructor_001" });
  assert.equal(cancel.status, 200);
  const cancelledJoin = await api(`/live-learning/sessions/${cancellable.json.data.id}/join`, { method: "POST", userId: "user_student_001" });
  assert.equal(cancelledJoin.status, 403);
  assert.match(cancelledJoin.json.error.message, /cancelled/i);
});

test("organization-wide sessions remain explicit and student-safe", async () => {
  const created = await createSession("Organization Wide");
  assert.equal(created.status, 201);
  assert.equal(created.json.data.audienceScope, "ORGANIZATION");
  assert.equal(created.json.data.cohortId, null);

  const studentView = await api(`/live-learning/sessions/${created.json.data.id}`, { userId: "user_student_001" });
  assert.equal(studentView.status, 200);
  assert.equal(studentView.json.data.audienceScope, "ORGANIZATION");
  for (const forbiddenField of ["accessPolicy", "providerSessionId", "organizationId", "cohortId", "recordingPolicy"]) {
    assert.equal(studentView.json.data[forbiddenField], undefined, `student-facing response leaked ${forbiddenField}`);
  }
});
