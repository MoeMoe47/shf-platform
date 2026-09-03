import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { captureTeamAuthoritySnapshot, captureTeamRows, captureOutbox } from "./helpers/team-authority-snapshot.mjs";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!frontend || !api || !database) throw new Error("Phase 11.4 acceptance requires the disposable environment.");
const token = (id) => `Bearer dev-token:${id}`;

async function apiJson(request, id, path, options = {}) {
  const response = await request.fetch(`${api}${path}`, { ...options, headers: { Authorization: token(id), "Content-Type": "application/json", ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  return { response, body, data: body.data ?? body };
}

function sql(statement) { return execFileSync("psql", [database, "-X", "-At", "-v", "ON_ERROR_STOP=1", "-c", statement], { encoding: "utf8" }).trim(); }

function setup() {
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", `
    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('phase114_student_create','phase8_role_student','studio.project.create'),
      ('phase114_student_view','phase8_role_student','studio.project.view'),
      ('phase114_student_update','phase8_role_student','studio.project.update'),
      ('phase114_student_team','phase8_role_student','project.team.manage')
    ON CONFLICT DO NOTHING;
  `], { encoding: "utf8" });
}

function delta(before, after) {
  return Object.fromEntries(Object.keys(after).map((table) => [table, after[table].total - (before[table]?.total || 0)]).filter(([, value]) => value !== 0));
}

async function pageFor(browser, id, viewport) {
  const page = await browser.newPage({ viewport });
  await page.addInitScript((userId) => {
    window.__user = { id: userId, role: userId.startsWith("admin") ? "admin" : "student", email: `${userId}@phase11.test`, name: userId };
  }, id);
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (["fetch", "xhr"].includes(request.resourceType())) return route.continue({ headers: { ...request.headers(), authorization: token(id) } });
    return route.continue();
  });
  return page;
}

test.describe.configure({ mode: "serial" });

test("Phase 11.4 complete Team authority DB matrices", async ({ request }) => {
  setup();
  const teamBefore = captureTeamAuthoritySnapshot(database);
  const created = await apiJson(request, "admin_A", "/studio/teams", { method: "POST", data: { name: `Phase 11.4 Matrix ${Date.now()}` } });
  expect(created.response.status()).toBe(201);
  const teamId = created.data.teamId;
  const teamAfter = captureTeamAuthoritySnapshot(database);
  expect(delta(teamBefore, teamAfter)).toEqual({ studio_teams: 1, integration_outbox: 1 });

  const memberBefore = captureTeamAuthoritySnapshot(database);
  const added = await apiJson(request, "admin_A", `/studio/teams/${teamId}/members`, { method: "POST", data: { userId: "learner_A1", role: "LEAD" } });
  expect(added.response.status()).toBe(201);
  const memberAfter = captureTeamAuthoritySnapshot(database);
  expect(delta(memberBefore, memberAfter)).toEqual({ studio_team_members: 1, integration_outbox: 1 });

  const projectBefore = captureTeamAuthoritySnapshot(database);
  const project = await apiJson(request, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title: "Phase 11.4 Matrix Project", teamId } });
  expect(project.response.status()).toBe(201);
  const projectAfter = captureTeamAuthoritySnapshot(database);
  const projectDelta = delta(projectBefore, projectAfter);
  expect(projectDelta.projects).toBe(1);
  expect(Object.keys(projectDelta).every((table) => ["projects", "studio_builder_workspaces", "integration_outbox"].includes(table))).toBeTruthy();
  expect(sql(`SELECT studio_owner_type || ':' || studio_team_id FROM projects WHERE project_id='${project.data.projectId}'`)).toBe(`TEAM:${teamId}`);

  const removeBefore = captureTeamAuthoritySnapshot(database);
  const removed = await apiJson(request, "admin_A", `/studio/teams/${teamId}/members/learner_A1`, { method: "DELETE" });
  expect(removed.response.status()).toBe(200);
  const removeAfter = captureTeamAuthoritySnapshot(database);
  expect(delta(removeBefore, removeAfter)).toEqual({ integration_outbox: 1 });
  expect(captureTeamRows(database, teamId).members).toContain("learner_A1:LEAD:REMOVED");
  expect(captureOutbox(database)).toContain("studio.team.member_removed");
});

test("Phase 11.5 browser fixture, ownership snapshots, and keyboard Team management", async ({ browser, request }) => {
  test.setTimeout(90000);
  setup();
  const page = await pageFor(browser, "admin_A", { width: 1440, height: 900 });
  await page.goto(`${frontend}/curriculum.html#/studio/teams`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("main").getByRole("heading", { name: "Teams" })).toBeVisible();
  await expect(page.getByLabel("Team name")).toBeVisible();
  await page.getByLabel("Team name").focus();
  await page.keyboard.type(`Keyboard Team ${Date.now()}`);
  await page.getByRole("button", { name: "Create Team" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/Keyboard Team/)).toBeVisible();
  const team = await apiJson(request, "admin_A", "/studio/teams");
  const teamId = team.data.items.find((item) => item.name.startsWith("Keyboard Team")).teamId;
  await page.getByRole("button", { name: "View members" }).last().focus();
  await page.keyboard.press("Enter");
  await page.getByLabel("Member user ID").focus();
  await page.keyboard.type("learner_A1");
  await page.getByRole("button", { name: "Add member" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("learner_A1")).toBeVisible();
  await page.getByRole("button", { name: "Remove" }).last().focus();
  await page.keyboard.press("Space");
  await expect.poll(() => request.fetch(`${api}/studio/teams/${teamId}`, { headers: { Authorization: token("admin_A") } }).then((response) => response.json()).then((body) => body.data.members.some((member) => member.user_id === "learner_A1"))).toBe(false);
  const teamSnapshot = await page.getByRole("main", { name: "Teams" }).ariaSnapshot();
  expect(teamSnapshot).toContain("Teams");
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBeTruthy();
  await page.close();

  const add = await apiJson(request, "admin_A", `/studio/teams/${teamId}/members`, { method: "POST", data: { userId: "learner_A1", role: "LEAD" } });
  expect(add.response.status()).toBe(201);
  const teamProject = await apiJson(request, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title: "Phase 11.5 Team Project", teamId } });
  expect(teamProject.response.status()).toBe(201);
  const individualProject = await apiJson(request, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title: "Phase 11.5 Individual Project" } });
  expect(individualProject.response.status()).toBe(201);

  const teamProjectPage = await pageFor(browser, "learner_A1", { width: 1440, height: 900 });
  await teamProjectPage.goto(`${frontend}/curriculum.html#/studio/projects/${teamProject.data.projectId}`, { waitUntil: "domcontentloaded" });
  await expect(teamProjectPage.getByLabel(/Team project owned by/)).toBeVisible();
  const teamProjectSnapshot = await teamProjectPage.locator(".studio-page").ariaSnapshot();
  expect(teamProjectSnapshot).toContain("Phase 11.5 Team Project");
  expect(teamProjectSnapshot).toContain("Team Project");
  expect(teamProjectSnapshot).toContain(team.data.items.find((item) => item.teamId === teamId).name);
  await teamProjectPage.close();

  const individualProjectPage = await pageFor(browser, "learner_A1", { width: 1440, height: 900 });
  await individualProjectPage.goto(`${frontend}/curriculum.html#/studio/projects/${individualProject.data.projectId}`, { waitUntil: "domcontentloaded" });
  await expect(individualProjectPage.getByRole("heading", { name: "Phase 11.5 Individual Project" })).toBeVisible();
  const individualSnapshot = await individualProjectPage.locator(".studio-page").ariaSnapshot();
  expect(individualSnapshot).toContain("Phase 11.5 Individual Project");
  expect(individualSnapshot).not.toContain("Team Project");
  await individualProjectPage.close();

  const navigationPage = await pageFor(browser, "learner_A1", { width: 1440, height: 900 });
  await navigationPage.goto(`${frontend}/curriculum.html#/studio/projects`, { waitUntil: "domcontentloaded" });
  const projectLink = navigationPage.getByRole("link", { name: /Phase 11\.5 Team Project/ });
  await expect(projectLink).toBeVisible();
  await projectLink.focus();
  await navigationPage.keyboard.press("Enter");
  await expect(navigationPage.getByLabel(/Team project owned by/)).toBeVisible();
  expect(await navigationPage.evaluate(() => document.activeElement?.tagName)).toBeTruthy();
  await navigationPage.close();
});
