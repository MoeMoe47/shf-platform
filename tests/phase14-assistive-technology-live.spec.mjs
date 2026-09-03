import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!frontend || !api || !database) throw new Error("Phase 14 acceptance requires the disposable environment.");

const token = (id) => `Bearer dev-token:${id}`;

async function apiJson(request, id, path, options = {}) {
  const response = await request.fetch(`${api}${path}`, {
    ...options,
    headers: { Authorization: token(id), "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  return { response, body, data: body.data ?? body };
}

async function actorPage(browser, id, viewport = { width: 1440, height: 900 }) {
  const page = await browser.newPage({ viewport });
  await page.addInitScript(({ id }) => {
    window.__user = { id, role: id.startsWith("admin") ? "admin" : "student", email: `${id}@phase14.test`, name: id === "learner_A1" ? "Learner A1" : id === "learner_A2" ? "Learner A2" : id };
  }, { id });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (["fetch", "xhr"].includes(request.resourceType())) return route.continue({ headers: { ...request.headers(), authorization: token(id) } });
    return route.continue();
  });
  return page;
}

function enableStudioPermissions() {
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", `
    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('phase14_student_create','phase8_role_student','studio.project.create'),
      ('phase14_student_view','phase8_role_student','studio.project.view'),
      ('phase14_student_update','phase8_role_student','studio.project.update')
    ON CONFLICT DO NOTHING;
  `], { encoding: "utf8" });
}

async function keyboardSubmitNewProject(page, type, title) {
  await page.goto(`${frontend}/curriculum.html#/studio/new?type=${type}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "What do you want to create?" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "What are you making?" })).toBeVisible();
  await page.getByLabel("Project name").focus();
  await page.keyboard.type(title);
  await page.getByLabel("What should it help someone do?").focus();
  await page.keyboard.type("A focused student project.");
  await page.getByRole("button", { name: "Continue" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Who is it for?" })).toBeVisible();
  await page.getByLabel(/Who is it for/).focus();
  await page.keyboard.type("students");
  await page.getByRole("button", { name: "Start Project" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/studio\/projects\//);
  return page.url().match(/projects\/([^/]+)/)[1];
}

test.describe.configure({ mode: "serial" });

test("keyboard-only Website and AI Agent creation reaches the real project surface", async ({ browser }) => {
  enableStudioPermissions();
  const page = await actorPage(browser, "learner_A1");
  const websiteId = await keyboardSubmitNewProject(page, "WEBSITE", `Phase 14 Website ${Date.now()}`);
  await expect(page.getByRole("heading", { name: "Project context" })).toBeVisible();
  expect(await page.locator("body").evaluate((body) => body.innerText)).toContain("Personal Project");
  await page.goto(`${frontend}/curriculum.html#/studio/new?type=AI_AGENT`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "What do you want to create?" })).toBeVisible();
  await page.getByRole("radio", { name: "AI Agent" }).focus();
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "Continue" }).focus();
  await page.keyboard.press("Enter");
  await page.getByLabel("Project name").focus();
  await page.keyboard.type(`Phase 14 Agent ${Date.now()}`);
  await page.getByRole("button", { name: "Continue" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Start Project" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/studio\/projects\//);
  await page.goto(`${frontend}/curriculum.html#/studio/projects/${websiteId}/build`, { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Page content")).toBeVisible();
  await page.getByLabel("Page content").focus();
  await page.keyboard.type("Keyboard-accessible content.");
  await page.getByRole("button", { name: "Save draft" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  const revisionSnapshot = await page.locator("section[aria-labelledby='studio-revision-history-heading']").ariaSnapshot();
  expect(revisionSnapshot).toContain("Revision 1");
  await page.close();
});

test("project, Learning Context, revision, collaboration, and error semantics are exposed", async ({ browser, request }) => {
  enableStudioPermissions();
  const page = await actorPage(browser, "learner_A1");
  const project = await apiJson(request, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title: "Phase 14 Individual" } });
  expect(project.response.status()).toBe(201);
  await page.goto(`${frontend}/curriculum.html#/studio/projects/${project.data.projectId}/build`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Build Your Website" })).toBeVisible();
  const snapshot = await page.locator("main").ariaSnapshot();
  expect(snapshot).toContain("What you’re building");
  expect(snapshot).toContain("Project context");
  expect(snapshot).toContain("Personal Project");
  expect(snapshot).toContain("Progress");
  expect(snapshot).toContain("Requirements");
  expect(snapshot).toContain("Next step");
  expect(snapshot).toContain("Revision history");
  await page.route("**/studio/projects/*/learning-context", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false }) }));
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText("Learning context is unavailable", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Page content")).toBeVisible();
  await page.close();
});

test("Team management and collaboration have keyboard and ARIA coverage", async ({ browser, request }) => {
  enableStudioPermissions();
  const team = await apiJson(request, "admin_A", "/studio/teams", { method: "POST", data: { name: `Phase 14 Team ${Date.now()}` } });
  expect(team.response.status()).toBe(201);
  const manager = await apiJson(request, "admin_A", `/studio/teams/${team.data.teamId}/members`, { method: "POST", data: { userId: "admin_A", role: "LEAD" } });
  expect(manager.response.status()).toBe(201);
  const add = await apiJson(request, "admin_A", `/studio/teams/${team.data.teamId}/members`, { method: "POST", data: { userId: "learner_A1", role: "LEAD" } });
  expect(add.response.status()).toBe(201);
  const page = await actorPage(browser, "admin_A");
  await page.goto(`${frontend}/curriculum.html#/studio/teams`, { waitUntil: "domcontentloaded" });
  const teamSnapshot = await page.getByRole("main", { name: "Teams" }).ariaSnapshot();
  expect(teamSnapshot).toContain("Teams");
  expect(teamSnapshot).toContain("Create Team");
  await expect(page.getByRole("button", { name: "View members" })).toBeVisible();
  await page.getByRole("button", { name: "View members" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("learner_A1")).toBeVisible();
  const project = await apiJson(request, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title: "Phase 14 Team Project", teamId: team.data.teamId } });
  expect(project.response.status()).toBe(201);
  const projectPage = await actorPage(browser, "learner_A1");
  await projectPage.goto(`${frontend}/curriculum.html#/studio/projects/${project.data.projectId}/build`, { waitUntil: "domcontentloaded" });
  await expect(projectPage.getByText("Connected", { exact: true })).toBeVisible({ timeout: 15000 });
  const collaborationSnapshot = await projectPage.locator("section[aria-labelledby='studio-collaboration-heading']").ariaSnapshot();
  expect(collaborationSnapshot).toContain("Collaborators");
  expect(collaborationSnapshot).toContain("Connected");
  await projectPage.close();
  await page.close();
});

test("critical Studio surfaces reflow at mobile and tablet widths with reduced motion", async ({ browser, request }) => {
  enableStudioPermissions();
  const project = await apiJson(request, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title: "Phase 14 Reflow" } });
  expect(project.response.status()).toBe(201);
  for (const viewport of [{ width: 390, height: 900 }, { width: 768, height: 1024 }]) {
    const page = await actorPage(browser, "learner_A1", viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${frontend}/curriculum.html#/studio/projects/${project.data.projectId}/build`, { waitUntil: "domcontentloaded" });
    await expect(page.getByLabel("Page content")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await page.close();
  }
});
