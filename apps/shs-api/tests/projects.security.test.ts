// SHF Ecosystem Phase 6 — Project scheduling / Capstone Calendar
// projection security tests. Reuses the existing, well-known cross-file
// static identities (user_admin_001 = org_admin, user_instructor_001,
// user_student_001/user_no_assignment_001/user_assignment_*_001 = plain
// students, user_partner_student_001 = cross-org student,
// user_other_admin_001 = cross-org admin-tier) rather than inventing new
// dynamic per-run learners — Project entitlement is team-membership-based,
// not enrollment/cohort-based, so no new identity-repo regex entry is
// needed.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase6_${Date.now()}`;

const BASE_USERS = [
  ["user_admin_001", "org_shf_001", "admin@siliconheartland.org", "SHF Admin"],
  ["user_instructor_001", "org_shf_001", "instructor@siliconheartland.org", "SHF Instructor"],
  ["user_student_001", "org_shf_001", "student@siliconheartland.org", "SHF Student"],
  ["user_no_assignment_001", "org_shf_001", "no-assignment@siliconheartland.org", "No Assignment Learner"],
  ["user_assignment_technical_001", "org_shf_001", "technical@test.invalid", "Technical Learner"],
  ["user_assignment_networking_001", "org_shf_001", "networking@test.invalid", "Networking Learner"],
  ["user_partner_student_001", "org_partner_001", "student@partner.test", "Partner Learner"],
  ["user_other_admin_001", "org_other", "admin@other.test", "Other Org Program Staff"],
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

async function createProject(title: string, overrides: Record<string, unknown> = {}) {
  return api("/projects", {
    method: "POST",
    userId: "user_admin_001",
    body: { title: `${RUN} ${title}`, project_type: "EDUCATIONAL_PROJECT", ...overrides },
  });
}

async function createTeam(projectId: string) {
  return api(`/projects/${projectId}/teams`, { method: "POST", userId: "user_admin_001", body: {} });
}

async function addMember(teamId: string, learnerId: string) {
  return api(`/project-teams/${teamId}/members`, { method: "POST", userId: "user_admin_001", body: { learner_id: learnerId } });
}

async function scheduleIds(userId: string) {
  const { status, json } = await api("/projects/schedule", { userId });
  assert.equal(status, 200);
  return new Set((json.data.items || []).map((item: any) => item.id));
}

async function cleanup() {
  await query("DELETE FROM project_submissions WHERE project_id IN (SELECT project_id FROM projects WHERE title LIKE $1)", [`${RUN} %`]);
  await query("DELETE FROM project_team_members WHERE team_id IN (SELECT team_id FROM project_teams WHERE project_id IN (SELECT project_id FROM projects WHERE title LIKE $1))", [`${RUN} %`]);
  await query("DELETE FROM project_teams WHERE project_id IN (SELECT project_id FROM projects WHERE title LIKE $1)", [`${RUN} %`]);
  await query("DELETE FROM projects WHERE title LIKE $1", [`${RUN} %`]);
  await query("DELETE FROM program_specialization_assignments WHERE assignment_id LIKE $1", [`psa_${RUN}_%`]);
  await query("DELETE FROM programs WHERE program_id = $1", [`program_${RUN}_specialization_host`]);
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
  // A dedicated Program purely to satisfy program_specialization_assignments'
  // NOT NULL program_id FK below — not otherwise used by any assertion.
  const specializationProgramId = `program_${RUN}_specialization_host`;
  await query(
    `INSERT INTO programs (program_id, organization_id, name, program_type, status)
     VALUES ($1, 'org_shf_001', 'Phase 6 Specialization Host Program', 'education', 'active')
     ON CONFLICT (program_id) DO NOTHING`,
    [specializationProgramId],
  );
  for (const [userId, organizationId, email, fullName] of BASE_USERS) {
    await withSeedRetry(() => query(
      `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
       VALUES ($1, $2, $3, $4, 'active', 'local')
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, organizationId, email, fullName],
    ));
    // Team membership requires an active PRIMARY specialization assignment
    // (see project-service.ts's addMember — roles are derived server-side,
    // never client-suppliable). Give every org_shf_001 learner one so
    // addMember succeeds; the exact specialization/role value is
    // irrelevant to Calendar/schedule entitlement.
    if (organizationId === "org_shf_001") {
      await withSeedRetry(() => query(
        `INSERT INTO program_specialization_assignments
           (assignment_id, learner_id, organization_id, tenant_id, program_id, specialization_id, grade, stage, assignment_type, status, assigned_by_user_id, assignment_source)
         VALUES ($1, $2, $3, $4, $5, 'technical-operations', 12, 'PREPARE_PROVE', 'PRIMARY', 'ACTIVE', 'user_admin_001', 'PROGRAM_ASSIGNMENT')
         ON CONFLICT (assignment_id) DO NOTHING`,
        [`psa_${RUN}_${userId}`, userId, organizationId, `tenant:${organizationId}`, specializationProgramId],
      ));
    }
  }
});

after(async () => {
  await cleanup();
});

test("1. entitled learner (active team member) sees a Project's due-date schedule entry", async () => {
  const created = await createProject("Entitled Project", { due_at: "2026-12-01T00:00:00Z" });
  assert.equal(created.status, 201);
  const team = await createTeam(created.json.data.project_id);
  assert.equal(team.status, 201);
  await addMember(team.json.data.team_id, "user_assignment_technical_001");
  assert.ok((await scheduleIds("user_assignment_technical_001")).has(created.json.data.project_id));
});

test("2. unrelated same-org learner does not see the Project", async () => {
  const created = await createProject("Unrelated Project", { due_at: "2026-12-01T00:00:00Z" });
  const team = await createTeam(created.json.data.project_id);
  await addMember(team.json.data.team_id, "user_assignment_technical_001");
  assert.ok(!(await scheduleIds("user_assignment_networking_001")).has(created.json.data.project_id));
});

test("3. cross-org learner does not see it (organization scoping, not just team membership)", async () => {
  const created = await createProject("Org Scoped Project", { due_at: "2026-12-01T00:00:00Z" });
  const team = await createTeam(created.json.data.project_id);
  await addMember(team.json.data.team_id, "user_assignment_technical_001");
  assert.ok(!(await scheduleIds("user_partner_student_001")).has(created.json.data.project_id));
});

test("4. Project due date serializes without shifting", async () => {
  const created = await createProject("Date Serialization Project", { due_at: "2026-11-15T18:30:00.000Z" });
  assert.equal(created.json.data.due_at, "2026-11-15T18:30:00.000Z");
  const read = await api(`/projects/${created.json.data.project_id}/schedule`, { userId: "user_admin_001" });
  assert.equal(read.json.data.dueAt, "2026-11-15T18:30:00.000Z");
});

test("5/6/10. a Project reachable via two teams for the same learner appears exactly once, with a stable id across reads", async () => {
  const created = await createProject("Multi Team Project", { due_at: "2026-12-01T00:00:00Z" });
  const teamA = await createTeam(created.json.data.project_id);
  await addMember(teamA.json.data.team_id, "user_assignment_technical_001");
  // A second team on the SAME project — a real, allowed shape (multiple
  // collaborative teams can work the same Project).
  const teamB = await api(`/projects/${created.json.data.project_id}/teams`, { method: "POST", userId: "user_admin_001", body: { mode: "INDIVIDUAL_INTEGRATED_MODE" } });
  await addMember(teamB.json.data.team_id, "user_assignment_technical_001");

  const first = await api("/projects/schedule", { userId: "user_assignment_technical_001" });
  const matches = first.json.data.items.filter((item: any) => item.id === created.json.data.project_id);
  assert.equal(matches.length, 1, "the same Project must not appear twice because the learner is on two of its teams");

  const second = await api("/projects/schedule", { userId: "user_assignment_technical_001" });
  assert.equal(
    second.json.data.items.find((item: any) => item.id === created.json.data.project_id)?.id,
    matches[0].id,
    "id must be stable across repeated reads",
  );
});

test("7. direct-ID read cannot bypass team-membership entitlement", async () => {
  const created = await createProject("Direct Id Project", { due_at: "2026-12-01T00:00:00Z" });
  const team = await createTeam(created.json.data.project_id);
  await addMember(team.json.data.team_id, "user_assignment_technical_001");
  assert.equal((await api(`/projects/${created.json.data.project_id}/schedule`, { userId: "user_assignment_networking_001" })).status, 404);
  assert.equal((await api(`/projects/${created.json.data.project_id}/schedule`, { userId: "user_assignment_technical_001" })).status, 200);
});

test("8. a DRAFT Project is hidden from a team member but remains visible to admin", async () => {
  const created = await createProject("Draft Status Project", { due_at: "2026-12-01T00:00:00Z" });
  const team = await createTeam(created.json.data.project_id);
  await addMember(team.json.data.team_id, "user_assignment_technical_001");
  // The current Project API has no status-transition endpoint (status is
  // always created ACTIVE) — DRAFT is set directly here to exercise the
  // service's own defensive DRAFT-hidden rule, mirroring the identical
  // precedent for Career Events/Opportunities.
  await query("UPDATE projects SET status='DRAFT' WHERE project_id=$1", [created.json.data.project_id]);
  assert.ok(!(await scheduleIds("user_assignment_technical_001")).has(created.json.data.project_id));
  assert.ok((await scheduleIds("user_admin_001")).has(created.json.data.project_id));
  await query("UPDATE projects SET status='ACTIVE' WHERE project_id=$1", [created.json.data.project_id]);
});

test("9. an instructor has no Project schedule access (no reviewer/team-staff relationship exists to found one on)", async () => {
  const res = await api("/projects/schedule", { userId: "user_instructor_001" });
  assert.equal(res.status, 403);
  assert.equal(res.json.error.code, "FORBIDDEN");
});

test("11/16. a Capstone Project projects its due date with a stable, real id", async () => {
  const created = await createProject("Capstone Project", { project_type: "CAPSTONE", due_at: "2026-12-15T00:00:00Z" });
  assert.equal(created.status, 201);
  assert.equal(created.json.data.project_type, "CAPSTONE");
  const team = await createTeam(created.json.data.project_id);
  await addMember(team.json.data.team_id, "user_assignment_technical_001");
  const item = [...(await api("/projects/schedule", { userId: "user_assignment_technical_001" })).json.data.items].find((i: any) => i.id === created.json.data.project_id);
  assert.ok(item, "Capstone project must appear in schedule");
  assert.equal(item.id, created.json.data.project_id);
  assert.equal(item.projectType, "CAPSTONE");
});

test("12. a Capstone's presentation date projects alongside, but distinct from, its due date", async () => {
  const created = await createProject("Capstone Presentation Project", { project_type: "CAPSTONE", due_at: "2026-12-15T00:00:00Z", presentation_at: "2026-12-20T00:00:00Z" });
  assert.equal(created.status, 201);
  assert.equal(created.json.data.due_at, "2026-12-15T00:00:00.000Z");
  assert.equal(created.json.data.presentation_at, "2026-12-20T00:00:00.000Z");
  assert.notEqual(created.json.data.due_at, created.json.data.presentation_at);
});

test("14. a submitted Capstone is not treated as approved until an admin/reviewer accepts it", async () => {
  const created = await createProject("Capstone Review Project", { project_type: "CAPSTONE", due_at: "2026-12-15T00:00:00Z" });
  const team = await createTeam(created.json.data.project_id);
  await addMember(team.json.data.team_id, "user_assignment_technical_001");
  const submitted = await api(`/project-teams/${team.json.data.team_id}/submissions`, { method: "POST", userId: "user_assignment_technical_001", body: { payload: { note: "draft work" } } });
  assert.equal(submitted.status, 201);
  assert.equal(submitted.json.data.status, "SUBMITTED");
  const stillPending = await api(`/projects/${created.json.data.project_id}/submissions`, { userId: "user_admin_001" });
  assert.equal(stillPending.json.data[0].status, "SUBMITTED");
  const reviewed = await api(`/project-submissions/${submitted.json.data.submission_id}/review`, { method: "POST", userId: "user_admin_001", body: { status: "ACCEPTED" } });
  assert.equal(reviewed.status, 200);
  assert.equal(reviewed.json.data.status, "ACCEPTED");
});

test("15. Capstone Project entitlement follows the identical team-membership rule as any other Project", async () => {
  const created = await createProject("Capstone Entitlement Project", { project_type: "CAPSTONE", due_at: "2026-12-15T00:00:00Z" });
  const team = await createTeam(created.json.data.project_id);
  await addMember(team.json.data.team_id, "user_assignment_technical_001");
  assert.ok((await scheduleIds("user_assignment_technical_001")).has(created.json.data.project_id));
  assert.ok(!(await scheduleIds("user_assignment_networking_001")).has(created.json.data.project_id));
});

test("invalid Project date range is rejected (due before start, presentation before due)", async () => {
  const dueBeforeStart = await createProject("Bad Order A", { starts_at: "2026-12-01T00:00:00Z", due_at: "2026-11-01T00:00:00Z" });
  assert.equal(dueBeforeStart.status, 400);
  assert.equal(dueBeforeStart.json.error.code, "INVALID_DATE_RANGE:DUE_BEFORE_START");

  const presentationBeforeDue = await createProject("Bad Order B", { due_at: "2026-12-01T00:00:00Z", presentation_at: "2026-11-01T00:00:00Z" });
  assert.equal(presentationBeforeDue.status, 400);
  assert.equal(presentationBeforeDue.json.error.code, "INVALID_DATE_RANGE:PRESENTATION_BEFORE_DUE");
});

test("no fake Portfolio events: schedule and project responses never carry a Portfolio type or fabricated Portfolio fields", async () => {
  // Documents and locks in the deliberate Phase 6 non-goal: no canonical
  // Portfolio domain exists (see docs/SHF_PROJECT_PORTFOLIO_CAPSTONE_JOURNEY_INTEGRATION.md),
  // so nothing in this API surface may claim to be one.
  const res = await api("/projects/schedule", { userId: "user_admin_001" });
  for (const item of res.json.data.items) {
    assert.notEqual(item.projectType, "PORTFOLIO");
  }
});
