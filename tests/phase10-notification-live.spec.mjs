import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!frontend || !api || !database) throw new Error("Phase 10 acceptance requires the disposable environment.");
const token = (id) => `Bearer dev-token:${id}`;
const headers = (id) => ({ Authorization: token(id), "Content-Type": "application/json" });
const sql = (statement) => execFileSync("psql", [database, "-X", "-At", "-v", "ON_ERROR_STOP=1", "-c", statement], { encoding: "utf8" }).trim();

function installFixturePermissions() {
  sql("INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES ('phase10_student_create','phase8_role_student','studio.project.create'),('phase10_student_view','phase8_role_student','studio.project.view'),('phase10_student_update','phase8_role_student','studio.project.update') ON CONFLICT DO NOTHING;");
}

async function apiJson(request, id, path, options = {}) {
  const response = await request.fetch(`${api}${path}`, { ...options, headers: { ...headers(id), ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  return { response, body, data: body.data ?? body };
}

async function createSubmission(request) {
  const project = await apiJson(request, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title: "Phase 10 Notification Project" } });
  expect(project.response.status()).toBe(201);
  const projectId = project.data.projectId;
  const workspace = await apiJson(request, "learner_A1", `/studio/projects/${projectId}/workspace`);
  const saved = await apiJson(request, "learner_A1", `/studio/projects/${projectId}/workspace`, { method: "PATCH", data: { revision: workspace.data.revision, work: { pages: [{ path: "/", title: "Notification Project", content: "Canonical event notification acceptance." }] } } });
  expect(saved.response.status()).toBe(200);
  expect((await apiJson(request, "learner_A1", `/studio/projects/${projectId}/qa`, { method: "POST", data: {} })).response.status()).toBe(201);
  expect((await apiJson(request, "learner_A1", `/studio/projects/${projectId}/review-submissions`, { method: "POST", data: {} })).response.status()).toBe(201);
  const current = await apiJson(request, "learner_A1", `/studio/projects/${projectId}/review/current`);
  return { projectId, submissionId: current.data.submission.submissionId };
}

test("canonical events create durable scoped notifications and mark-read is presentation-only", async ({ request, browser }) => {
  installFixturePermissions();
  const source = await createSubmission(request);
  const assigned = await apiJson(request, "instructor_A_authorized", "/notifications");
  expect(assigned.response.status()).toBe(200);
  const item = assigned.data.items.find((candidate) => candidate.type === "REVIEW_ASSIGNED" && candidate.message.includes("ready for your review"));
  expect(item).toBeTruthy();
  expect(item.status).toBe("UNREAD");
  expect(item.destinationPath).toBe("/studio/reviewer-queue");
  const assignmentBefore = sql(`SELECT status FROM studio_review_assignments WHERE review_submission_id='${source.submissionId}' AND status IN ('ASSIGNED','IN_PROGRESS') LIMIT 1`);
  const marked = await apiJson(request, "instructor_A_authorized", `/notifications/${item.notificationId}/read`, { method: "POST", data: {} });
  expect(marked.response.status()).toBe(200);
  expect(marked.data.status).toBe("READ");
  expect(sql(`SELECT status FROM studio_review_assignments WHERE review_submission_id='${source.submissionId}' AND status IN ('ASSIGNED','IN_PROGRESS') LIMIT 1`)).toBe(assignmentBefore);
  const duplicateRoute = await apiJson(request, "admin_A", `/studio/review-submissions/${source.submissionId}/route`, { method: "POST", data: {} });
  expect(duplicateRoute.response.status()).toBe(201);
  const after = await apiJson(request, "instructor_A_authorized", "/notifications");
  expect(after.data.items.filter((candidate) => candidate.notificationId === item.notificationId)).toHaveLength(1);
  expect(Number(sql(`SELECT COUNT(*) FROM notifications WHERE notification_id='${item.notificationId}'`))).toBe(1);
  const foreign = await apiJson(request, "admin_B", "/notifications");
  expect(foreign.response.status()).toBe(200);
  expect(foreign.data.items.some((candidate) => candidate.notificationId === item.notificationId)).toBe(false);
  const foreignRead = await apiJson(request, "admin_B", `/notifications/${item.notificationId}/read`, { method: "POST", data: {} });
  expect(foreignRead.response.status()).toBe(404);

  for (const width of [1440, 768, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    await page.addInitScript(() => { window.__user = { id: "instructor_A_authorized", role: "instructor", name: "Reviewer A" }; });
    await page.goto(`${frontend}/curriculum.html#/curriculum/notifications`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Notifications" }).first()).toBeVisible();
    await expect(page.getByText("New review work")).toBeVisible();
    await expect(page.getByText("READ", { exact: true })).toBeVisible();
    expect((await page.getByRole("main", { name: "Notifications" }).ariaSnapshot()).replace(/\s+/g, " ")).toContain("Notifications");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
    await page.close();
  }
  const empty = await browser.newPage({ viewport: { width: 390, height: 900 }, reducedMotion: "reduce" });
  await empty.addInitScript(() => { window.__user = { id: "admin_empty", role: "admin", name: "Empty Admin" }; });
  await empty.goto(`${frontend}/curriculum.html#/curriculum/notifications`, { waitUntil: "domcontentloaded" });
  await expect(empty.getByRole("heading", { name: "Notifications" }).first()).toBeVisible();
  await expect(empty.getByText("No notifications yet.")).toBeVisible();
  expect((await empty.getByRole("main", { name: "Notifications" }).ariaSnapshot()).replace(/\s+/g, " ")).toContain("No notifications yet.");
  await empty.close();
});
