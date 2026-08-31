import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";
import { AssignmentRepo } from "../src/domain/assignments/repo/assignment-repo.ts";
import { computeDueState } from "../src/domain/assignments/model/assignment.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase2_${Date.now()}`;
const IDS = {
  programA: `program_${RUN}_a`,
  programB: `program_${RUN}_b`,
  cohortA: `cohort_${RUN}_a`,
  cohortB: `cohort_${RUN}_b`,
  cohortArchived: `cohort_${RUN}_archived`,
};

const BASE_USERS = [
  ["user_admin_001", "org_shf_001", "admin@siliconheartland.org", "SHF Admin"],
  ["user_instructor_001", "org_shf_001", "instructor@siliconheartland.org", "SHF Instructor"],
  ["user_student_001", "org_shf_001", "student@siliconheartland.org", "SHF Student"],
] as const;

function authHeader(userId?: string) {
  return userId ? { Authorization: `Bearer dev-token:${userId}` } : {};
}

async function api(path: string, opts: { method?: string; userId?: string; body?: unknown; extraHeaders?: Record<string, string> } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers: { "Content-Type": "application/json", ...authHeader(opts.userId), ...(opts.extraHeaders || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function createAssignment(title: string, targets: unknown[], overrides: Record<string, unknown> = {}) {
  const { userId = "user_admin_001", ...bodyOverrides } = overrides;
  return api("/assignments", {
    method: "POST",
    userId: String(userId),
    body: {
      title: `${RUN} ${title}`,
      dueAt: new Date(Date.now() + 5 * 86_400_000).toISOString(),
      assignmentType: "assignment",
      targets,
      ...bodyOverrides,
    },
  });
}

async function visibleIds(userId: string) {
  const { status, json } = await api("/assignments", { userId });
  assert.equal(status, 200);
  return new Set((json.data.items || []).map((item: any) => item.id));
}

async function cleanup() {
  await query("DELETE FROM assignment_targets WHERE assignment_id IN (SELECT assignment_id FROM assignments WHERE title LIKE $1)", [`${RUN} %`]);
  await query("DELETE FROM assignments WHERE title LIKE $1", [`${RUN} %`]);
  await query("DELETE FROM cohort_staff WHERE cohort_id = ANY($1::text[])", [[IDS.cohortA, IDS.cohortB, IDS.cohortArchived]]);
  await query("DELETE FROM enrollments WHERE enrollment_id LIKE $1", [`enr_${RUN}_%`]);
  await query("DELETE FROM cohorts WHERE cohort_id = ANY($1::text[])", [[IDS.cohortA, IDS.cohortB, IDS.cohortArchived]]);
  await query("DELETE FROM programs WHERE program_id = ANY($1::text[])", [[IDS.programA, IDS.programB]]);
}

before(async () => {
  await cleanup();
  await query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
     VALUES
      ('org_shf_001', 'Silicon Heartland Foundation', 'Silicon Heartland Foundation', 'nonprofit', 'active'),
      ('org_partner_001', 'Partner Organization', 'Partner Organization', 'partner', 'active')
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
  await withSeedRetry(() => query(
    `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
     VALUES
      ('user_no_assignment_001', 'org_shf_001', 'no-assignment@siliconheartland.org', 'No Assignment Learner', 'active', 'local'),
      ('user_assignment_technical_001', 'org_shf_001', 'technical@test.invalid', 'Technical Learner', 'active', 'local'),
      ('user_assignment_networking_001', 'org_shf_001', 'networking@test.invalid', 'Networking Learner', 'active', 'local'),
      ('user_assignment_electrical_001', 'org_shf_001', 'electrical@test.invalid', 'Electrical Learner', 'active', 'local'),
      ('user_partner_student_001', 'org_partner_001', 'student@partner.test', 'Partner Learner', 'active', 'local')
     ON CONFLICT (user_id) DO UPDATE SET organization_id = EXCLUDED.organization_id, status = 'active'`
  ));
  await query(
    `INSERT INTO programs (program_id, organization_id, name, program_type, status)
     VALUES ($1, 'org_shf_001', 'Phase 2 Program A', 'education', 'active'),
            ($2, 'org_shf_001', 'Phase 2 Program B', 'education', 'active')
     ON CONFLICT (program_id) DO NOTHING`,
    [IDS.programA, IDS.programB]
  );
  await query(
    `INSERT INTO cohorts (cohort_id, organization_id, tenant_id, program_id, name, status, starts_at, ends_at, created_by_user_id)
     VALUES
      ($1, 'org_shf_001', 'tenant:org_shf_001', $4, 'Phase 2 Cohort A', 'ACTIVE', NOW() - INTERVAL '1 day', NOW() + INTERVAL '20 days', 'user_admin_001'),
      ($2, 'org_shf_001', 'tenant:org_shf_001', $5, 'Phase 2 Cohort B', 'ACTIVE', NOW() - INTERVAL '1 day', NOW() + INTERVAL '20 days', 'user_admin_001'),
      ($3, 'org_shf_001', 'tenant:org_shf_001', $4, 'Phase 2 Archived Cohort', 'ARCHIVED', NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day', 'user_admin_001')
     ON CONFLICT (cohort_id) DO NOTHING`,
    [IDS.cohortA, IDS.cohortB, IDS.cohortArchived, IDS.programA, IDS.programB]
  );
  await query(
    `INSERT INTO enrollments (enrollment_id, organization_id, tenant_id, learner_user_id, program_id, cohort_id, status, created_by_user_id)
     VALUES
      ($1, 'org_shf_001', 'tenant:org_shf_001', 'user_assignment_technical_001', $4, $5, 'ACTIVE', 'user_admin_001'),
      ($2, 'org_shf_001', 'tenant:org_shf_001', 'user_assignment_networking_001', $4, NULL, 'ACTIVE', 'user_admin_001'),
      ($3, 'org_shf_001', 'tenant:org_shf_001', 'user_assignment_electrical_001', $6, $7, 'ACTIVE', 'user_admin_001')
     ON CONFLICT (enrollment_id) DO NOTHING`,
    [`enr_${RUN}_tech`, `enr_${RUN}_network`, `enr_${RUN}_electrical`, IDS.programA, IDS.cohortA, IDS.programB, IDS.cohortB]
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

test("direct LEARNER target is visible only to the targeted learner", async () => {
  const created = await createAssignment("Learner Target", [{ targetType: "LEARNER", learnerUserId: "user_assignment_technical_001" }]);
  assert.equal(created.status, 201);
  const id = created.json.data.id;
  assert.ok((await visibleIds("user_assignment_technical_001")).has(id));
  assert.ok(!(await visibleIds("user_assignment_networking_001")).has(id));
  assert.ok(!(await visibleIds("user_partner_student_001")).has(id));
});

test("COHORT target uses ACTIVE Enrollment and same cohort, not same program alone", async () => {
  const created = await createAssignment("Cohort Target", [{ targetType: "COHORT", cohortId: IDS.cohortA }]);
  assert.equal(created.status, 201);
  const id = created.json.data.id;
  assert.ok((await visibleIds("user_assignment_technical_001")).has(id));
  assert.ok(!(await visibleIds("user_assignment_networking_001")).has(id));
  assert.ok(!(await visibleIds("user_no_assignment_001")).has(id));
});

test("PROGRAM target uses ACTIVE Enrollment and excludes other programs", async () => {
  const created = await createAssignment("Program Target", [{ targetType: "PROGRAM", programId: IDS.programA }]);
  assert.equal(created.status, 201);
  const id = created.json.data.id;
  assert.ok((await visibleIds("user_assignment_technical_001")).has(id));
  assert.ok((await visibleIds("user_assignment_networking_001")).has(id));
  assert.ok(!(await visibleIds("user_assignment_electrical_001")).has(id));
  assert.ok(!(await visibleIds("user_no_assignment_001")).has(id));
});

test("explicit ORGANIZATION target is visible within org only", async () => {
  const created = await createAssignment("Organization Target", [{ targetType: "ORGANIZATION" }]);
  assert.equal(created.status, 201);
  const id = created.json.data.id;
  assert.ok((await visibleIds("user_student_001")).has(id));
  assert.ok(!(await visibleIds("user_partner_student_001")).has(id));
});

test("assignment with no target fails closed for list and direct-id reads", async () => {
  const repo = new AssignmentRepo();
  const orphan = await repo.create({
    id: `asmt_${RUN}_orphan`,
    organizationId: "org_shf_001",
    cohortId: null,
    courseId: null,
    lessonId: null,
    title: `${RUN} Orphan`,
    description: null,
    assignmentType: "assignment",
    visibilityScope: "organization",
    createdBy: "user_admin_001",
    availableAt: null,
    dueAt: new Date(Date.now() + 86_400_000).toISOString(),
    closesAt: null,
    status: "published",
  });
  assert.ok(!(await visibleIds("user_student_001")).has(orphan.id));
  const direct = await api(`/assignments/${orphan.id}`, { userId: "user_student_001" });
  assert.equal(direct.status, 404);
});

test("direct-id read cannot bypass learner, cohort, or program entitlement", async () => {
  const created = await createAssignment("Direct Id Probe", [{ targetType: "PROGRAM", programId: IDS.programA }]);
  const id = created.json.data.id;
  assert.equal((await api(`/assignments/${id}`, { userId: "user_assignment_electrical_001" })).status, 404);
  assert.equal((await api(`/assignments/${id}`, { userId: "user_assignment_technical_001" })).status, 200);
});

test("multiple matching targets produce one assignment row", async () => {
  const created = await createAssignment("Duplicate Entitlement", [
    { targetType: "LEARNER", learnerUserId: "user_assignment_technical_001" },
    { targetType: "COHORT", cohortId: IDS.cohortA },
    { targetType: "PROGRAM", programId: IDS.programA },
  ]);
  const id = created.json.data.id;
  const { json } = await api("/assignments", { userId: "user_assignment_technical_001" });
  assert.equal(json.data.items.filter((item: any) => item.id === id).length, 1);
});

test("target validation rejects cross-org, inactive cohort, mismatched cohort, invalid type, and duplicate targets", async () => {
  assert.equal((await createAssignment("Cross Org Target", [{ targetType: "LEARNER", learnerUserId: "user_partner_student_001" }])).status, 400);
  const inactiveCohort = await createAssignment("Archived Cohort Target", [{ targetType: "COHORT", cohortId: IDS.cohortArchived }]);
  assert.equal(inactiveCohort.status, 400);
  assert.equal(inactiveCohort.json.error.code, "COHORT_INACTIVE");
  const mismatch = await createAssignment("Mismatched Cohort Target", [{ targetType: "COHORT", cohortId: IDS.cohortB }], { cohortId: IDS.cohortA });
  assert.equal(mismatch.status, 400);
  assert.equal(mismatch.json.error.code, "ASSIGNMENT_COHORT_MISMATCH");
  assert.equal((await createAssignment("Invalid Type", [{ targetType: "COURSE", courseId: "course-x" }])).status, 400);

  const dup = await createAssignment("Duplicate Targets", [
    { targetType: "LEARNER", learnerUserId: "user_assignment_technical_001" },
    { targetType: "LEARNER", learnerUserId: "user_assignment_technical_001" },
  ]);
  assert.equal(dup.status, 201);
  assert.equal((await new AssignmentRepo().listTargets(dup.json.data.id)).length, 1);
});

test("client-supplied IDs cannot broaden access", async () => {
  const created = await createAssignment("Client Smuggle", [{ targetType: "LEARNER", learnerUserId: "user_assignment_networking_001" }]);
  const id = created.json.data.id;
  const viaQuery = await api(`/assignments?userId=user_assignment_networking_001&programId=${IDS.programA}`, { userId: "user_assignment_technical_001" });
  assert.ok(!viaQuery.json.data.items.some((item: any) => item.id === id));
  const viaHeader = await api("/assignments", { userId: "user_assignment_technical_001", extraHeaders: { "X-User-Id": "user_assignment_networking_001" } });
  assert.ok(!viaHeader.json.data.items.some((item: any) => item.id === id));
});

test("instructor cohort staff sees cohort-targeted assignment; unrelated instructor identity does not", async () => {
  const adminCreated = await createAssignment("Cohort Staff Visible", [{ targetType: "COHORT", cohortId: IDS.cohortA }]);
  const id = adminCreated.json.data.id;
  const instructor = await api("/assignments", { userId: "user_instructor_001" });
  assert.ok(instructor.json.data.items.some((item: any) => item.id === id));
  const unrelated = await new AssignmentRepo().listForInstructor({ organizationId: "org_shf_001", userId: "user_id_with_no_staff" });
  assert.ok(!unrelated.some((item) => item.id === id));
});

test("admin remains organization scoped", async () => {
  const created = await createAssignment("Admin Scoped", [{ targetType: "ORGANIZATION" }]);
  const id = created.json.data.id;
  const admin = await api("/assignments", { userId: "user_admin_001" });
  assert.ok(admin.json.data.items.some((item: any) => item.id === id));
  assert.ok(!(await visibleIds("user_partner_student_001")).has(id));
});

test("legacy create shape still maps to explicit targets", async () => {
  const orgWide = await api("/assignments", {
    method: "POST",
    userId: "user_instructor_001",
    body: { title: `${RUN} Legacy Org`, dueAt: new Date(Date.now() + 86_400_000).toISOString(), visibilityScope: "organization" },
  });
  assert.equal(orgWide.status, 201);
  assert.ok((await visibleIds("user_student_001")).has(orgWide.json.data.id));

  const targeted = await api("/assignments", {
    method: "POST",
    userId: "user_instructor_001",
    body: { title: `${RUN} Legacy Learner`, dueAt: new Date(Date.now() + 86_400_000).toISOString(), visibilityScope: "targeted", targetUserIds: ["user_assignment_technical_001"] },
  });
  assert.equal(targeted.status, 201);
  assert.ok((await visibleIds("user_assignment_technical_001")).has(targeted.json.data.id));
  assert.ok(!(await visibleIds("user_assignment_networking_001")).has(targeted.json.data.id));
});

test("computeDueState keeps due-state separate from completion truth", () => {
  const now = new Date(2026, 7, 29, 10, 0, 0);
  assert.equal(computeDueState(new Date(2026, 7, 28, 23, 59).toISOString(), now), "overdue");
  assert.equal(computeDueState(new Date(2026, 7, 29, 23, 59).toISOString(), now), "due_today");
  assert.equal(computeDueState(new Date(2026, 7, 31, 9, 0).toISOString(), now), "due_soon");
  assert.equal(computeDueState(new Date(2026, 8, 10, 9, 0).toISOString(), now), "upcoming");
});
