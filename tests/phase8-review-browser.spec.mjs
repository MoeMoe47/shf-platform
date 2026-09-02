import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!frontend || !api || !database) throw new Error("Phase 8 browser acceptance requires the disposable environment.");
const token = (id) => `Bearer dev-token:${id}`;
const headers = (id) => ({ Authorization: token(id), "Content-Type": "application/json" });

async function actorPage(browser, id, role = "student", viewport = { width: 1440, height: 900 }) {
  const page = await browser.newPage({ viewport });
  await page.addInitScript(({ id, role }) => { window.__user = { role, email: `${id}@phase8.test`, name: id }; }, { id, role });
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
  const sql = "INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES ('phase8_student_studio_create','phase8_role_student','studio.project.create'),('phase8_student_studio_view','phase8_role_student','studio.project.view'),('phase8_student_studio_update','phase8_role_student','studio.project.update') ON CONFLICT DO NOTHING;";
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", sql], { encoding: "utf8" });
}
function downstreamCounts() {
  return execFileSync("psql", [database, "-X", "-At", "-c", "SELECT (SELECT COUNT(*) FROM prepare_prove_evidence),(SELECT COUNT(*) FROM curriculum_lesson_completions),(SELECT COUNT(*) FROM learner_credentials),(SELECT COUNT(*) FROM curriculum_truth_facts);"], { encoding: "utf8" }).trim();
}

test.describe.configure({ mode: "serial" });

test("Website student submission, reviewer changes, resubmission, approval, and stale approval", async ({ browser }) => {
  enablePermissions();
  const student = await actorPage(browser, "learner_A1");
  const reviewer = await actorPage(browser, "instructor_A_authorized", "instructor", { width: 1280, height: 900 });
  const before = downstreamCounts();
  const created = await apiJson(student, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title: "Phase 8 Website Review" } });
  expect(created.response.status()).toBe(201);
  const projectId = created.data.projectId;
  const buildUrl = `${frontend}/curriculum.html#/studio/projects/${projectId}/build`;
  await student.goto(buildUrl, { waitUntil: "domcontentloaded" });
  await student.getByLabel("Page title").fill("Home");
  await student.getByLabel("Page content").fill("A complete reviewable website.");
  await student.getByRole("button", { name: "Save draft" }).click();
  await expect(student.getByText("Saved", { exact: true })).toBeVisible();
  await student.getByRole("button", { name: "Check My Project" }).click();
  await expect(student.getByText("Looks good")).toBeVisible();
  await student.getByRole("button", { name: "Submit for Review" }).click();
  await expect(student.getByText("Submitted", { exact: true })).toBeVisible();
  const current = await apiJson(student, "learner_A1", `/studio/projects/${projectId}/review/current`);
  const submissionId = current.data.submission.submissionId;
  await reviewer.goto(`${frontend}/curriculum.html#/studio/review/${projectId}/${submissionId}`, { waitUntil: "domcontentloaded" });
  await expect(reviewer.getByRole("heading", { name: "Submitted work" }).last()).toBeVisible();
  await expect(reviewer.getByText("A complete reviewable website.")).toBeVisible();
  await reviewer.getByLabel("Feedback for student").fill("Please add one more thoughtful section.");
  await reviewer.getByRole("button", { name: "Request Changes" }).click();
  await expect(reviewer.getByText("Review decision recorded.", { exact: false })).toBeVisible();
  await student.reload({ waitUntil: "domcontentloaded" });
  await expect(student.getByText("Changes requested", { exact: true })).toBeVisible();
  await expect(student.getByText("Please add one more thoughtful section.")).toBeVisible();
  await student.getByLabel("Page content").fill("A complete reviewable website with a thoughtful section.");
  await student.getByRole("button", { name: "Save draft" }).click();
  await expect(student.getByText("Saved", { exact: true })).toBeVisible();
  await expect(student.getByText("Previous review applies to an earlier version")).toBeVisible();
  await student.getByRole("button", { name: "Check My Project" }).click();
  await expect(student.getByText("Looks good")).toBeVisible();
  const secondSubmit = student.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith(`/studio/projects/${projectId}/review-submissions`));
  await student.getByRole("button", { name: "Submit for Review" }).click();
  const secondSubmitResponse = await secondSubmit;
  expect(secondSubmitResponse.status()).toBe(201);
  const second = await apiJson(student, "learner_A1", `/studio/projects/${projectId}/review/current`);
  expect(second.data.submission.workspaceRevision).toBeGreaterThan(current.data.submission.workspaceRevision);
  await reviewer.goto(`${frontend}/curriculum.html#/studio/review/${projectId}/${second.data.submission.submissionId}`, { waitUntil: "domcontentloaded" });
  await reviewer.getByRole("button", { name: "Approve" }).click();
  await expect(reviewer.getByText("Review decision recorded.", { exact: false })).toBeVisible();
  await student.reload({ waitUntil: "domcontentloaded" });
  await expect(student.getByText("Approved", { exact: true })).toBeVisible();
  await student.getByLabel("Page content").fill("A later edit after approval.");
  await student.getByRole("button", { name: "Save draft" }).click();
  await expect(student.getByText("Previous review applies to an earlier version")).toBeVisible();
  await expect(student.locator("body")).not.toContainText(/Delivered|Evidence created|Portfolio added|Completed/i);
  expect(downstreamCounts()).toBe(before);
  await student.close();
  await reviewer.close();
});

test("AI Agent review uses exact project type and foreign/student decisions fail closed", async ({ browser }) => {
  enablePermissions();
  const student = await actorPage(browser, "learner_A1", "student", { width: 390, height: 900 });
  const reviewer = await actorPage(browser, "instructor_A_authorized", "instructor", { width: 1280, height: 900 });
  const created = await apiJson(student, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "AI_AGENT", title: "Phase 8 Agent Review" } });
  const projectId = created.data.projectId;
  await student.goto(`${frontend}/curriculum.html#/studio/projects/${projectId}/build`, { waitUntil: "domcontentloaded" });
  await student.getByLabel("Agent name").fill("Study Guide");
  await student.getByLabel("Instructions").fill("Help explain project requirements.");
  await student.getByRole("button", { name: "Save draft" }).click();
  await student.getByRole("button", { name: "Check My Project" }).click();
  await expect(student.getByText("Looks good")).toBeVisible();
  const agentSubmit = student.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith(`/studio/projects/${projectId}/review-submissions`));
  await student.getByRole("button", { name: "Submit for Review" }).click();
  expect((await agentSubmit).status()).toBe(201);
  const current = await apiJson(student, "learner_A1", `/studio/projects/${projectId}/review/current`);
  const denied = await apiJson(student, "learner_A1", `/studio/projects/${projectId}/review-submissions/${current.data.submission.submissionId}/decision`, { method: "POST", data: { decision: "APPROVED", feedback: "self" } });
  expect(denied.response.status()).toBe(403);
  const foreign = await apiJson(student, "instructor_B", `/studio/projects/${projectId}/review-submissions/${current.data.submission.submissionId}`);
  expect([403, 404]).toContain(foreign.response.status());
  await reviewer.goto(`${frontend}/curriculum.html#/studio/review/${projectId}/${current.data.submission.submissionId}`, { waitUntil: "domcontentloaded" });
  await expect(reviewer.getByText("Study Guide")).toBeVisible();
  await expect(reviewer.getByText("Help explain project requirements.")).toBeVisible();
  await reviewer.getByRole("button", { name: "Approve" }).click();
  await expect(reviewer.getByText("Review decision recorded.", { exact: false })).toBeVisible();
  expect(await student.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await student.close();
  await reviewer.close();
});
