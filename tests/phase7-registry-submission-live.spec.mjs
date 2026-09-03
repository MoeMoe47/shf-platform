import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!frontend || !api || !database) throw new Error("Phase 7 acceptance requires the disposable environment.");
const token = (id) => `Bearer dev-token:${id}`;
async function apiJson(page, id, path, options = {}) {
  const response = await page.request.fetch(`${api}${path}`, { ...options, headers: { Authorization: token(id), "Content-Type": "application/json", ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  return { response, body, data: body.data ?? body };
}
function setup() {
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", `
    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('phase7_student_studio_create','phase8_role_student','studio.project.create'),('phase7_student_studio_view','phase8_role_student','studio.project.view'),('phase7_student_studio_update','phase8_role_student','studio.project.update'),('phase7_student_studio_finalize','phase8_role_student','studio.project.finalize'),('phase7_student_agent_create','phase8_role_student','agent.package.create'),('phase7_student_agent_view','phase8_role_student','agent.package.view'),('phase7_student_registry_submit','phase8_role_student','agent.registry.submit'),('phase7_student_registry_view','phase8_role_student','agent.registry.view'),('phase7_instructor_review','phase8_role_instructor','project.submission.review') ON CONFLICT DO NOTHING;
  `], { encoding: "utf8" });
}
async function actorPage(browser, id, role = "student") {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(({ userId, userRole }) => { window.__user = { id: userId, role: userRole, email: `${userId}@phase7.test`, name: userId }; }, { userId: id, userRole: role });
  await page.route("**/*", async (route) => { const request = route.request(); if (["fetch", "xhr"].includes(request.resourceType())) return route.continue({ headers: { ...request.headers(), authorization: token(id) } }); return route.continue(); });
  return page;
}

test("explicit Registry submission binds one validated package and remains test-only", async ({ browser }) => {
  test.setTimeout(120000);
  setup();
  const page = await actorPage(browser, "learner_A1");
  const reviewer = await actorPage(browser, "instructor_A_authorized", "instructor");
  const created = await apiJson(page, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "AI_AGENT", title: "Phase 7 Registry Boundary Agent" } });
  expect(created.response.status()).toBe(201);
  const projectId = created.data.projectId;
  await page.goto(`${frontend}/curriculum.html#/studio/projects/${projectId}/build`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Agent name").fill("Registry boundary helper");
  await page.getByLabel("Instructions").fill("Help safely and request human review for sensitive actions.");
  await page.getByRole("button", { name: "Save draft" }).click();
  await page.getByRole("button", { name: "Check My Project" }).click();
  await expect(page.getByText("Looks good")).toBeVisible();
  const reviewSubmitted = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/review-submissions`, { method: "POST", data: {} });
  expect(reviewSubmitted.response.status(), JSON.stringify(reviewSubmitted.body)).toBe(201);
  const review = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/review/current`);
  expect(review.data.submission).toBeTruthy();
  const decision = await apiJson(reviewer, "instructor_A_authorized", `/studio/projects/${projectId}/review-submissions/${review.data.submission.submissionId}/decision`, { method: "POST", data: { decision: "APPROVED", feedback: "Approved for package validation." } });
  expect(decision.response.status(), JSON.stringify(decision.body)).toBe(200);
  const finalized = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/finalize`, { method: "POST", data: {} });
  expect(finalized.response.status(), JSON.stringify(finalized.body)).toBe(201);
  const delivery = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/delivery/current`);
  expect(delivery.response.status(), JSON.stringify(delivery.body)).toBe(200);
  const packaged = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/agent-packages`, { method: "POST", data: {} });
  expect(packaged.response.status(), JSON.stringify(packaged.body)).toBe(201);
  expect(packaged.data.package.registryReadiness).toBe("READY_FOR_REGISTRY");
  const packageId = packaged.data.package.packageId;
  const submitted = await apiJson(page, "learner_A1", `/agent-packages/${packageId}/registry-submissions`, { method: "POST", data: {} });
  expect(submitted.response.status(), JSON.stringify(submitted.body)).toBe(201);
  expect(submitted.data.submission.status).toBe("ACCEPTED");
  expect(submitted.data.submission.isTestRegistry).toBe(true);
  expect(submitted.data.submission.registryReference).toMatch(/^test-registry:/);
  expect(submitted.data.submission.packageHash).toBe(packaged.data.package.packageHash);
  const duplicate = await apiJson(page, "learner_A1", `/agent-packages/${packageId}/registry-submissions`, { method: "POST", data: {} });
  expect(duplicate.data.submission.submissionId).toBe(submitted.data.submission.submissionId);
  const concurrent = await Promise.all([1, 2].map(() => apiJson(page, "learner_A1", `/agent-packages/${packageId}/registry-submissions`, { method: "POST", data: {} })));
  expect(new Set(concurrent.map((result) => result.data.submission.submissionId)).size).toBe(1);
  const injected = await apiJson(page, "learner_A1", `/agent-packages/${packageId}/registry-submissions`, { method: "POST", data: { registryStatus: "ACCEPTED", registryReference: "forged", packageHash: "forged" } });
  expect(injected.response.status()).toBe(400);
  const list = await apiJson(page, "learner_A1", `/agent-packages/${packageId}/registry-submissions`);
  expect(list.data.items).toHaveLength(1);
  const outboxCount = execFileSync("psql", [database, "-X", "-At", "-c", "SELECT COUNT(*) FROM integration_outbox WHERE producer_id='shs-api.registry-submission'"], { encoding: "utf8" }).trim();
  expect(Number(outboxCount)).toBe(2);
  const scope = execFileSync("psql", [database, "-X", "-At", "-c", `SELECT COUNT(*) FROM agent_registry_submissions WHERE package_id='${packageId}' AND organization_id='${submitted.data.submission.organizationId}' AND tenant_id='${submitted.data.submission.tenantId}'`], { encoding: "utf8" }).trim();
  expect(Number(scope)).toBe(1);
  await expect(page.getByText("Ready for Registry", { exact: true })).toBeVisible().catch(() => {});
  await page.close(); await reviewer.close();
});
