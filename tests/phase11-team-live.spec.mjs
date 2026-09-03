import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!api || !database) throw new Error("Phase 11 acceptance requires the disposable environment.");
const token = (id) => `Bearer dev-token:${id}`;

async function apiJson(request, id, path, options = {}) {
  const response = await request.fetch(`${api}${path}`, { ...options, headers: { Authorization: token(id), "Content-Type": "application/json", ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  return { response, body, data: body.data ?? body };
}

function setup() {
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", `
    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('phase11_student_create','phase8_role_student','studio.project.create'),
      ('phase11_student_view','phase8_role_student','studio.project.view'),
      ('phase11_student_update','phase8_role_student','studio.project.update')
    ON CONFLICT DO NOTHING;
  `], { encoding: "utf8" });
}

test("team ownership and member authorization remain durable and scoped", async ({ request }) => {
  setup();
  const created = await apiJson(request, "admin_A", "/studio/teams", { method: "POST", data: { name: "Phase 11 Team" } });
  expect(created.response.status(), JSON.stringify(created.body)).toBe(201);
  const teamId = created.data.teamId;
  const memberA = await apiJson(request, "admin_A", `/studio/teams/${teamId}/members`, { method: "POST", data: { userId: "learner_A1", role: "LEAD", forgedOrganizationId: "org_B" } });
  expect(memberA.response.status()).toBe(201);
  const memberB = await apiJson(request, "admin_A", `/studio/teams/${teamId}/members`, { method: "POST", data: { userId: "learner_A2", role: "MEMBER" } });
  expect(memberB.response.status()).toBe(201);
  const project = await apiJson(request, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title: "Phase 11 Team Project", teamId, ownerType: "INDIVIDUAL", ownerUserId: "learner_B1", organizationId: "org_B", tenantKey: "tenant:org_B" } });
  expect(project.response.status(), JSON.stringify(project.body)).toBe(201);
  expect(project.data.ownerType).toBe("TEAM");
  expect(project.data.teamId).toBe(teamId);
  const projectId = project.data.projectId;
  const readByB = await apiJson(request, "learner_A2", `/studio/projects/${projectId}`);
  expect(readByB.response.status(), JSON.stringify(readByB.body)).toBe(200);
  const teams = await apiJson(request, "learner_A2", "/studio/teams");
  expect(teams.response.status()).toBe(200);
  expect(teams.data.items.some((item) => item.teamId === teamId)).toBeTruthy();
  const foreign = await apiJson(request, "instructor_B", `/studio/teams/${teamId}`);
  expect([403, 404]).toContain(foreign.response.status());
  const removed = await apiJson(request, "admin_A", `/studio/teams/${teamId}/members/learner_A2`, { method: "DELETE" });
  expect(removed.response.status()).toBe(200);
  const afterRemoval = await apiJson(request, "learner_A2", `/studio/projects/${projectId}`);
  expect([403, 404]).toContain(afterRemoval.response.status());
  const row = execFileSync("psql", [database, "-X", "-At", "-c", `SELECT studio_owner_type || ':' || studio_team_id FROM projects WHERE project_id='${projectId}'`], { encoding: "utf8" }).trim();
  expect(row).toBe(`TEAM:${teamId}`);
  const eventCount = execFileSync("psql", [database, "-X", "-At", "-c", `SELECT COUNT(*) FROM integration_outbox WHERE producer_id='shs-api.studio-team' AND organization_id='phase8_org_a'`], { encoding: "utf8" }).trim();
  expect(Number(eventCount)).toBe(4);
});
