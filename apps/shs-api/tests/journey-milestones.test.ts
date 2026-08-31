// SHF Ecosystem Phase 6 — Journey Milestones projection tests. Journey
// Milestones is a read-only aggregation over Enrollment, Project, and
// Career Event facts — never a second source of truth. These tests prove
// both what it truthfully surfaces and what it deliberately never
// fabricates (Credential/Assessment/Portfolio milestone types).
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase6journey_${Date.now()}`;
// A dedicated, RUN-unique learner rather than the shared static
// "user_no_assignment_001" — that identity is also used heavily for
// issuance in credentials.security.test.ts, and this file's "clean
// slate"/empty-list assertions require a learner untouched by any other
// file's fixtures. "phase5_..._org_only" matches identity-repo.ts's
// existing dynamic-learner regex, so it authenticates without needing a
// new pattern.
const LEARNER = `user_phase5_${Date.now()}_org_only`;
const IDS = {
  program: `program_${RUN}`,
  cohort: `cohort_${RUN}`,
};

const BASE_USERS = [
  ["user_admin_001", "org_shf_001", "admin@siliconheartland.org", "SHF Admin"],
  [LEARNER, "org_shf_001", `${LEARNER}@test.invalid`, "Isolated Journey Learner"],
  ["user_assignment_technical_001", "org_shf_001", "technical@test.invalid", "Technical Learner"],
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

async function milestones(userId: string) {
  const { status, json } = await api("/journey/milestones/me", { userId });
  assert.equal(status, 200);
  return json.data.items as Array<{ id: string; type: string; title: string; occursAt: string; status: string }>;
}

async function insertEnrollment(id: string, learnerUserId: string, startsAt: string) {
  await query(
    `INSERT INTO enrollments (enrollment_id, organization_id, tenant_id, learner_user_id, program_id, status, starts_at, created_by_user_id)
     VALUES ($1, 'org_shf_001', 'tenant:org_shf_001', $2, $3, 'ACTIVE', $4, 'user_admin_001')
     ON CONFLICT (enrollment_id) DO UPDATE SET starts_at = EXCLUDED.starts_at`,
    [id, learnerUserId, IDS.program, startsAt],
  );
}

async function cleanup() {
  await query("DELETE FROM arcade_results WHERE arcade_activity_id IN (SELECT arcade_activity_id FROM arcade_activities WHERE slug LIKE $1)", [`%-${RUN}`]);
  await query("DELETE FROM arcade_attempts WHERE arcade_activity_id IN (SELECT arcade_activity_id FROM arcade_activities WHERE slug LIKE $1)", [`%-${RUN}`]);
  await query("DELETE FROM arcade_activities WHERE slug LIKE $1", [`%-${RUN}`]);
  await query("DELETE FROM career_events WHERE title LIKE $1", [`${RUN} %`]);
  await query("DELETE FROM project_submissions WHERE project_id IN (SELECT project_id FROM projects WHERE title LIKE $1)", [`${RUN} %`]);
  await query("DELETE FROM project_team_members WHERE team_id IN (SELECT team_id FROM project_teams WHERE project_id IN (SELECT project_id FROM projects WHERE title LIKE $1))", [`${RUN} %`]);
  await query("DELETE FROM project_teams WHERE project_id IN (SELECT project_id FROM projects WHERE title LIKE $1)", [`${RUN} %`]);
  await query("DELETE FROM projects WHERE title LIKE $1", [`${RUN} %`]);
  await query("DELETE FROM program_specialization_assignments WHERE assignment_id LIKE $1", [`psa_${RUN}_%`]);
  await query("DELETE FROM enrollments WHERE enrollment_id LIKE $1", [`enr_${RUN}_%`]);
  await query("DELETE FROM cohort_staff WHERE cohort_id = $1", [IDS.cohort]);
  await query("DELETE FROM cohorts WHERE cohort_id = $1", [IDS.cohort]);
  await query("DELETE FROM programs WHERE program_id = $1", [IDS.program]);
}

before(async () => {
  await cleanup();
  await query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
     VALUES ('org_shf_001', 'Silicon Heartland Foundation', 'Silicon Heartland Foundation', 'nonprofit', 'active')
     ON CONFLICT (organization_id) DO NOTHING`,
  );
  await query(
    `INSERT INTO programs (program_id, organization_id, name, program_type, status)
     VALUES ($1, 'org_shf_001', 'Phase 6 Journey Program', 'education', 'active')
     ON CONFLICT (program_id) DO NOTHING`,
    [IDS.program],
  );
  for (const [userId, organizationId, email, fullName] of BASE_USERS) {
    await withSeedRetry(() => query(
      `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
       VALUES ($1, $2, $3, $4, 'active', 'local')
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, organizationId, email, fullName],
    ));
    await withSeedRetry(() => query(
      `INSERT INTO program_specialization_assignments
         (assignment_id, learner_id, organization_id, tenant_id, program_id, specialization_id, grade, stage, assignment_type, status, assigned_by_user_id, assignment_source)
       VALUES ($1, $2, $3, $4, $5, 'technical-operations', 12, 'PREPARE_PROVE', 'PRIMARY', 'ACTIVE', 'user_admin_001', 'PROGRAM_ASSIGNMENT')
       ON CONFLICT (assignment_id) DO NOTHING`,
      [`psa_${RUN}_${userId}`, userId, organizationId, `tenant:${organizationId}`, IDS.program],
    ));
  }
});

after(async () => {
  await cleanup();
});

test("22. an ACTIVE Enrollment produces a real PROGRAM_START milestone from its own starts_at", async () => {
  await insertEnrollment(`enr_${RUN}_start`, LEARNER, "2026-01-15T00:00:00Z");
  const items = await milestones(LEARNER);
  const start = items.find((m) => m.type === "PROGRAM_START");
  assert.ok(start, "expected a PROGRAM_START milestone");
  assert.equal(start!.occursAt, "2026-01-15T00:00:00.000Z");
  assert.equal(start!.status, "completed", "a start date in the past is a completed fact, not an upcoming one");
  await query("DELETE FROM enrollments WHERE enrollment_id=$1", [`enr_${RUN}_start`]);
});

test("12. no Enrollment means no PROGRAM_START milestone (never invented from account creation)", async () => {
  const items = await milestones(LEARNER);
  assert.ok(!items.some((m) => m.type === "PROGRAM_START"));
});

test("23/29. a Project milestone projects and requires owning-domain ACCEPTED status to read as completed", async () => {
  const project = await api("/projects", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Journey Project`, project_type: "EDUCATIONAL_PROJECT", due_at: "2026-06-01T00:00:00Z" } });
  const team = await api(`/projects/${project.json.data.project_id}/teams`, { method: "POST", userId: "user_admin_001", body: {} });
  await api(`/project-teams/${team.json.data.team_id}/members`, { method: "POST", userId: "user_admin_001", body: { learner_id: "user_assignment_technical_001" } });

  const beforeSubmission = await milestones("user_assignment_technical_001");
  const projectMilestone = beforeSubmission.find((m) => m.id === `project:${project.json.data.project_id}:due`);
  assert.ok(projectMilestone, "expected a PROJECT milestone");
  assert.equal(projectMilestone!.status, "upcoming");

  const submitted = await api(`/project-teams/${team.json.data.team_id}/submissions`, { method: "POST", userId: "user_assignment_technical_001", body: {} });
  const afterSubmission = await milestones("user_assignment_technical_001");
  assert.equal(afterSubmission.find((m) => m.id === projectMilestone!.id)?.status, "upcoming", "a SUBMITTED (not yet reviewed) submission must not read as completed");

  await api(`/project-submissions/${submitted.json.data.submission_id}/review`, { method: "POST", userId: "user_admin_001", body: { status: "ACCEPTED" } });
  const afterAcceptance = await milestones("user_assignment_technical_001");
  assert.equal(afterAcceptance.find((m) => m.id === projectMilestone!.id)?.status, "completed", "an ACCEPTED submission is the only thing that may mark this completed");
});

test("24/13. a Capstone milestone projects its due date and does not complete from date passage alone", async () => {
  const capstone = await api("/projects", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Journey Capstone`, project_type: "CAPSTONE", due_at: "2020-01-01T00:00:00Z" } });
  const team = await api(`/projects/${capstone.json.data.project_id}/teams`, { method: "POST", userId: "user_admin_001", body: {} });
  await api(`/project-teams/${team.json.data.team_id}/members`, { method: "POST", userId: "user_admin_001", body: { learner_id: "user_assignment_technical_001" } });

  const items = await milestones("user_assignment_technical_001");
  const capstoneMilestone = items.find((m) => m.id === `project:${capstone.json.data.project_id}:due`);
  assert.ok(capstoneMilestone);
  assert.equal(capstoneMilestone!.type, "CAPSTONE");
  assert.equal(capstoneMilestone!.status, "upcoming", "a due date years in the past must not be treated as completed absent an ACCEPTED submission");
});

test("24b. a non-Capstone Project presentation remains a PROJECT milestone", async () => {
  const project = await api("/projects", {
    method: "POST",
    userId: "user_admin_001",
    body: {
      title: `${RUN} Journey Project Presentation`,
      project_type: "EDUCATIONAL_PROJECT",
      due_at: "2026-06-01T00:00:00Z",
      presentation_at: "2026-06-02T00:00:00Z",
    },
  });
  const team = await api(`/projects/${project.json.data.project_id}/teams`, { method: "POST", userId: "user_admin_001", body: {} });
  await api(`/project-teams/${team.json.data.team_id}/members`, { method: "POST", userId: "user_admin_001", body: { learner_id: "user_assignment_technical_001" } });

  const items = await milestones("user_assignment_technical_001");
  const presentation = items.find((m) => m.id === `project:${project.json.data.project_id}:presentation`);
  assert.ok(presentation);
  assert.equal(presentation!.type, "PROJECT");
});

test("25. a PUBLISHED, ORGANIZATION-scope Career Event produces a CAREER_EVENT milestone; DRAFT does not", async () => {
  const published = await api("/career-events", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Journey Fair`, eventType: "CAREER_FAIR", deliveryMode: "VIRTUAL", startsAt: new Date(Date.now() + 3600_000).toISOString(), endsAt: new Date(Date.now() + 7200_000).toISOString() } });
  await api(`/career-events/${published.json.data.id}/status`, { method: "PATCH", userId: "user_admin_001", body: { status: "PUBLISHED" } });
  const draft = await api("/career-events", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Journey Draft Event`, eventType: "WORKSHOP", deliveryMode: "VIRTUAL", startsAt: new Date(Date.now() + 3600_000).toISOString(), endsAt: new Date(Date.now() + 7200_000).toISOString() } });

  const items = await milestones(LEARNER);
  assert.ok(items.some((m) => m.id === `career-event:${published.json.data.id}:milestone`));
  assert.ok(!items.some((m) => m.id === `career-event:${draft.json.data.id}:milestone`), "a DRAFT Career Event must never appear as a milestone");
});

test("26. no Assessment or Portfolio milestone is ever fabricated (no canonical producer exists for either)", async () => {
  const items = await milestones(LEARNER);
  for (const item of items) {
    assert.ok(!["ASSESSMENT", "PORTFOLIO"].includes(item.type), `unexpected fabricated milestone type: ${item.type}`);
  }
});

test("36/37/38/39. a CREDENTIAL_EARNED milestone requires canonical ISSUED status — never eligibility, never a revoked issuance", async () => {
  const def = await api("/credentials/definitions", { method: "POST", userId: "user_admin_001", body: { slug: `${RUN}-journey-cred`, name: `${RUN} Journey Credential`, credentialType: "INTERNAL", issuingAuthority: "SHF" } });
  const learner = LEARNER;

  const beforeIssuance = await milestones(learner);
  assert.ok(!beforeIssuance.some((m) => m.type === "CREDENTIAL_EARNED"), "eligibility/no-issuance must not produce a milestone");

  const issued = await api("/credentials/issue", { method: "POST", userId: "user_admin_001", body: { credentialDefinitionId: def.json.data.id, learnerUserId: learner } });
  const afterIssuance = await milestones(learner);
  const earned = afterIssuance.find((m) => m.id === `credential:${issued.json.data.id}:earned`);
  assert.ok(earned, "an ISSUED credential must produce a CREDENTIAL_EARNED milestone");
  assert.equal(earned.status, "completed");
  assert.equal(earned.occursAt, issued.json.data.issuedAt);

  await api(`/credentials/${issued.json.data.id}/revoke`, { method: "POST", userId: "user_admin_001" });
  const afterRevocation = await milestones(learner);
  assert.ok(!afterRevocation.some((m) => m.id === `credential:${issued.json.data.id}:earned`), "a revoked credential must not remain a milestone");

  await query("DELETE FROM learner_credentials WHERE credential_definition_id=$1", [def.json.data.id]);
  await query("DELETE FROM credential_definitions WHERE credential_definition_id=$1", [def.json.data.id]);
});

test("27. a Project reachable via two teams for the same learner produces exactly one PROJECT milestone", async () => {
  const project = await api("/projects", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Dedupe Project`, project_type: "EDUCATIONAL_PROJECT", due_at: "2026-06-01T00:00:00Z" } });
  const teamA = await api(`/projects/${project.json.data.project_id}/teams`, { method: "POST", userId: "user_admin_001", body: {} });
  await api(`/project-teams/${teamA.json.data.team_id}/members`, { method: "POST", userId: "user_admin_001", body: { learner_id: "user_assignment_technical_001" } });
  const teamB = await api(`/projects/${project.json.data.project_id}/teams`, { method: "POST", userId: "user_admin_001", body: { mode: "INDIVIDUAL_INTEGRATED_MODE" } });
  await api(`/project-teams/${teamB.json.data.team_id}/members`, { method: "POST", userId: "user_admin_001", body: { learner_id: "user_assignment_technical_001" } });

  const items = await milestones("user_assignment_technical_001");
  const matches = items.filter((m) => m.id === `project:${project.json.data.project_id}:due`);
  assert.equal(matches.length, 1, "must not produce one milestone per team membership");
});

test("an ARCADE_MASTERY milestone requires a stored mastery_achieved=true Result — never a mere attempt or a failing score", async () => {
  const activity = await api("/arcade/activities", { method: "POST", userId: "user_admin_001", body: { slug: `journey-mastery-${RUN}`, title: `${RUN} Journey Mastery Quiz`, activityType: "RETRIEVAL", masteryRule: "SCORE_THRESHOLD", maxScore: 10, passThresholdScore: 8 } });
  const learner = "user_assignment_technical_001";

  const failing = await api("/arcade/attempts", { method: "POST", userId: learner, body: { activityId: activity.json.data.id } });
  await api(`/arcade/attempts/${failing.json.data.id}/result`, { method: "POST", userId: learner, body: { score: 3 } });
  const beforeMastery = await milestones(learner);
  assert.ok(!beforeMastery.some((m) => m.type === "ARCADE_MASTERY"), "a failing score must not produce an ARCADE_MASTERY milestone");

  const passing = await api("/arcade/attempts", { method: "POST", userId: learner, body: { activityId: activity.json.data.id } });
  await api(`/arcade/attempts/${passing.json.data.id}/result`, { method: "POST", userId: learner, body: { score: 9 } });
  const afterMastery = await milestones(learner);
  const masteryMilestone = afterMastery.find((m) => m.id === `arcade:${activity.json.data.id}:mastery`);
  assert.ok(masteryMilestone, "expected an ARCADE_MASTERY milestone after a qualifying Result");
  assert.equal(masteryMilestone!.status, "completed");
});

test("28. milestones are returned in deterministic chronological order", async () => {
  await insertEnrollment(`enr_${RUN}_order`, LEARNER, "2020-01-01T00:00:00Z");
  const items = await milestones(LEARNER);
  const occursAtValues = items.map((m) => new Date(m.occursAt).getTime());
  const sorted = [...occursAtValues].sort((a, b) => a - b);
  assert.deepEqual(occursAtValues, sorted);
  await query("DELETE FROM enrollments WHERE enrollment_id=$1", [`enr_${RUN}_order`]);
});

test("30. an account with no Enrollment/Project/Credential gets an honest empty result for those types, not fabricated content", async () => {
  // A brand-new learner in org_shf_001 can still legitimately see
  // ORGANIZATION-scope PUBLISHED Career Events created by other test
  // files in a full-suite run (that visibility rule has nothing to do
  // with this learner's own enrollment/project/credential history — see
  // career-event-repo.ts's listVisibleForStudent). So "honest empty" here
  // means no fabricated PROGRAM_START/PROJECT/CAPSTONE/CREDENTIAL_EARNED
  // entry, not a hard empty array; only CAREER_EVENT may legitimately be
  // non-empty in a shared-run environment.
  const items = await milestones(LEARNER);
  for (const item of items) {
    assert.equal(item.type, "CAREER_EVENT", `unexpected non-career-event milestone for an untouched learner: ${item.type}`);
  }
});
