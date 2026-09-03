import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!api || !database) throw new Error("Phase 11.1 acceptance requires the disposable environment.");
const token = (id, tenant) => `Bearer dev-token:${id}${tenant ? `;tenant=${tenant}` : ""}`;
const sql = (statement) => execFileSync("psql", [database, "-X", "-At", "-v", "ON_ERROR_STOP=1", "-c", statement], { encoding: "utf8" }).trim();

async function apiJson(request, id, path, options = {}) {
  const response = await request.fetch(`${api}${path}`, { ...options, headers: { Authorization: token(id), "Content-Type": "application/json", ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  return { response, body, data: body.data ?? body };
}

function setup() {
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", `
    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('phase111_student_create','phase8_role_student','studio.project.create'),
      ('phase111_student_view','phase8_role_student','studio.project.view'),
      ('phase111_student_update','phase8_role_student','studio.project.update'),
      ('phase111_student_finalize','phase8_role_student','studio.project.finalize'),
      ('phase111_student_deploy','phase8_role_student','website.deployment.create'),
      ('phase111_student_deploy_view','phase8_role_student','website.deployment.view'),
      ('phase111_student_package','phase8_role_student','agent.package.create'),
      ('phase111_student_package_view','phase8_role_student','agent.package.view'),
      ('phase111_student_registry','phase8_role_student','agent.registry.submit'),
      ('phase111_student_registry_view','phase8_role_student','agent.registry.view')
    ON CONFLICT DO NOTHING;
    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('phase111_instructor_review','phase8_role_instructor','project.submission.review')
    ON CONFLICT DO NOTHING;
    INSERT INTO role_permissions (role_permission_id, role_id, permission_name)
    VALUES ('phase111_dual_role_review','phase8_role_student','project.submission.review')
    ON CONFLICT DO NOTHING;
  `], { encoding: "utf8" });
}

async function createProject(request, userId, teamId, type, title) {
  const created = await apiJson(request, userId, "/studio/projects", { method: "POST", data: { projectType: type, title, teamId } });
  expect(created.response.status(), JSON.stringify(created.body)).toBe(201);
  const projectId = created.data.projectId;
  const initial = await apiJson(request, userId, `/studio/projects/${projectId}/workspace`);
  const work = type === "WEBSITE" ? { pages: [{ path: "/", title: "Team Home", content: "Team-owned project content." }] } : { name: "Team Agent", instructions: "Provide bounded help.", tools: [] };
  const saved = await apiJson(request, userId, `/studio/projects/${projectId}/workspace`, { method: "PATCH", data: { revision: initial.data.revision, work } });
  expect(saved.response.status(), JSON.stringify(saved.body)).toBe(200);
  const qa = await apiJson(request, userId, `/studio/projects/${projectId}/qa`, { method: "POST", data: {} });
  expect(qa.response.status(), JSON.stringify(qa.body)).toBe(201);
  const review = await apiJson(request, userId, `/studio/projects/${projectId}/review-submissions`, { method: "POST", data: {} });
  expect(review.response.status(), JSON.stringify(review.body)).toBe(201);
  return { projectId, submissionId: review.data.submissionId, revision: saved.data.revision };
}

test.describe.configure({ mode: "serial" });

test("Phase 11.1 Team downstream ownership and security closure", async ({ request }) => {
  test.setTimeout(120000);
  setup();
  const team = await apiJson(request, "admin_A", "/studio/teams", { method: "POST", data: { name: `Phase 11.1 ${Date.now()}` } });
  expect(team.response.status()).toBe(201);
  const teamId = team.data.teamId;
  for (const [userId, role] of [["learner_A1", "LEAD"], ["learner_A2", "MEMBER"]]) {
    const added = await apiJson(request, "admin_A", `/studio/teams/${teamId}/members`, { method: "POST", data: { userId, role } });
    expect(added.response.status()).toBe(201);
  }

  const website = await createProject(request, "learner_A1", teamId, "WEBSITE", "Phase 11.1 Team Website");
  const routed = await apiJson(request, "admin_A", `/studio/review-submissions/${website.submissionId}/route`, { method: "POST", data: { reviewerUserId: "learner_A1", activeLoad: 999, eligibility: true } });
  expect(routed.response.status()).toBe(201);
  expect(routed.data.reviewerUserId).toBe("instructor_A_authorized");
  const decision = await apiJson(request, "instructor_A_authorized", `/studio/projects/${website.projectId}/review-submissions/${website.submissionId}/decision`, { method: "POST", data: { decision: "APPROVED", feedback: "Team path approved." } });
  expect(decision.response.status(), JSON.stringify(decision.body)).toBe(200);
  const finalized = await apiJson(request, "learner_A1", `/studio/projects/${website.projectId}/finalize`, { method: "POST", data: {} });
  expect(finalized.response.status(), JSON.stringify(finalized.body)).toBe(201);
  const deployed = await apiJson(request, "learner_A2", "/deployments/from-studio-delivery", { method: "POST", data: { deliveryId: finalized.data.deliveryRecordId } });
  expect(deployed.response.status(), JSON.stringify(deployed.body)).toBe(201);
  expect(deployed.data.deployment.target).toBe("TEST");

  const agent = await createProject(request, "learner_A2", teamId, "AI_AGENT", "Phase 11.1 Team Agent");
  const agentDecision = await apiJson(request, "instructor_A_authorized", `/studio/projects/${agent.projectId}/review-submissions/${agent.submissionId}/decision`, { method: "POST", data: { decision: "APPROVED", feedback: "Team agent approved." } });
  expect(agentDecision.response.status()).toBe(200);
  const agentFinal = await apiJson(request, "learner_A1", `/studio/projects/${agent.projectId}/finalize`, { method: "POST", data: {} });
  expect(agentFinal.response.status()).toBe(201);
  const packaged = await apiJson(request, "learner_A2", `/studio/projects/${agent.projectId}/agent-packages`, { method: "POST", data: {} });
  expect(packaged.response.status(), JSON.stringify(packaged.body)).toBe(201);
  const registered = await apiJson(request, "learner_A1", `/agent-packages/${packaged.data.package.packageId}/registry-submissions`, { method: "POST", data: {} });
  expect(registered.response.status(), JSON.stringify(registered.body)).toBe(201);

  const nonmember = await apiJson(request, "learner_B1", `/studio/projects/${website.projectId}/workspace`);
  expect([403, 404]).toContain(nonmember.response.status());
  const foreignDeploy = await apiJson(request, "learner_B1", "/deployments/from-studio-delivery", { method: "POST", data: { deliveryId: finalized.data.deliveryRecordId } });
  expect([400, 403, 404]).toContain(foreignDeploy.response.status());
  const foreignPackage = await apiJson(request, "learner_B1", `/studio/projects/${agent.projectId}/agent-packages`, { method: "POST", data: {} });
  expect([400, 403, 404]).toContain(foreignPackage.response.status());
  const foreignRegistry = await apiJson(request, "learner_B1", `/agent-packages/${packaged.data.package.packageId}/registry-submissions`, { method: "POST", data: {} });
  expect([400, 403, 404]).toContain(foreignRegistry.response.status());

  const remove = await apiJson(request, "admin_A", `/studio/teams/${teamId}/members/learner_A2`, { method: "DELETE" });
  expect(remove.response.status()).toBe(200);
  const removedEdit = await apiJson(request, "learner_A2", `/studio/projects/${website.projectId}/workspace`);
  expect([403, 404]).toContain(removedEdit.response.status());
  const archive = await apiJson(request, "admin_A", `/studio/teams/${teamId}/archive`, { method: "POST", data: {} });
  expect(archive.response.status()).toBe(200);
  const archivedCreate = await apiJson(request, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title: "Should fail", teamId } });
  expect([400, 403, 404]).toContain(archivedCreate.response.status());
  expect(sql(`SELECT status FROM studio_teams WHERE studio_team_id='${teamId}'`)).toBe("ARCHIVED");
  expect(sql(`SELECT studio_owner_type || ':' || studio_team_id FROM projects WHERE project_id='${website.projectId}'`)).toBe(`TEAM:${teamId}`);
  expect(Number(sql(`SELECT COUNT(*) FROM studio_review_decisions WHERE review_submission_id='${website.submissionId}'`))).toBe(1);
  expect(Number(sql(`SELECT COUNT(*) FROM studio_delivery_records WHERE project_id='${website.projectId}'`))).toBe(1);
  expect(Number(sql(`SELECT COUNT(*) FROM studio_agent_packages WHERE project_id='${agent.projectId}'`))).toBe(1);
  expect(Number(sql(`SELECT COUNT(*) FROM agent_registry_submissions WHERE package_id='${packaged.data.package.packageId}'`))).toBe(1);
});

test("Phase 11.1 concurrent membership add is constrained", async ({ request }) => {
  const team = await apiJson(request, "admin_A", "/studio/teams", { method: "POST", data: { name: `Phase 11.1 Concurrency ${Date.now()}` } });
  expect(team.response.status()).toBe(201);
  const results = await Promise.all(Array.from({ length: 3 }, () => apiJson(request, "admin_A", `/studio/teams/${team.data.teamId}/members`, { method: "POST", data: { userId: "learner_A2", role: "MEMBER" } })));
  expect(results.every((item) => item.response.ok())).toBeTruthy();
  expect(Number(sql(`SELECT COUNT(*) FROM studio_team_members WHERE studio_team_id='${team.data.teamId}' AND user_id='learner_A2' AND status='ACTIVE'`))).toBe(1);
});

test("Phase 11.2 Team conflict, cross-tenant, concurrency, and side-effect closure", async ({ request }) => {
  setup();
  const team = await apiJson(request, "admin_A", "/studio/teams", { method: "POST", data: { name: `Phase 11.2 Matrix ${Date.now()}` } });
  expect(team.response.status()).toBe(201);
  const teamId = team.data.teamId;
  const addA = await apiJson(request, "admin_A", `/studio/teams/${teamId}/members`, { method: "POST", data: { userId: "learner_A1", role: "LEAD" } });
  const addB = await apiJson(request, "admin_A", `/studio/teams/${teamId}/members`, { method: "POST", data: { userId: "learner_A2", role: "MEMBER" } });
  expect(addA.response.status()).toBe(201); expect(addB.response.status()).toBe(201);

  const beforeSelf = sql(`SELECT (SELECT COUNT(*) FROM studio_review_decisions) || ':' || (SELECT COUNT(*) FROM prepare_prove_evidence) || ':' || (SELECT COUNT(*) FROM curriculum_lesson_completions) || ':' || (SELECT COUNT(*) FROM studio_team_members WHERE studio_team_id='${teamId}')`);
  const selfProject = await createProject(request, "learner_A1", teamId, "WEBSITE", "Self Review Team Project");
  const selfDecision = await apiJson(request, "learner_A1", `/studio/projects/${selfProject.projectId}/review-submissions/${selfProject.submissionId}/decision`, { method: "POST", data: { decision: "APPROVED", feedback: "Self review must fail." } });
  expect([401, 403, 404]).toContain(selfDecision.response.status());
  expect(sql(`SELECT (SELECT COUNT(*) FROM studio_review_decisions) || ':' || (SELECT COUNT(*) FROM prepare_prove_evidence) || ':' || (SELECT COUNT(*) FROM curriculum_lesson_completions) || ':' || (SELECT COUNT(*) FROM studio_team_members WHERE studio_team_id='${teamId}')`)).toBe(beforeSelf);
  const memberDecision = await apiJson(request, "learner_A2", `/studio/projects/${selfProject.projectId}/review-submissions/${selfProject.submissionId}/decision`, { method: "POST", data: { decision: "APPROVED", feedback: "Team-member review must fail." } });
  expect([401, 403, 404]).toContain(memberDecision.response.status());
  expect(sql(`SELECT (SELECT COUNT(*) FROM studio_review_decisions) || ':' || (SELECT COUNT(*) FROM prepare_prove_evidence) || ':' || (SELECT COUNT(*) FROM curriculum_lesson_completions) || ':' || (SELECT COUNT(*) FROM studio_team_members WHERE studio_team_id='${teamId}')`)).toBe(beforeSelf);

  const crossList = await apiJson(request, "learner_B1", "/studio/teams");
  expect(crossList.response.status()).toBe(200); expect(crossList.data.items.some((item) => item.teamId === teamId)).toBe(false);
  const crossDetail = await apiJson(request, "learner_B1", `/studio/teams/${teamId}`);
  expect([403, 404]).toContain(crossDetail.response.status());
  const crossAdd = await apiJson(request, "instructor_B", `/studio/teams/${teamId}/members`, { method: "POST", data: { userId: "learner_B1" } });
  expect([403, 404]).toContain(crossAdd.response.status());
  const crossRemove = await apiJson(request, "instructor_B", `/studio/teams/${teamId}/members/learner_A2`, { method: "DELETE" });
  expect([403, 404]).toContain(crossRemove.response.status());
  const crossCreate = await apiJson(request, "learner_B1", "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title: "Foreign takeover", teamId, organizationId: "phase8_org_a", tenantKey: "tenant:phase8_org_a", ownerType: "TEAM" } });
  expect([400, 403, 404]).toContain(crossCreate.response.status());
  const crossReview = await apiJson(request, "learner_B1", `/studio/projects/${selfProject.projectId}/review-submissions`, { method: "POST", data: {} });
  expect([400, 403, 404]).toContain(crossReview.response.status());
  expect(Number(sql(`SELECT COUNT(*) FROM studio_team_members WHERE studio_team_id='${teamId}' AND user_id='learner_B1'`))).toBe(0);

  const concurrent = await Promise.all([
    apiJson(request, "admin_A", `/studio/teams/${teamId}/members/learner_A2`, { method: "DELETE" }),
    apiJson(request, "admin_A", `/studio/teams/${teamId}/members`, { method: "POST", data: { userId: "learner_A2", role: "MEMBER" } }),
    apiJson(request, "admin_A", `/studio/teams/${teamId}/members`, { method: "POST", data: { userId: "learner_A2", role: "MEMBER" } }),
  ]);
  expect(concurrent.some((item) => item.response.ok())).toBeTruthy();
  expect(Number(sql(`SELECT COUNT(*) FROM studio_team_members WHERE studio_team_id='${teamId}' AND user_id='learner_A2' AND status='ACTIVE' AND left_at IS NULL`))).toBe(1);
  expect(Number(sql(`SELECT COUNT(*) FROM studio_team_members WHERE studio_team_id='${teamId}' AND user_id='learner_A2'`))).toBe(1);
  expect(Number(sql(`SELECT COUNT(*) FROM integration_outbox WHERE producer_id='shs-api.studio-team' AND correlation_id='${teamId}' AND event_type IN ('studio.team.member_added','studio.team.member_removed')`))).toBeGreaterThanOrEqual(1);

  const windows = [
    ["TEAM_CREATE", `SELECT COUNT(*) FROM studio_teams`, async () => apiJson(request, "admin_A", "/studio/teams", { method: "POST", data: { name: `Window Team ${Date.now()}` } }), 1],
  ];
  const beforeTeamCount = Number(sql(windows[0][1]));
  const windowTeam = await windows[0][2]();
  expect(windowTeam.response.status()).toBe(201);
  expect(Number(sql(windows[0][1])) - beforeTeamCount).toBe(1);
  const beforeMemberCount = Number(sql("SELECT COUNT(*) FROM studio_team_members"));
  const windowMember = await apiJson(request, "admin_A", `/studio/teams/${windowTeam.data.teamId}/members`, { method: "POST", data: { userId: "learner_A1" } });
  expect(windowMember.response.status()).toBe(201); expect(Number(sql("SELECT COUNT(*) FROM studio_team_members")) - beforeMemberCount).toBe(1);
  const beforeProjectCount = Number(sql("SELECT COUNT(*) FROM projects"));
  const windowProject = await apiJson(request, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title: "Window Team Project", teamId: windowTeam.data.teamId } });
  expect(windowProject.response.status()).toBe(201); expect(Number(sql("SELECT COUNT(*) FROM projects")) - beforeProjectCount).toBe(1);
  const beforeRemove = sql(`SELECT status || ':' || COALESCE(left_at::text,'') FROM studio_team_members WHERE studio_team_id='${windowTeam.data.teamId}' AND user_id='learner_A1'`);
  const windowRemove = await apiJson(request, "admin_A", `/studio/teams/${windowTeam.data.teamId}/members/learner_A1`, { method: "DELETE" });
  expect(windowRemove.response.status()).toBe(200);
  expect(sql(`SELECT status || ':' || COALESCE(left_at::text,'') FROM studio_team_members WHERE studio_team_id='${windowTeam.data.teamId}' AND user_id='learner_A1'`)).not.toBe(beforeRemove);
  expect(sql(`SELECT studio_owner_type || ':' || studio_team_id FROM projects WHERE project_id='${windowProject.data.projectId}'`)).toBe(`TEAM:${windowTeam.data.teamId}`);
});
