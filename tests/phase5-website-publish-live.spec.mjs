import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!frontend || !api || !database) throw new Error("Phase 5 acceptance requires the disposable environment.");

const token = (id) => `Bearer dev-token:${id}`;

async function apiJson(page, id, path, options = {}) {
  const response = await page.request.fetch(`${api}${path}`, { ...options, headers: { Authorization: token(id), "Content-Type": "application/json", ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  return { response, body, data: body.data ?? body };
}

function setup() {
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", `
    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('phase5_student_studio_create','phase8_role_student','studio.project.create'),('phase5_student_studio_view','phase8_role_student','studio.project.view'),('phase5_student_studio_update','phase8_role_student','studio.project.update'),('phase5_student_studio_finalize','phase8_role_student','studio.project.finalize'),('phase5_student_deploy_create','phase8_role_student','website.deployment.create'),('phase5_student_deploy_view','phase8_role_student','website.deployment.view'),('phase5_instructor_review','phase8_role_instructor','project.submission.review'),('phase5_instructor_deploy_view','phase8_role_instructor','website.deployment.view') ON CONFLICT DO NOTHING;
    INSERT INTO curriculum_evidence_rules (evidence_rule_id, organization_id, source_type, evidence_type, truth_fact_type, competency_id, rule_version, review_required, created_by_user_id) VALUES ('phase5_studio_rule','phase8_org_a','STUDIO_DELIVERY','STUDIO_PROJECT_FINALIZED',NULL,'competency_prepare_prove_monitoring_finding',1,true,'admin_A') ON CONFLICT DO NOTHING;
  `], { encoding: "utf8" });
}

async function actorPage(browser, id, role = "student", viewport = { width: 1440, height: 900 }) {
  const page = await browser.newPage({ viewport });
  await page.addInitScript(({ userId, userRole }) => { window.__user = { id: userId, role: userRole, email: `${userId}@phase5.test`, name: userId }; }, { userId: id, userRole: role });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (["fetch", "xhr"].includes(request.resourceType())) return route.continue({ headers: { ...request.headers(), authorization: token(id) } });
    return route.continue();
  });
  return page;
}

async function finalizeWebsite(page, reviewer) {
  const created = await apiJson(page, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title: "Phase 5 Publish Website" } });
  expect(created.response.status()).toBe(201);
  const projectId = created.data.projectId;
  await page.goto(`${frontend}/curriculum.html#/studio/projects/${projectId}/build`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Page title").fill("Publish Home");
  await page.getByLabel("Page content").fill("A test deployment website.");
  await page.getByRole("button", { name: "Save draft" }).click();
  await page.getByRole("button", { name: "Check My Project" }).click();
  await expect(page.getByText("Looks good")).toBeVisible();
  const submit = page.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith(`/studio/projects/${projectId}/review-submissions`));
  await page.getByRole("button", { name: "Submit for Review" }).click();
  expect((await submit).status()).toBe(201);
  const review = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/review/current`);
  await reviewer.goto(`${frontend}/curriculum.html#/studio/review/${projectId}/${review.data.submission.submissionId}`, { waitUntil: "domcontentloaded" });
  const decision = reviewer.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith(`/studio/projects/${projectId}/review-submissions/${review.data.submission.submissionId}/decision`));
  await reviewer.getByRole("button", { name: "Approve" }).click();
  expect((await decision).status()).toBe(200);
  await page.bringToFront();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Finalize Project" }).click();
  await expect(page.getByText("Finalized", { exact: true })).toBeVisible();
  const status = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/institutional-status`);
  return { projectId, deliveryId: status.data.delivery.deliveryRecordId, revision: status.data.delivery.workspaceRevision };
}

test.describe.configure({ mode: "serial" });

test("Website Publish succeeds, preserves test-only language, retries failures, and requires explicit newer-version publish", async ({ browser }) => {
  test.setTimeout(120000);
  setup();
  const page = await actorPage(browser, "learner_A1");
  const reviewer = await actorPage(browser, "instructor_A_authorized", "instructor");
  const source = await finalizeWebsite(page, reviewer);

  let failNextPublish = true;
  await page.route("**/deployments/from-studio-delivery", async (route) => {
    if (failNextPublish && route.request().method() === "POST") {
      failNextPublish = false;
      return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ ok: false, error: { code: "TEST_PROVIDER_FAILURE", message: "Test provider failure" } }) });
    }
    return route.continue();
  });
  await expect(page.getByRole("heading", { name: "Publish a Test Version" })).toBeVisible();
  await expect(page.getByText("Public website hosting is not connected yet.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Publish", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Publish Failed");
  await page.unroute("**/deployments/from-studio-delivery");
  await page.getByRole("button", { name: "Try Again" }).click();
  await expect(page.locator(".studio-deploymentLive strong")).toBeVisible();
  await expect(page.getByText("Public hosting: Not connected", { exact: true })).toBeVisible();
  await expect(page.getByText(`Published revision ${source.revision} in the Studio test environment.`)).toBeVisible();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".studio-deploymentLive strong")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Visit Site");

  const workspace = await apiJson(page, "learner_A1", `/studio/projects/${source.projectId}/workspace`);
  workspace.data.work.pages[0].content = "New finalized test version.";
  await apiJson(page, "learner_A1", `/studio/projects/${source.projectId}/workspace`, { method: "PATCH", data: { revision: workspace.data.revision, work: workspace.data.work } });
  await apiJson(page, "learner_A1", `/studio/projects/${source.projectId}/qa`, { method: "POST", data: {} });
  await apiJson(page, "learner_A1", `/studio/projects/${source.projectId}/review-submissions`, { method: "POST", data: {} });
  const nextReview = await apiJson(page, "learner_A1", `/studio/projects/${source.projectId}/review/current`);
  await reviewer.goto(`${frontend}/curriculum.html#/studio/review/${source.projectId}/${nextReview.data.submission.submissionId}`, { waitUntil: "domcontentloaded" });
  await reviewer.getByRole("button", { name: "Approve" }).click();
  await page.bringToFront();
  await apiJson(page, "learner_A1", `/studio/projects/${source.projectId}/finalize`, { method: "POST", data: {} });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText(/A newer finalized version, revision \d+, is ready to publish\./)).toBeVisible();
  await expect(page.getByRole("button", { name: "Publish New Version" })).toBeVisible();
  await page.getByRole("button", { name: "Publish New Version" }).click();
  await expect(page.locator(".studio-deploymentLive strong")).toBeVisible();
  await expect(page.getByText(/Test Deployment Live · Revision 1 · Test environment/)).toBeVisible();
  await expect(page.getByText(/Test Deployment Live · Revision 2 · Test environment/)).toBeVisible();

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.reload({ waitUntil: "domcontentloaded" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.reload({ waitUntil: "domcontentloaded" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole("heading", { name: "Publish a Test Version" })).toBeVisible();
  await page.close();
  await reviewer.close();
});
