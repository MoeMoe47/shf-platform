import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!frontend || !api || !database) throw new Error("Phase 7 browser acceptance requires the disposable environment.");

const token = (id) => `Bearer dev-token:${id}`;
async function actorPage(browser, id, viewport) {
  const page = await browser.newPage({ viewport });
  await page.addInitScript(({ id }) => { window.__user = { role: "student", email: `${id}@phase7.test`, name: id }; }, { id });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (["fetch", "xhr"].includes(request.resourceType())) return route.continue({ headers: { ...request.headers(), authorization: token(id) } });
    return route.continue();
  });
  return page;
}
async function apiJson(page, id, path, options = {}) {
  const response = await page.request.fetch(`${api}${path}`, { ...options, headers: { Authorization: token(id), "Content-Type": "application/json", ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  return { response, body, data: body.data ?? body };
}
async function createProject(page, type, title) {
  const result = await apiJson(page, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: type, title } });
  expect(result.response.status()).toBe(201);
  return result.data;
}
function enablePermissions() {
  const sql = "INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES ('phase7_student_studio_create','phase8_role_student','studio.project.create'),('phase7_student_studio_view','phase8_role_student','studio.project.view'),('phase7_student_studio_update','phase8_role_student','studio.project.update') ON CONFLICT DO NOTHING;";
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", sql], { encoding: "utf8" });
}
function downstreamCounts() {
  return execFileSync("psql", [database, "-X", "-At", "-c", "SELECT (SELECT COUNT(*) FROM prepare_prove_evidence),(SELECT COUNT(*) FROM curriculum_lesson_completions),(SELECT COUNT(*) FROM learner_credentials),(SELECT COUNT(*) FROM curriculum_truth_facts);"], { encoding: "utf8" }).trim();
}

test.describe.configure({ mode: "serial" });

test("Website Check My Project evaluates saved work and marks old results stale", async ({ browser }) => {
  enablePermissions();
  const page = await actorPage(browser, "learner_A1", { width: 1440, height: 900 });
  const before = downstreamCounts();
  const project = await createProject(page, "WEBSITE", "Phase 7 Website");
  await page.goto(`${frontend}/curriculum.html#/studio/projects/${project.projectId}/build`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Check My Project" })).toBeVisible();
  await page.getByLabel("Page title").fill("");
  await page.getByLabel("Page content").fill("");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByRole("button", { name: "Check My Project" })).toBeVisible();
  const checkRequest = page.waitForRequest((request) => request.method() === "POST" && request.url().endsWith(`/studio/projects/${project.projectId}/qa`));
  await page.getByRole("button", { name: "Check My Project" }).click();
  const request = await checkRequest;
  expect(request.postData()).toBe("{}");
  await expect(page.locator("body")).toContainText("Needs changes");
  await expect(page.locator("body")).toContainText("The Home page needs a title.");
  await page.getByLabel("Page title").fill("Home");
  await page.getByLabel("Page content").fill("A useful project.");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.locator("body")).toContainText("Project changed — check again");
  await page.getByRole("button", { name: "Check My Project" }).click();
  await expect(page.locator("body")).toContainText("Looks good");
  expect(downstreamCounts()).toBe(before);
  await page.close();
});

test("AI Agent Check My Project uses Agent checks and foreign QA access fails closed", async ({ browser }) => {
  const page = await actorPage(browser, "learner_A1", { width: 1440, height: 900 });
  const project = await createProject(page, "AI_AGENT", "Phase 7 Agent");
  await page.goto(`${frontend}/curriculum.html#/studio/projects/${project.projectId}/build`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Agent name").fill("Study Guide");
  await page.getByLabel("Instructions").fill("");
  await page.getByRole("button", { name: "Save draft" }).click();
  await page.getByRole("button", { name: "Check My Project" }).click();
  await expect(page.locator("body")).toContainText("Needs changes");
  await expect(page.locator("body")).toContainText("The agent needs instructions.");
  await page.getByLabel("Instructions").fill("Help explain project requirements.");
  await page.getByRole("button", { name: "Save draft" }).click();
  await page.getByRole("button", { name: "Check My Project" }).click();
  await expect(page.locator("body")).toContainText("Looks good");
  const foreign = await apiJson(page, "learner_B1", `/studio/projects/${project.projectId}/qa/current`);
  expect([403, 404]).toContain(foreign.response.status());
  await page.close();
});

test("QA summary remains usable on mobile", async ({ browser }) => {
  const page = await actorPage(browser, "learner_A1", { width: 390, height: 900 });
  const project = await createProject(page, "WEBSITE", "Mobile QA Project With A Long Title That Must Wrap");
  await page.goto(`${frontend}/curriculum.html#/studio/projects/${project.projectId}/build`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Check My Project" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(page.getByRole("button", { name: "Check My Project" })).toBeVisible();
  await page.close();
});
