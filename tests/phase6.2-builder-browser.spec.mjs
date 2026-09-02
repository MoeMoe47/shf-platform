import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!frontend || !api || !database) throw new Error("Phase 6.2 browser acceptance requires the disposable environment.");

const token = (id) => `Bearer dev-token:${id}`;
const headers = (id) => ({ Authorization: token(id), "Content-Type": "application/json" });

async function actorPage(browser, id, viewport) {
  const page = await browser.newPage({ viewport });
  await page.addInitScript(({ id }) => { window.__user = { role: "student", email: `${id}@phase6.test`, name: id }; }, { id });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (["fetch", "xhr"].includes(request.resourceType())) return route.continue({ headers: { ...request.headers(), authorization: token(id) } });
    return route.continue();
  });
  return page;
}

async function apiJson(page, id, path, options = {}) {
  const response = await page.request.fetch(`${api}${path}`, { ...options, headers: { ...headers(id), ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  return { response, body, data: body.data ?? body };
}

async function createProject(page, id, projectType, title) {
  const result = await apiJson(page, id, "/studio/projects", { method: "POST", data: { projectType, title } });
  expect(result.response.status()).toBe(201);
  return result.data;
}

function downstreamCounts() {
  const sql = "SELECT (SELECT COUNT(*) FROM prepare_prove_evidence) AS evidence, (SELECT COUNT(*) FROM curriculum_lesson_completions) AS completions, (SELECT COUNT(*) FROM project_submissions) AS submissions, (SELECT COUNT(*) FROM learner_competency_decisions) AS reviews, (SELECT COUNT(*) FROM live_session_join_events WHERE attendance_status='confirmed') AS attendance, (SELECT COUNT(*) FROM curriculum_truth_facts) AS truth_facts, (SELECT COUNT(*) FROM learner_credentials) AS credentials;";
  return execFileSync("psql", [database, "-X", "-At", "-c", sql], { encoding: "utf8" }).trim();
}

function enableStudioFixturePermissions() {
  const sql = "INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES ('phase62_student_studio_create','phase8_role_student','studio.project.create'),('phase62_student_studio_view','phase8_role_student','studio.project.view'),('phase62_student_studio_update','phase8_role_student','studio.project.update') ON CONFLICT DO NOTHING;";
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", sql], { encoding: "utf8" });
}

test.describe.configure({ mode: "serial" });

test("authenticated Website builder saves and reloads without downstream truth", async ({ browser }) => {
  const page = await actorPage(browser, "learner_A1", { width: 1440, height: 900 });
  enableStudioFixturePermissions();
  const before = downstreamCounts();
  const project = await createProject(page, "learner_A1", "WEBSITE", "Phase 6.2 Website");
  const beforeProject = await apiJson(page, "learner_A1", `/studio/projects/${project.projectId}`);
  await page.goto(`${frontend}/curriculum.html#/studio/projects/${project.projectId}`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).toContainText("What you’re building");
  await expect(page.locator("body")).toContainText("Project Resources");
  await page.goto(`${frontend}/curriculum.html#/studio/projects/${project.projectId}/build`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Build Your Website" })).toBeVisible();
  await page.getByLabel("Page title").fill("Saved Home");
  await page.getByLabel("Page content").fill("Authenticated durable Website work.");
  const patchRequest = page.waitForRequest((request) => request.method() === "PATCH" && request.url().endsWith(`/studio/projects/${project.projectId}/workspace`));
  await page.getByRole("button", { name: "Save draft" }).click();
  const request = await patchRequest;
  expect(JSON.parse(request.postData()).work.pages[0].content).toBe("Authenticated durable Website work.");
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Page title")).toHaveValue("Saved Home");
  await expect(page.getByLabel("Page content")).toHaveValue("Authenticated durable Website work.");
  await expect(page.locator("body")).not.toContainText(/QA passed|Verified|Delivered|Evidence created|Portfolio added/i);
  expect(downstreamCounts()).toBe(before);
  const afterProject = await apiJson(page, "learner_A1", `/studio/projects/${project.projectId}`);
  expect({ status: afterProject.data.status, qaStatus: afterProject.data.qaStatus, reviewStatus: afterProject.data.reviewStatus, deliveryStatus: afterProject.data.deliveryStatus })
    .toEqual({ status: beforeProject.data.status, qaStatus: beforeProject.data.qaStatus, reviewStatus: beforeProject.data.reviewStatus, deliveryStatus: beforeProject.data.deliveryStatus });
  await page.close();
});

test("authenticated AI Agent builder saves, reloads, and rejects Website-shaped work", async ({ browser }) => {
  const page = await actorPage(browser, "learner_A1", { width: 1440, height: 900 });
  const project = await createProject(page, "learner_A1", "AI_AGENT", "Phase 6.2 Agent");
  await page.goto(`${frontend}/curriculum.html#/studio/projects/${project.projectId}/build`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Build Your AI Agent" })).toBeVisible();
  await page.getByLabel("Agent name").fill("Study Guide");
  await page.getByLabel("Instructions").fill("Help students understand requirements.");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Agent name")).toHaveValue("Study Guide");
  await expect(page.getByLabel("Instructions")).toHaveValue("Help students understand requirements.");
  const mismatch = await apiJson(page, "learner_A1", `/studio/projects/${project.projectId}/workspace`, { method: "PATCH", data: { revision: 1, work: { pages: [{ path: "/", title: "Wrong", content: "" }] } } });
  expect(mismatch.response.status()).toBe(400);
  await expect(page.locator("body")).not.toContainText(/Registry approved|Standards compliant|Production ready|Deployed|Verified/i);
  await page.close();
});

test("workspace conflict and cross-organization access fail closed", async ({ browser }) => {
  const page = await actorPage(browser, "learner_A1", { width: 768, height: 1024 });
  const project = await createProject(page, "learner_A1", "WEBSITE", "Conflict Website");
  const first = await apiJson(page, "learner_A1", `/studio/projects/${project.projectId}/workspace`);
  const save = await apiJson(page, "learner_A1", `/studio/projects/${project.projectId}/workspace`, { method: "PATCH", data: { revision: first.data.revision, work: { pages: [{ path: "/", title: "Winner", content: "Newest" }] } } });
  expect(save.response.status()).toBe(200);
  const stale = await apiJson(page, "learner_A1", `/studio/projects/${project.projectId}/workspace`, { method: "PATCH", data: { revision: first.data.revision, work: { pages: [{ path: "/", title: "Stale", content: "Must not win" }] } } });
  expect(stale.response.status()).toBe(409);
  const foreign = await apiJson(page, "learner_B1", `/studio/projects/${project.projectId}/workspace`);
  expect([403, 404]).toContain(foreign.response.status());
  await page.close();
});

test("stale browser save is reported as a conflict rather than Saved", async ({ browser }) => {
  const firstPage = await actorPage(browser, "learner_A1", { width: 1440, height: 900 });
  const secondPage = await actorPage(browser, "learner_A1", { width: 1440, height: 900 });
  enableStudioFixturePermissions();
  const project = await createProject(firstPage, "learner_A1", "WEBSITE", "Browser Conflict Website");
  const initial = await apiJson(firstPage, "learner_A1", `/studio/projects/${project.projectId}/workspace`);
  await apiJson(firstPage, "learner_A1", `/studio/projects/${project.projectId}/workspace`, { method: "PATCH", data: { revision: initial.data.revision, work: { pages: [{ path: "/", title: "Initial", content: "Initial revision." }] } } });
  const url = `${frontend}/curriculum.html#/studio/projects/${project.projectId}/build`;
  const workspaceGet = (page) => page.waitForResponse((response) => response.request().method() === "GET" && response.url().endsWith(`/studio/projects/${project.projectId}/workspace`));
  await Promise.all([
    firstPage.goto(url, { waitUntil: "domcontentloaded" }),
    secondPage.goto(url, { waitUntil: "domcontentloaded" }),
    workspaceGet(firstPage),
    workspaceGet(secondPage),
  ]);
  await firstPage.getByLabel("Page content").fill("Winning browser revision.");
  await firstPage.getByRole("button", { name: "Save draft" }).click();
  await expect(firstPage.getByText("Saved", { exact: true })).toBeVisible();
  await secondPage.getByLabel("Page content").fill("Stale browser revision.");
  const staleResponse = secondPage.waitForResponse((response) => response.request().method() === "PATCH" && response.url().endsWith(`/studio/projects/${project.projectId}/workspace`));
  await secondPage.getByRole("button", { name: "Save draft" }).click();
  expect((await staleResponse).status()).toBe(409);
  await expect(secondPage.getByRole("alert")).toContainText("changed in another tab");
  await expect(secondPage.getByText("Saved", { exact: true })).not.toBeVisible();
  await firstPage.close();
  await secondPage.close();
});

test("Website and AI Agent builder layouts remain usable at mobile width", async ({ browser }) => {
  const page = await actorPage(browser, "learner_A1", { width: 390, height: 900 });
  for (const [type, heading, title] of [["WEBSITE", "Build Your Website", "Mobile Website"], ["AI_AGENT", "Build Your AI Agent", "Mobile Agent"]]) {
    const project = await createProject(page, "learner_A1", type, title);
    await page.goto(`${frontend}/curriculum.html#/studio/projects/${project.projectId}/build`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await expect(page.getByRole("button", { name: "Save draft" })).toBeVisible();
  }
  await page.close();
});

test("builder labels, keyboard controls, status text, and tablet layout are usable", async ({ browser }) => {
  const page = await actorPage(browser, "learner_A1", { width: 768, height: 1024 });
  const website = await createProject(page, "learner_A1", "WEBSITE", "Accessibility Website");
  await page.goto(`${frontend}/curriculum.html#/studio/projects/${website.projectId}/build`, { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Page title")).toBeVisible();
  await expect(page.getByLabel("Page content")).toBeVisible();
  await page.getByRole("button", { name: "Save draft" }).focus();
  await expect(page.getByRole("button", { name: "Save draft" })).toBeFocused();
  await page.getByRole("button", { name: "Save draft" }).press("Enter");
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);
  await page.close();
});
