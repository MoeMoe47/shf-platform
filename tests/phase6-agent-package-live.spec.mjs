import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!frontend || !api || !database) throw new Error("Phase 6 acceptance requires the disposable environment.");
const token = (id) => `Bearer dev-token:${id}`;
async function apiJson(page, id, path, options = {}) {
  const response = await page.request.fetch(`${api}${path}`, { ...options, headers: { Authorization: token(id), "Content-Type": "application/json", ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  return { response, body, data: body.data ?? body };
}
function setup() {
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", `
    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('phase6_student_studio_create','phase8_role_student','studio.project.create'),('phase6_student_studio_view','phase8_role_student','studio.project.view'),('phase6_student_studio_update','phase8_role_student','studio.project.update'),('phase6_student_studio_finalize','phase8_role_student','studio.project.finalize'),('phase6_student_agent_create','phase8_role_student','agent.package.create'),('phase6_student_agent_view','phase8_role_student','agent.package.view'),('phase6_student_registry_submit','phase8_role_student','agent.registry.submit'),('phase6_student_registry_view','phase8_role_student','agent.registry.view'),('phase6_instructor_review','phase8_role_instructor','project.submission.review'),('phase6_instructor_agent_view','phase8_role_instructor','agent.package.view') ON CONFLICT DO NOTHING;
  `], { encoding: "utf8" });
}
async function actorPage(browser, id, role = "student") {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(({ userId, userRole }) => { window.__user = { id: userId, role: userRole, email: `${userId}@phase6.test`, name: userId }; }, { userId: id, userRole: role });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (["fetch", "xhr"].includes(request.resourceType())) return route.continue({ headers: { ...request.headers(), authorization: token(id) } });
    return route.continue();
  });
  return page;
}

test("finalized AI Agent generates one durable validated package from the exact revision", async ({ browser }) => {
  test.setTimeout(120000);
  setup();
  const page = await actorPage(browser, "learner_A1");
  const reviewer = await actorPage(browser, "instructor_A_authorized", "instructor");
  const created = await apiJson(page, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "AI_AGENT", title: "Phase 6 Governed Agent" } });
  expect(created.response.status()).toBe(201);
  const projectId = created.data.projectId;
  await page.goto(`${frontend}/curriculum.html#/studio/projects/${projectId}/build`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Agent name").fill("Study helper");
  await page.getByLabel("Instructions").fill("Help a learner plan study tasks safely.");
  await page.getByRole("button", { name: "Save draft" }).click();
  await page.getByRole("button", { name: "Check My Project" }).click();
  await expect(page.getByText("Looks good")).toBeVisible();
  await page.getByRole("button", { name: "Submit for Review" }).click();
  await expect(page.getByText("Submitted", { exact: false })).toBeVisible();
  const review = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/review/current`);
  expect(review.response.status(), JSON.stringify(review.body)).toBe(200);
  expect(review.data.submission, JSON.stringify(review.body)).toBeTruthy();
  await reviewer.goto(`${frontend}/curriculum.html#/studio/review/${projectId}/${review.data.submission.submissionId}`, { waitUntil: "domcontentloaded" });
  await reviewer.getByRole("button", { name: "Approve" }).click();
  await page.bringToFront();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Finalize Project" }).click();
  await expect(page.getByText("Finalized", { exact: true })).toBeVisible();
  const first = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/agent-packages`, { method: "POST", data: {} });
  expect(first.response.status()).toBe(201);
  expect(first.data.package.status).toBe("VALID");
  expect(first.data.package.registryReadiness).toBe("READY_FOR_REGISTRY");
  expect(first.data.package.liveUrl).toBeUndefined();
  expect(first.data.package.projectType).toBe("AI_AGENT");
  const second = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/agent-packages`, { method: "POST", data: {} });
  expect(second.data.package.packageId).toBe(first.data.package.packageId);
  const list = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/agent-packages`);
  expect(list.data.items).toHaveLength(1);
  expect(list.data.items[0].workspaceRevision).toBe(first.data.package.workspaceRevision);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText("Agent Package Ready")).toBeVisible();
  await expect(page.getByText("Ready for Registry", { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Registered");
  const packageEvents = execFileSync("psql", [database, "-X", "-At", "-c", "SELECT COUNT(*) FROM integration_outbox WHERE producer_id='shs-api.agent-package'"], { encoding: "utf8" }).trim();
  expect(Number(packageEvents)).toBe(2);
  await page.close();
  await reviewer.close();
});
