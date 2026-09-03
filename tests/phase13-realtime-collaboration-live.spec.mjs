import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!frontend || !api || !database) throw new Error("Phase 13 acceptance requires the disposable environment.");

const token = (id) => `Bearer dev-token:${id}`;
const headers = (id) => ({ Authorization: token(id), "Content-Type": "application/json" });

async function apiJson(request, id, path, options = {}) {
  const response = await request.fetch(`${api}${path}`, { ...options, headers: { ...headers(id), ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  return { response, body, data: body.data ?? body };
}

function sql(statement) {
  return execFileSync("psql", [database, "-X", "-At", "-v", "ON_ERROR_STOP=1", "-c", statement], { encoding: "utf8" }).trim();
}

function enableStudioPermissions() {
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", `
    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('phase13_student_create','phase8_role_student','studio.project.create'),
      ('phase13_student_view','phase8_role_student','studio.project.view'),
      ('phase13_student_update','phase8_role_student','studio.project.update')
    ON CONFLICT DO NOTHING;
  `], { encoding: "utf8" });
}

async function actorPage(browser, id, role = "student") {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(({ id, role }) => { window.__user = { role, email: `${id}@phase13.test`, name: id }; }, { id, role });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (["fetch", "xhr"].includes(request.resourceType())) return route.continue({ headers: { ...request.headers(), authorization: token(id) } });
    return route.continue();
  });
  return page;
}

test.describe.configure({ mode: "serial" });

test("two authenticated Team contributors synchronize transient work and preserve Phase 12 save authority", async ({ browser, request }) => {
  test.setTimeout(120000);
  enableStudioPermissions();
  const setupPage = await actorPage(browser, "admin_A", "admin");
  const team = await apiJson(setupPage.request, "admin_A", "/studio/teams", { method: "POST", data: { name: `Phase 13 Team ${Date.now()}` } });
  expect(team.response.status(), JSON.stringify(team.body)).toBe(201);
  const teamId = team.data.teamId;
  for (const [userId, role] of [["learner_A1", "LEAD"], ["learner_A2", "MEMBER"]]) {
    const member = await apiJson(setupPage.request, "admin_A", `/studio/teams/${teamId}/members`, { method: "POST", data: { userId, role } });
    expect(member.response.status(), JSON.stringify(member.body)).toBe(201);
  }
  const project = await apiJson(setupPage.request, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title: "Phase 13 Shared Website", teamId } });
  expect(project.response.status(), JSON.stringify(project.body)).toBe(201);
  const projectId = project.data.projectId;
  const projectRow = await apiJson(setupPage.request, "learner_A1", `/studio/projects/${projectId}`);
  expect(projectRow.data.ownerType).toBe("TEAM");
  expect(projectRow.data.teamId).toBe(teamId);
  const malformed = await apiJson(request, "learner_A1", `/studio/projects/${projectId}/collaboration/updates`, { method: "POST", data: { revisionId: "forged", work: { pages: [{ path: "/", title: "Home", content: "ignored" }] } } });
  expect(malformed.response.status(), JSON.stringify(malformed.body)).toBe(400);
  await setupPage.close();

  const pageA = await actorPage(browser, "learner_A1");
  const pageB = await actorPage(browser, "learner_A2");
  const url = `${frontend}/curriculum.html#/studio/projects/${projectId}/build`;
  await Promise.all([pageA.goto(url, { waitUntil: "domcontentloaded" }), pageB.goto(url, { waitUntil: "domcontentloaded" })]);
  await expect(pageA.getByRole("heading", { name: "Build Your Website" })).toBeVisible();
  await expect(pageB.getByRole("heading", { name: "Build Your Website" })).toBeVisible();
  await expect(pageA.getByText("Connected", { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(pageB.getByText("Connected", { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(pageA.getByText("Learner A2", { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(pageB.getByText("Learner A1", { exact: true })).toBeVisible({ timeout: 15000 });

  await pageA.getByLabel("Page title").fill("Shared Home");
  await pageA.getByLabel("Page content").fill("A's live update");
  await expect(pageB.getByLabel("Page content")).toHaveValue("A's live update", { timeout: 15000 });
  await expect(pageB.getByText("Updated by Learner A1", { exact: true })).toBeVisible();

  await pageB.getByLabel("Page content").fill("B's live update");
  await expect(pageA.getByLabel("Page content")).toHaveValue("B's live update", { timeout: 15000 });
  await expect(pageA.getByText("Updated by Learner A2", { exact: true })).toBeVisible();

  const beforeSave = await apiJson(request, "learner_A1", `/studio/projects/${projectId}/workspace`);
  await pageA.getByRole("button", { name: "Save draft" }).click();
  await expect(pageA.getByText("Saved", { exact: true })).toBeVisible();
  const afterSave = await apiJson(request, "learner_A2", `/studio/projects/${projectId}/workspace`);
  expect(afterSave.data.revision).toBe(beforeSave.data.revision + 1);
  expect(afterSave.data.work.pages[0].content).toBe("B's live update");

  const stale = await apiJson(request, "learner_A2", `/studio/projects/${projectId}/workspace`, { method: "PATCH", data: { revision: beforeSave.data.revision, work: { pages: [{ path: "/", title: "Stale", content: "Must not overwrite" }] } } });
  expect(stale.response.status(), JSON.stringify(stale.body)).toBe(409);
  const durable = await apiJson(request, "learner_A1", `/studio/projects/${projectId}/workspace`);
  expect(durable.data.work.pages[0].content).toBe("B's live update");
  expect(Number(sql(`SELECT COUNT(*) FROM studio_project_revisions WHERE project_id='${projectId}'`))).toBe(1);

  await pageB.close();
  await expect(pageA.getByText("Learner A2", { exact: true })).not.toBeVisible({ timeout: 15000 });
  const pageBReconnect = await actorPage(browser, "learner_A2");
  await pageBReconnect.goto(url, { waitUntil: "domcontentloaded" });
  await expect(pageBReconnect.getByText("Connected", { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(pageBReconnect.getByLabel("Page content")).toHaveValue("B's live update");
  await pageBReconnect.close();

  const removed = await apiJson(request, "admin_A", `/studio/teams/${teamId}/members/learner_A2`, { method: "DELETE" });
  expect(removed.response.status(), JSON.stringify(removed.body)).toBe(200);
  const deniedWorkspace = await apiJson(request, "learner_A2", `/studio/projects/${projectId}/workspace`);
  expect([403, 404]).toContain(deniedWorkspace.response.status());
  await pageA.close();
});

test("collaboration transport failure leaves the canonical builder and save API usable", async ({ browser, request }) => {
  enableStudioPermissions();
  const team = await apiJson(request, "admin_A", "/studio/teams", { method: "POST", data: { name: `Phase 13 Fallback Team ${Date.now()}` } });
  expect(team.response.status()).toBe(201);
  const teamId = team.data.teamId;
  for (const [userId, role] of [["learner_A1", "LEAD"], ["learner_A2", "MEMBER"]]) {
    expect((await apiJson(request, "admin_A", `/studio/teams/${teamId}/members`, { method: "POST", data: { userId, role } })).response.status()).toBe(201);
  }
  const project = await apiJson(request, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title: "Phase 13 Fallback Website", teamId } });
  expect(project.response.status()).toBe(201);
  const page = await actorPage(browser, "learner_A1");
  await page.route("**/collaboration/stream", (route) => route.abort());
  await page.goto(`${frontend}/curriculum.html#/studio/projects/${project.data.projectId}/build`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Build Your Website" })).toBeVisible();
  await expect(page.getByText("Real-time updates unavailable", { exact: true })).toBeVisible({ timeout: 15000 });
  await page.getByLabel("Page content").fill("Saved while real-time is unavailable.");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.close();
});
