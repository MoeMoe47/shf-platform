import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
if (!frontend || !api) throw new Error("Phase 9 browser acceptance requires the disposable environment.");

const headers = (id) => ({ Authorization: `Bearer dev-token:${id}`, "Content-Type": "application/json" });

function enableStudentStudioPermissions() {
  const sql = "INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES ('phase9_student_studio_create','phase8_role_student','studio.project.create'),('phase9_student_studio_view','phase8_role_student','studio.project.view'),('phase9_student_studio_update','phase8_role_student','studio.project.update') ON CONFLICT DO NOTHING;";
  execFileSync("psql", [process.env.SHS_TEST_DATABASE_URL, "-X", "-v", "ON_ERROR_STOP=1", "-c", sql], { encoding: "utf8" });
}

async function apiJson(request, id, path, options = {}) {
  const response = await request.fetch(`${api}${path}`, { ...options, headers: { ...headers(id), ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  return { response, body, data: body.data ?? body };
}

test("routes a submitted revision once and completes the assignment with the canonical Review decision", async ({ browser }) => {
  enableStudentStudioPermissions();
  const student = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const reviewer = await browser.newPage({ viewport: { width: 768, height: 1024 } });
  await student.addInitScript(() => { window.__user = { role: "student", email: "learner_A1@phase9.test", name: "learner_A1" }; });
  await reviewer.addInitScript(() => { window.__user = { role: "instructor", email: "instructor_A_authorized@phase9.test", name: "instructor_A_authorized" }; });
  for (const [page, id] of [[student, "learner_A1"], [reviewer, "instructor_A_authorized"]]) {
    await page.route("**/*", async (route) => {
      const request = route.request();
      if (["fetch", "xhr"].includes(request.resourceType())) return route.continue({ headers: { ...request.headers(), authorization: `Bearer dev-token:${id}` } });
      return route.continue();
    });
  }
  const project = await apiJson(student.request, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title: "Phase 9 Routing Project" } });
  expect(project.response.status()).toBe(201);
  const projectId = project.data.projectId;
  await student.goto(`${frontend}/curriculum.html#/studio/projects/${projectId}/build`, { waitUntil: "domcontentloaded" });
  await student.getByLabel("Page title").fill("Routing test");
  await student.getByLabel("Page content").fill("A submission routed to an eligible reviewer.");
  await student.getByRole("button", { name: "Save draft" }).click();
  await student.getByRole("button", { name: "Check My Project" }).click();
  await expect(student.getByText("Looks good")).toBeVisible();
  await student.getByRole("button", { name: "Submit for Review" }).click();
  await expect(student.getByText("Submitted", { exact: true })).toBeVisible();
  const current = await apiJson(student.request, "learner_A1", `/studio/projects/${projectId}/review/current`);
  const submissionId = current.data.submission.submissionId;
  const queue = await apiJson(reviewer.request, "instructor_A_authorized", "/studio/reviews/queue");
  expect(queue.response.status()).toBe(200);
  const assignment = queue.data.items.find((item) => item.submissionId === submissionId);
  expect(assignment).toBeTruthy();
  expect(assignment.reviewerUserId).toBe("instructor_A_authorized");
  expect(assignment.workspaceRevision).toBe(current.data.submission.workspaceRevision);
  await reviewer.goto(`${frontend}/curriculum.html#/studio/reviewer-queue`, { waitUntil: "domcontentloaded" });
  await expect(reviewer.getByRole("heading", { name: "Needs Review" })).toBeVisible();
  await expect(reviewer.getByText("Phase 9 Routing Project")).toBeVisible();
  await expect(reviewer.getByRole("link", { name: "Review Work" })).toBeVisible();
  await expect(reviewer.locator("body")).not.toContainText("No work is waiting for your review.");
  expect(await reviewer.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);
  const adminRoutes = await Promise.all([1, 2, 3].map(() => apiJson(reviewer.request, "admin_A", `/studio/review-submissions/${submissionId}/route`, { method: "POST", data: {} })));
  expect(adminRoutes.every(({ response }) => response.status() === 201)).toBeTruthy();
  expect(new Set(adminRoutes.map(({ data }) => data.assignmentId)).size).toBe(1);
  const detail = await apiJson(reviewer.request, "admin_A", `/studio/reviews/assignments/${assignment.assignmentId}`);
  expect(detail.response.status()).toBe(200);
  expect(detail.data.status).toBe("ASSIGNED");
  await reviewer.goto(`${frontend}/curriculum.html#/studio/review/${projectId}/${submissionId}`, { waitUntil: "domcontentloaded" });
  await expect(reviewer.getByRole("heading", { name: "Submitted work" }).last()).toBeVisible();
  await reviewer.getByRole("button", { name: "Approve" }).click();
  await expect(reviewer.getByText("Review decision recorded.", { exact: false })).toBeVisible();
  const completed = await apiJson(reviewer.request, "admin_A", `/studio/reviews/assignments/${assignment.assignmentId}`);
  expect(completed.data.status).toBe("COMPLETED");
  const foreign = await apiJson(reviewer.request, "instructor_B", `/studio/review-submissions/${submissionId}/route`, { method: "POST", data: {} });
  expect([403, 404]).toContain(foreign.response.status());
  await student.close();
  await reviewer.close();
});
