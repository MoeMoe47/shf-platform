import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!frontend || !api || !database) throw new Error("Phase 9 browser acceptance requires the disposable environment.");
const token = (id) => `Bearer dev-token:${id}`;
const headers = (id) => ({ Authorization: token(id), "Content-Type": "application/json" });

async function actorPage(browser, id, role = "student", viewport = { width: 1440, height: 900 }) {
  const page = await browser.newPage({ viewport });
  await page.addInitScript(({ id, role }) => { window.__user = { role, email: `${id}@phase9.test`, name: id }; }, { id, role });
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

function enablePermissions() {
  const sql = "INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES ('phase9_student_studio_create','phase8_role_student','studio.project.create'),('phase9_student_studio_view','phase8_role_student','studio.project.view'),('phase9_student_studio_update','phase8_role_student','studio.project.update'),('phase9_student_studio_finalize','phase8_role_student','studio.project.finalize') ON CONFLICT DO NOTHING;";
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", sql], { encoding: "utf8" });
}

function downstreamCounts() {
  return execFileSync("psql", [database, "-X", "-At", "-c", "SELECT (SELECT COUNT(*) FROM prepare_prove_evidence),(SELECT COUNT(*) FROM curriculum_lesson_completions),(SELECT COUNT(*) FROM learner_credentials),(SELECT COUNT(*) FROM curriculum_truth_facts),(SELECT COUNT(*) FROM project_submissions);"], { encoding: "utf8" }).trim();
}

test.describe.configure({ mode: "serial" });

test("Website exact approved revision can be finalized and becomes stale after a newer save", async ({ browser }) => {
  enablePermissions();
  const student = await actorPage(browser, "learner_A1");
  const reviewer = await actorPage(browser, "instructor_A_authorized", "instructor", { width: 1280, height: 900 });
  const downstreamBefore = downstreamCounts();
  const created = await apiJson(student, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title: "Phase 9 Website Delivery" } });
  expect(created.response.status()).toBe(201);
  const projectId = created.data.projectId;
  await student.goto(`${frontend}/curriculum.html#/studio/projects/${projectId}/build`, { waitUntil: "domcontentloaded" });
  await student.getByLabel("Page title").fill("Final Website");
  await student.getByLabel("Page content").fill("Approved website content.");
  await student.getByRole("button", { name: "Save draft" }).click();
  await expect(student.getByText("Saved", { exact: true })).toBeVisible();
  await student.getByRole("button", { name: "Check My Project" }).click();
  await expect(student.getByText("Looks good")).toBeVisible();
  const submitResponse = student.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith(`/studio/projects/${projectId}/review-submissions`));
  await student.getByRole("button", { name: "Submit for Review" }).click();
  expect((await submitResponse).status()).toBe(201);
  const review = await apiJson(student, "learner_A1", `/studio/projects/${projectId}/review/current`);
  await reviewer.goto(`${frontend}/curriculum.html#/studio/review/${projectId}/${review.data.submission.submissionId}`, { waitUntil: "domcontentloaded" });
  await reviewer.getByRole("button", { name: "Approve" }).click();
  await student.reload({ waitUntil: "domcontentloaded" });
  const finalizeButton = student.getByRole("button", { name: "Finalize Project" });
  await expect(finalizeButton).toBeVisible();
  await finalizeButton.focus();
  await expect(finalizeButton).toBeFocused();
  await finalizeButton.click();
  await expect(student.getByText("Finalized", { exact: true })).toBeVisible();
  await student.getByLabel("Page content").fill("Newer unapproved edit.");
  await student.getByRole("button", { name: "Save draft" }).click();
  await expect(student.getByText("Earlier version", { exact: true })).toBeVisible();
  await expect(student.locator("body")).not.toContainText(/Published|Evidence created|Portfolio added|Completed|Verified/i);
  expect(downstreamCounts()).toBe(downstreamBefore);
  await student.close();
  await reviewer.close();
});

test("AI Agent finalization preserves Agent semantics on mobile and foreign status is denied", async ({ browser }) => {
  enablePermissions();
  const student = await actorPage(browser, "learner_A1", "student", { width: 390, height: 900 });
  const reviewer = await actorPage(browser, "instructor_A_authorized", "instructor", { width: 1280, height: 900 });
  const created = await apiJson(student, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "AI_AGENT", title: "Phase 9 Agent Delivery" } });
  expect(created.response.status()).toBe(201);
  const projectId = created.data.projectId;
  await student.goto(`${frontend}/curriculum.html#/studio/projects/${projectId}/build`, { waitUntil: "domcontentloaded" });
  await student.getByLabel("Agent name").fill("Study Guide");
  await student.getByLabel("Instructions").fill("Explain project requirements.");
  await student.getByRole("button", { name: "Save draft" }).click();
  await student.getByRole("button", { name: "Check My Project" }).click();
  await expect(student.getByText("Looks good")).toBeVisible();
  const submitResponse = student.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith(`/studio/projects/${projectId}/review-submissions`));
  await student.getByRole("button", { name: "Submit for Review" }).click();
  expect((await submitResponse).status()).toBe(201);
  const review = await apiJson(student, "learner_A1", `/studio/projects/${projectId}/review/current`);
  await reviewer.goto(`${frontend}/curriculum.html#/studio/review/${projectId}/${review.data.submission.submissionId}`, { waitUntil: "domcontentloaded" });
  await reviewer.getByRole("button", { name: "Approve" }).click();
  await student.reload({ waitUntil: "domcontentloaded" });
  await student.getByRole("button", { name: "Finalize Project" }).click();
  await expect(student.getByText("Finalized", { exact: true })).toBeVisible();
  expect(await student.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const foreign = await apiJson(student, "instructor_B", `/studio/projects/${projectId}/delivery/current`);
  expect([403, 404]).toContain(foreign.response.status());
  await expect(student.locator("body")).not.toContainText(/Registry approved|Production ready|Deployed|Verified/i);
  await student.close();
  await reviewer.close();
});
