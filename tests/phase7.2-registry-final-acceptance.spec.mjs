import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
const scenario = process.env.SHS_TEST_REGISTRY_SCENARIO || "ACCEPTED";
const closure = process.env.SHS_PHASE73_CLOSURE === "1";
if (!frontend || !api || !database) throw new Error("Phase 7.2 acceptance requires the disposable environment.");
const bearer = (id) => `Bearer dev-token:${id}`;
async function apiJson(page, id, path, options = {}) {
  const response = await page.request.fetch(`${api}${path}`, { ...options, headers: { Authorization: bearer(id), "Content-Type": "application/json", ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  return { response, body, data: body.data ?? body };
}
function sql(statement) { return execFileSync("psql", [database, "-X", "-At", "-v", "ON_ERROR_STOP=1", "-c", statement], { encoding: "utf8" }).trim(); }
function statusText(status) { return ({ SUBMITTED: "Submitted to Registry", UNDER_REVIEW: "Under Review", ACCEPTED: "Accepted by Test Registry", CHANGES_REQUIRED: "Changes Requested", REJECTED: "Rejected by Test Registry", FAILED: "Submission Failed" })[status]; }
function authoritySnapshot() { return sql(`SELECT json_build_object(
  'projects',(SELECT COUNT(*) FROM projects),
  'workspaces',(SELECT COUNT(*) FROM studio_builder_workspaces),
  'qa',(SELECT COUNT(*) FROM studio_qa_runs),
  'reviews',(SELECT COUNT(*) FROM studio_review_submissions),
  'review_decisions',(SELECT COUNT(*) FROM studio_review_decisions),
  'deliveries',(SELECT COUNT(*) FROM studio_delivery_records),
  'packages',(SELECT COUNT(*) FROM studio_agent_packages),
  'evidence',(SELECT COUNT(*) FROM prepare_prove_evidence),
  'truth',(SELECT COUNT(*) FROM curriculum_truth_facts),
  'completion',(SELECT COUNT(*) FROM curriculum_lesson_completions),
  'portfolio_profiles',(SELECT COUNT(*) FROM portfolio_profiles),
  'portfolio_artifacts',(SELECT COUNT(*) FROM portfolio_artifacts),
  'deployments',(SELECT COUNT(*) FROM website_deployment_records),
  'credentials',(SELECT COUNT(*) FROM learner_credentials)
)::text`); }
function setup() {
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", `
    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('phase72_student_create','phase8_role_student','studio.project.create'),('phase72_student_view','phase8_role_student','studio.project.view'),('phase72_student_update','phase8_role_student','studio.project.update'),('phase72_student_finalize','phase8_role_student','studio.project.finalize'),('phase72_student_agent_create','phase8_role_student','agent.package.create'),('phase72_student_agent_view','phase8_role_student','agent.package.view'),('phase72_student_registry_submit','phase8_role_student','agent.registry.submit'),('phase72_student_registry_view','phase8_role_student','agent.registry.view'),('phase72_instructor_review','phase8_role_instructor','project.submission.review') ON CONFLICT DO NOTHING;
  `], { encoding: "utf8" });
}
async function pageFor(browser, id, role = "student", viewport = { width: 1440, height: 900 }) {
  const page = await browser.newPage({ viewport });
  await page.addInitScript(({ userId, userRole }) => { window.__user = { id: userId, role: userRole, email: `${userId}@phase72.test`, name: userId }; }, { userId: id, userRole: role });
  await page.route("**/*", async (route) => { const request = route.request(); if (["fetch", "xhr"].includes(request.resourceType())) return route.continue({ headers: { ...request.headers(), authorization: bearer(id) } }); return route.continue(); });
  return page;
}
async function finalizeAssignmentAgent(page, reviewer) {
  const handoff = await apiJson(page, "learner_A1", "/studio/handoffs/assignment", { method: "POST", data: { assignmentId: "phase8_assignment_a", projectType: "AI_AGENT", title: "Phase 7.2 Assignment Agent" } });
  expect(handoff.response.status()).toBe(201);
  const projectId = handoff.data.projectId;
  const workspace = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/workspace`);
  const saved = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/workspace`, { method: "PATCH", data: { revision: workspace.data.revision, work: { name: "Assignment Registry helper", instructions: "Help safely and request human review for sensitive actions.", tools: [] } } });
  expect(saved.response.status()).toBe(200);
  expect((await apiJson(page, "learner_A1", `/studio/projects/${projectId}/qa`, { method: "POST", data: {} })).response.status()).toBe(201);
  expect((await apiJson(page, "learner_A1", `/studio/projects/${projectId}/review-submissions`, { method: "POST", data: {} })).response.status()).toBe(201);
  const review = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/review/current`);
  expect((await apiJson(reviewer, "instructor_A_authorized", `/studio/projects/${projectId}/review-submissions/${review.data.submission.submissionId}/decision`, { method: "POST", data: { decision: "APPROVED", feedback: "Approved." } })).response.status()).toBe(200);
  expect((await apiJson(page, "learner_A1", `/studio/projects/${projectId}/finalize`, { method: "POST", data: {} })).response.status()).toBe(201);
  const packaged = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/agent-packages`, { method: "POST", data: {} });
  expect(packaged.data.package.registryReadiness).toBe("READY_FOR_REGISTRY");
  return { projectId, package: packaged.data.package };
}

test(`Phase 7.2 ${scenario} completion, authorization, and responsive acceptance`, async ({ browser }) => {
  test.setTimeout(120000);
  setup();
  const page = await pageFor(browser, "learner_A1");
  const reviewer = await pageFor(browser, "instructor_A_authorized", "instructor");
  const before = sql("SELECT (SELECT COUNT(*) FROM curriculum_lesson_completions),(SELECT COUNT(*) FROM integration_outbox WHERE event_type LIKE 'completion.%')");
  const source = await finalizeAssignmentAgent(page, reviewer);
  const project = await apiJson(page, "learner_A1", `/studio/projects/${source.projectId}`);
  expect(project.data.assignmentId).toBe("phase8_assignment_a");
  const authorityBefore = authoritySnapshot();
  let submitted;
  if (closure && (scenario === "ACCEPTED" || scenario === "CHANGES_REQUIRED")) {
    await page.goto(`${frontend}/curriculum.html#/studio/projects/${source.projectId}/build`, { waitUntil: "domcontentloaded" });
    const submitButton = page.getByRole("button", { name: "Submit to Registry" });
    await expect(submitButton).toBeVisible();
    const readyTree = await page.locator("body").ariaSnapshot();
    expect(readyTree).toContain("Ready for Registry");
    expect(readyTree).toContain("Submit to Registry");
    await submitButton.focus();
    expect(await submitButton.evaluate((element) => document.activeElement === element)).toBe(true);
    const submitResponse = page.waitForResponse((response) => response.url().includes("/registry-submissions") && response.request().method() === "POST");
    await page.keyboard.press(scenario === "ACCEPTED" ? "Enter" : "Space");
    expect((await submitResponse).status()).toBe(201);
    const history = await apiJson(page, "learner_A1", `/agent-packages/${source.package.packageId}/registry-submissions`);
    submitted = { ...history, response: { status: () => 201 }, data: { submission: history.data.items[0] } };
  } else {
    submitted = await apiJson(page, "learner_A1", `/agent-packages/${source.package.packageId}/registry-submissions`, { method: "POST", data: {} });
  }
  const expectedStatus = scenario === "FAILED_ONCE" || scenario === "FAILED" ? "FAILED" : scenario;
  if (scenario === "FAILED_ONCE" || scenario === "FAILED") {
    expect(submitted.response.status()).toBe(409);
    const failedList = await apiJson(page, "learner_A1", `/agent-packages/${source.package.packageId}/registry-submissions`);
    expect(failedList.data.items[0].status).toBe("FAILED");
    submitted.data.submission = failedList.data.items[0];
    if (scenario === "FAILED_ONCE") {
      await page.goto(`${frontend}/curriculum.html#/studio/projects/${source.projectId}/build`, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("alert")).toContainText("Submission Failed");
      const retryButton = page.getByRole("button", { name: "Retry Registry Submission" });
      await expect(retryButton).toBeVisible();
      await retryButton.focus();
      expect(await retryButton.evaluate((element) => document.activeElement === element)).toBe(true);
      const retryResponse = page.waitForResponse((response) => response.url().includes(`/registry-submissions/${submitted.data.submission.submissionId}/retry`) && response.request().method() === "POST");
      await page.keyboard.press("Enter");
      expect((await retryResponse).status()).toBe(201);
      await expect(page.getByText("Accepted by Test Registry", { exact: true })).toBeVisible();
    }
  } else {
    expect(submitted.response.status()).toBe(201);
    expect(submitted.data.submission.status).toBe(expectedStatus);
  }
  if (scenario === "FAILED_ONCE" && !closure) {
    const retry = await apiJson(page, "learner_A1", `/registry-submissions/${submitted.data.submission.submissionId}/retry`, { method: "POST", data: {} });
    expect(retry.response.status()).toBe(201);
    expect(retry.data.submission.status).toBe("ACCEPTED");
    expect(retry.data.submission.resubmissionOf).toBe(submitted.data.submission.submissionId);
  }
  if (closure && scenario === "FAILED") {
    await page.goto(`${frontend}/curriculum.html#/studio/projects/${source.projectId}/build`, { waitUntil: "domcontentloaded" });
    const retryButton = page.getByRole("button", { name: "Retry Registry Submission" });
    await retryButton.focus();
    const retryResponse = page.waitForResponse((response) => response.url().includes(`/registry-submissions/${submitted.data.submission.submissionId}/retry`) && response.request().method() === "POST");
    await page.keyboard.press("Space");
    expect((await retryResponse).status()).toBe(409);
    await expect(page.getByText("Submission Failed", { exact: true })).toBeVisible({ timeout: 10000 });
  }
  if (closure) {
    const mismatchedHeaders = { "x-shs-organization-id": "phase8_org_b" };
    const mismatchedSubmit = await apiJson(page, "learner_A1", `/agent-packages/${source.package.packageId}/registry-submissions`, { method: "POST", data: {}, headers: mismatchedHeaders });
    expect([403, 404]).toContain(mismatchedSubmit.response.status());
    const mismatchedRead = await apiJson(page, "learner_A1", `/registry-submissions/${submitted.data.submission.submissionId}`, { headers: mismatchedHeaders });
    expect([403, 404]).toContain(mismatchedRead.response.status());
    const mismatchedHistory = await apiJson(page, "learner_A1", `/agent-packages/${source.package.packageId}/registry-submissions`, { headers: mismatchedHeaders });
    expect([403, 404]).toContain(mismatchedHistory.response.status());
    const mismatchedRetry = await apiJson(page, "learner_A1", `/registry-submissions/${submitted.data.submission.submissionId}/retry`, { method: "POST", data: {}, headers: mismatchedHeaders });
    expect([403, 404]).toContain(mismatchedRetry.response.status());
    if (scenario === "FAILED") {
      const retries = await Promise.all(Array.from({ length: 3 }, () => apiJson(page, "learner_A1", `/registry-submissions/${submitted.data.submission.submissionId}/retry`, { method: "POST", data: {} })));
      expect(retries.every(({ response }) => [201, 409].includes(response.status()))).toBe(true);
      const history = await apiJson(page, "learner_A1", `/agent-packages/${source.package.packageId}/registry-submissions`);
      expect(history.data.items.length).toBeLessThanOrEqual(2);
      expect(history.data.items.filter((item) => item.status === "FAILED").length).toBeLessThanOrEqual(2);
    }
  }
  const foreign = await apiJson(page, "learner_B1", `/agent-packages/${source.package.packageId}/registry-submissions`, { method: "POST", data: {} });
  expect([403, 404]).toContain(foreign.response.status());
  const after = sql("SELECT (SELECT COUNT(*) FROM curriculum_lesson_completions),(SELECT COUNT(*) FROM integration_outbox WHERE event_type LIKE 'completion.%')");
  expect(after).toBe(before);
  expect(authoritySnapshot()).toBe(authorityBefore);
  await page.goto(`${frontend}/curriculum.html#/studio/projects/${source.projectId}/build`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Registry History" })).toBeVisible();
  const historyItems = page.getByRole("listitem");
  expect(await historyItems.count()).toBeGreaterThan(0);
  const historyText = await historyItems.allTextContents();
  expect(historyText.some((item) => item.includes("Package v1"))).toBe(true);
  expect(historyText.some((item) => item.includes(statusText(expectedStatus)))).toBe(true);
  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${frontend}/curriculum.html#/studio/projects/${source.projectId}/build`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Registry", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Agent Package" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const status = await page.getByRole("status").first().or(page.getByRole("alert").first()).count();
    expect(status).toBeGreaterThan(0);
    const accessibilityTree = await page.locator("body").ariaSnapshot();
    expect(accessibilityTree).toContain("Registry");
    expect(accessibilityTree).toMatch(/status|alert/);
    expect(accessibilityTree).toContain(statusText(expectedStatus));
  }
  await expect(page.getByRole("heading", { name: "Agent Package" })).toBeVisible();
  const controls = page.locator("button, a[href], input, textarea, select, [tabindex]:not([tabindex='-1'])");
  const controlCount = await controls.count();
  let focusedControlCount = 0;
  for (let index = 0; index < Math.min(controlCount, 24); index += 1) {
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement && document.activeElement !== document.body);
    if (!focused) break;
    focusedControlCount += 1;
  }
  expect(focusedControlCount).toBeGreaterThan(0);
  await page.close(); await reviewer.close();
});
