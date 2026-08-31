// SHF Ecosystem Phase 9 — Canonical Calendar Projection Service
// integration tests. Verifies each real source domain projects correctly
// through GET /calendar/events/me, entitlement is preserved per source
// (never widened by the aggregator), and no institutional truth is
// fabricated (Arcade absent, Community only via Career Events).
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase5_${Date.now()}`;
const IDS = {
  programA: `program_${RUN}_a`,
  cohortA: `cohort_${RUN}_a`,
  familyX: `career_family_${RUN}_x`,
  careerX: `career_${RUN}_x`,
};

const BASE_USERS = [
  ["user_admin_001", "org_shf_001", "admin@siliconheartland.org", "SHF Admin"],
  ["user_instructor_001", "org_shf_001", "instructor@siliconheartland.org", "SHF Instructor"],
  [`user_${RUN}_org_only`, "org_shf_001", `orgonly@${RUN}.test`, "Org Only Learner"],
  [`user_${RUN}_cohort_a`, "org_shf_001", `cohorta@${RUN}.test`, "Cohort A Learner"],
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

async function calendarIds(userId: string) {
  const { status, json } = await api("/calendar/events/me", { userId });
  assert.equal(status, 200);
  return { ids: new Set(json.data.items.map((e: any) => e.id)), items: json.data.items as any[] };
}

async function cleanup() {
  await query("DELETE FROM arcade_results WHERE arcade_activity_id IN (SELECT arcade_activity_id FROM arcade_activities WHERE slug LIKE $1)", [`%-${RUN}`]);
  await query("DELETE FROM arcade_attempts WHERE arcade_activity_id IN (SELECT arcade_activity_id FROM arcade_activities WHERE slug LIKE $1)", [`%-${RUN}`]);
  await query("DELETE FROM arcade_activities WHERE slug LIKE $1", [`%-${RUN}`]);
  await query("DELETE FROM learner_credentials WHERE credential_definition_id IN (SELECT credential_definition_id FROM credential_definitions WHERE slug LIKE $1)", [`%-${RUN}`]);
  await query("DELETE FROM credential_definitions WHERE slug LIKE $1", [`%-${RUN}`]);
  await query("DELETE FROM career_events WHERE title LIKE $1", [`${RUN} %`]);
  await query("DELETE FROM opportunities WHERE title LIKE $1", [`${RUN} %`]);
  await query("DELETE FROM project_submissions WHERE project_id IN (SELECT project_id FROM projects WHERE title LIKE $1)", [`${RUN} %`]);
  await query("DELETE FROM project_team_members WHERE team_id IN (SELECT team_id FROM project_teams WHERE project_id IN (SELECT project_id FROM projects WHERE title LIKE $1))", [`${RUN} %`]);
  await query("DELETE FROM project_teams WHERE project_id IN (SELECT project_id FROM projects WHERE title LIKE $1)", [`${RUN} %`]);
  await query("DELETE FROM projects WHERE title LIKE $1", [`${RUN} %`]);
  await query("DELETE FROM program_specialization_assignments WHERE assignment_id LIKE $1", [`psa_${RUN}_%`]);
  await query("DELETE FROM assignment_targets WHERE assignment_id IN (SELECT assignment_id FROM assignments WHERE title LIKE $1)", [`${RUN} %`]);
  await query("DELETE FROM assignments WHERE title LIKE $1", [`${RUN} %`]);
  await query("DELETE FROM live_session_join_events WHERE live_session_id IN (SELECT live_session_id FROM live_sessions WHERE title LIKE $1)", [`${RUN} %`]);
  await query("DELETE FROM live_sessions WHERE title LIKE $1", [`${RUN} %`]);
  await query("DELETE FROM cohort_staff WHERE cohort_id = $1", [IDS.cohortA]);
  await query("DELETE FROM enrollments WHERE enrollment_id LIKE $1", [`enr_${RUN}_%`]);
  await query("DELETE FROM cohorts WHERE cohort_id = $1", [IDS.cohortA]);
  await query("DELETE FROM programs WHERE program_id = $1", [IDS.programA]);
  await query("DELETE FROM careers WHERE career_id = $1", [IDS.careerX]);
  await query("DELETE FROM career_families WHERE career_family_id = $1", [IDS.familyX]);
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
     VALUES ($1, 'org_shf_001', 'Phase 9 Program A', 'education', 'active') ON CONFLICT (program_id) DO NOTHING`,
    [IDS.programA],
  );
  await query(
    `INSERT INTO cohorts (cohort_id, organization_id, tenant_id, program_id, name, status, starts_at, ends_at, created_by_user_id)
     VALUES ($1, 'org_shf_001', 'tenant:org_shf_001', $2, 'Phase 9 Cohort A', 'ACTIVE', NOW() - INTERVAL '1 day', NOW() + INTERVAL '20 days', 'user_admin_001')
     ON CONFLICT (cohort_id) DO NOTHING`,
    [IDS.cohortA, IDS.programA],
  );
  await query(
    `INSERT INTO enrollments (enrollment_id, organization_id, tenant_id, learner_user_id, program_id, cohort_id, status, created_by_user_id)
     VALUES ($1, 'org_shf_001', 'tenant:org_shf_001', $2, $3, $4, 'ACTIVE', 'user_admin_001')
     ON CONFLICT (enrollment_id) DO NOTHING`,
    [`enr_${RUN}_ca`, `user_${RUN}_cohort_a`, IDS.programA, IDS.cohortA],
  );
  await query(
    `INSERT INTO cohort_staff (cohort_staff_id, organization_id, tenant_id, cohort_id, user_id, role, status, created_by_user_id)
     VALUES ($1, 'org_shf_001', 'tenant:org_shf_001', $2, 'user_instructor_001', 'INSTRUCTOR', 'ACTIVE', 'user_admin_001')
     ON CONFLICT DO NOTHING`,
    [`cstaff_${RUN}`, IDS.cohortA],
  );
  await query(
    `INSERT INTO career_families (career_family_id, slug, name, status) VALUES ($1, $2, 'Phase 9 Family', 'active') ON CONFLICT DO NOTHING`,
    [IDS.familyX, `phase9-family-${RUN}`],
  );
  await query(
    `INSERT INTO careers (career_id, slug, title, description, status, career_family_id, sector)
     VALUES ($1, $2, 'Phase 9 Career', 'fixture', 'active', $3, 'technology') ON CONFLICT DO NOTHING`,
    [IDS.careerX, `phase9-career-${RUN}`, IDS.familyX],
  );
});

after(async () => {
  await cleanup();
});

test("1/15/16. an empty learner sees an honest empty result; an org-wide Assignment is entitled, a cross-org learner is denied", async () => {
  const empty = await calendarIds("user_partner_student_001");
  assert.deepEqual([...empty.ids], []);

  const created = await api("/assignments", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Org Assignment`, dueAt: "2026-10-01T00:00:00Z", assignmentType: "assignment", targets: [{ targetType: "ORGANIZATION" }] } });
  assert.equal(created.status, 201);
  const id = `assignment:${created.json.data.id}`;
  assert.ok((await calendarIds(`user_${RUN}_org_only`)).ids.has(id));
  assert.ok(!(await calendarIds("user_partner_student_001")).ids.has(id));
});

test("3/17. a Live Learning session projects for a cohort-entitled learner; an unrelated cohort learner is denied", async () => {
  const created = await api("/live-learning/sessions", { method: "POST", userId: "user_instructor_001", body: { title: `${RUN} Cohort Session`, startsAt: new Date(Date.now() + 3600_000).toISOString(), durationMinutes: 30, cohortId: IDS.cohortA } });
  assert.equal(created.status, 201);
  const id = `live-learning:${created.json.data.id}`;
  assert.ok((await calendarIds(`user_${RUN}_cohort_a`)).ids.has(id));
  assert.ok(!(await calendarIds(`user_${RUN}_org_only`)).ids.has(id));
});

test("4/18. a published Career Event projects for an entitled learner; a cross-org learner is denied", async () => {
  const created = await api("/career-events", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Community Workshop`, eventType: "WORKSHOP", deliveryMode: "IN_PERSON", startsAt: new Date(Date.now() + 3600_000).toISOString(), endsAt: new Date(Date.now() + 7200_000).toISOString() } });
  await api(`/career-events/${created.json.data.id}/status`, { method: "PATCH", userId: "user_admin_001", body: { status: "PUBLISHED" } });
  const id = `career-event:${created.json.data.id}`;
  assert.ok((await calendarIds(`user_${RUN}_org_only`)).ids.has(id));
  assert.ok(!(await calendarIds("user_partner_student_001")).ids.has(id));
});

test("5/19. an open Opportunity's application deadline projects; entitlement is preserved", async () => {
  const created = await api("/opportunities", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Internship`, opportunityType: "INTERNSHIP", applicationDeadline: "2026-11-01", actionRoute: "/store" } });
  await api(`/opportunities/${created.json.data.id}/status`, { method: "PATCH", userId: "user_admin_001", body: { status: "OPEN" } });
  const id = `opportunity:${created.json.data.id}:deadline`;
  assert.ok((await calendarIds(`user_${RUN}_org_only`)).ids.has(id));
  assert.ok(!(await calendarIds("user_partner_student_001")).ids.has(id));
});

test("6/7/8/20. a Project's start/due/presentation all project distinctly; team-membership entitlement is enforced", async () => {
  const specProgram = `program_${RUN}_spec`;
  await query(`INSERT INTO programs (program_id, organization_id, name, program_type, status) VALUES ($1, 'org_shf_001', 'Spec Host', 'education', 'active') ON CONFLICT DO NOTHING`, [specProgram]);
  await withSeedRetry(() => query(
    `INSERT INTO program_specialization_assignments (assignment_id, learner_id, organization_id, tenant_id, program_id, specialization_id, grade, stage, assignment_type, status, assigned_by_user_id, assignment_source)
     VALUES ($1, $2, 'org_shf_001', 'tenant:org_shf_001', $3, 'technical-operations', 12, 'PREPARE_PROVE', 'PRIMARY', 'ACTIVE', 'user_admin_001', 'PROGRAM_ASSIGNMENT') ON CONFLICT DO NOTHING`,
    [`psa_${RUN}_${RUN}_org_only`, `user_${RUN}_org_only`, specProgram],
  ));
  const created = await api("/projects", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Full Schedule Project`, project_type: "EDUCATIONAL_PROJECT", starts_at: "2026-09-01T00:00:00Z", due_at: "2026-10-01T00:00:00Z", presentation_at: "2026-10-08T00:00:00Z" } });
  const team = await api(`/projects/${created.json.data.project_id}/teams`, { method: "POST", userId: "user_admin_001", body: {} });
  await api(`/project-teams/${team.json.data.team_id}/members`, { method: "POST", userId: "user_admin_001", body: { learner_id: `user_${RUN}_org_only` } });

  const member = await calendarIds(`user_${RUN}_org_only`);
  assert.ok(member.ids.has(`project:${created.json.data.project_id}:start`));
  assert.ok(member.ids.has(`project:${created.json.data.project_id}:due`));
  assert.ok(member.ids.has(`project:${created.json.data.project_id}:presentation`));

  const nonMember = await calendarIds(`user_${RUN}_cohort_a`);
  assert.ok(!nonMember.ids.has(`project:${created.json.data.project_id}:due`));
  await query(`DELETE FROM program_specialization_assignments WHERE program_id=$1`, [specProgram]);
  await query(`DELETE FROM programs WHERE program_id=$1`, [specProgram]);
});

test("9/10/21. a Credential's expiration and renewal-due project; a Credential belongs only to its own learner", async () => {
  const def = await api("/credentials/definitions", { method: "POST", userId: "user_admin_001", body: { slug: `phase9-cred-${RUN}`, name: `${RUN} Credential`, credentialType: "INTERNAL", issuingAuthority: "SHF", validityPeriodMonths: 12, renewalWindowDays: 30 } });
  const issued = await api("/credentials/issue", { method: "POST", userId: "user_admin_001", body: { credentialDefinitionId: def.json.data.id, learnerUserId: `user_${RUN}_org_only` } });
  assert.equal(issued.status, 201);

  const owner = await calendarIds(`user_${RUN}_org_only`);
  assert.ok(owner.ids.has(`credential:${issued.json.data.id}:expiration`));
  assert.ok(owner.ids.has(`credential:${issued.json.data.id}:renewal`));

  const other = await calendarIds(`user_${RUN}_cohort_a`);
  assert.ok(!other.ids.has(`credential:${issued.json.data.id}:expiration`));
});

test("11/12. no Arcade event ever appears; Community appears only through the Career Event sourceDomain", async () => {
  const { items } = await calendarIds(`user_${RUN}_org_only`);
  assert.ok(!items.some((e) => e.sourceDomain === "arcade"), "no legitimate Arcade scheduling producer exists — none may ever be fabricated");
  const community = items.find((e) => e.metadata?.eventType === "WORKSHOP");
  if (community) assert.equal(community.sourceDomain, "career-event", "Community must never get its own sourceDomain — it is a Career Event");
});

test("22. an actor cannot impersonate another learner (no client-suppliable learnerId parameter exists)", async () => {
  // Fired concurrently (not sequentially) so both requests observe the
  // same instant of shared org-wide state — org_shf_001 is also written
  // to by other test files running in the same `node --test` process
  // pool (e.g. Phase 10's calendar-intelligence.security.test.ts), so two
  // sequential requests can legitimately observe different org-wide event
  // sets even with zero spoofing involved (SHF Ecosystem Phase 10 fix —
  // this raced intermittently once Phase 10 added more concurrent
  // Calendar-domain test files; the underlying entitlement logic this
  // test verifies was never at fault).
  const [plain, spoofed] = await Promise.all([
    calendarIds(`user_${RUN}_org_only`),
    api(`/calendar/events/me?learnerId=user_admin_001&userId=user_admin_001&actorId=user_admin_001`, { userId: `user_${RUN}_org_only` }),
  ]);
  assert.equal(spoofed.status, 200);
  // The route/service never read any identity from the query string or
  // body — only from the authenticated session — so a spoofed
  // learnerId/userId/actorId parameter must be silently ignored and the
  // result must be byte-identical to the unspoofed request.
  const spoofedIds = new Set(spoofed.json.data.items.map((e: any) => e.id));
  assert.deepEqual([...spoofedIds].sort(), [...plain.ids].sort());
});

test("30. unavailableSources is empty and partial is false on a fully healthy request", async () => {
  const { status, json } = await api("/calendar/events/me", { userId: `user_${RUN}_org_only` });
  assert.equal(status, 200);
  assert.deepEqual(json.data.unavailableSources, []);
  assert.equal(json.data.partial, false);
});
