import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!frontend || !api || !database) throw new Error("Phase 4.2 acceptance requires the disposable environment.");
const token = (id) => `Bearer dev-token:${id}`;

async function apiJson(page, id, path, options = {}) {
  const response = await page.request.fetch(`${api}${path}`, { ...options, headers: { Authorization: token(id), "Content-Type": "application/json", ...(options.tenant ? { "x-tenant-id": options.tenant } : {}), ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  return { response, body, data: body.data ?? body };
}

async function pageFor(browser, id, role = "student") {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(({ id: userId, role: userRole }) => { window.__user = { id: userId, role: userRole, email: `${userId}@phase42.test`, name: userId }; }, { id, role });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (["fetch", "xhr"].includes(request.resourceType())) return route.continue({ headers: { ...request.headers(), authorization: token(id) } });
    return route.continue();
  });
  return page;
}

function setup() {
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", `
    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('phase42_student_studio_create','phase8_role_student','studio.project.create'),('phase42_student_studio_view','phase8_role_student','studio.project.view'),('phase42_student_studio_update','phase8_role_student','studio.project.update'),('phase42_student_studio_finalize','phase8_role_student','studio.project.finalize'),('phase42_student_deploy_create','phase8_role_student','website.deployment.create'),('phase42_student_deploy_view','phase8_role_student','website.deployment.view'),('phase42_instructor_deploy_view','phase8_role_instructor','website.deployment.view'),('phase42_instructor_deploy_manage','phase8_role_instructor','website.deployment.manage') ON CONFLICT DO NOTHING;
    INSERT INTO curriculum_evidence_rules (evidence_rule_id, organization_id, source_type, evidence_type, truth_fact_type, competency_id, rule_version, review_required, created_by_user_id) VALUES ('phase42_studio_rule','phase8_org_a','STUDIO_DELIVERY','STUDIO_PROJECT_FINALIZED',NULL,'competency_prepare_prove_monitoring_finding',1,true,'admin_A') ON CONFLICT DO NOTHING;
  `], { encoding: "utf8" });
}

function snapshot() {
  return execFileSync("psql", [database, "-X", "-At", "-F", "|", "-c", `SELECT (SELECT COUNT(*) FROM website_deployment_records),(SELECT COUNT(*) FROM integration_outbox WHERE event_type LIKE 'deployment.%'),(SELECT COUNT(*) FROM projects WHERE studio_origin IS NOT NULL),(SELECT COUNT(*) FROM studio_builder_workspaces),(SELECT COUNT(*) FROM studio_qa_runs),(SELECT COUNT(*) FROM studio_review_submissions),(SELECT COUNT(*) FROM studio_delivery_records),(SELECT COUNT(*) FROM prepare_prove_evidence),(SELECT COUNT(*) FROM curriculum_lesson_completions),(SELECT COUNT(*) FROM learner_credentials),(SELECT COUNT(*) FROM portfolio_artifacts)`], { encoding: "utf8" }).trim().split("|").map(Number);
}

function events() {
  return execFileSync("psql", [database, "-X", "-At", "-F", "|", "-c", "SELECT event_type,subject_id,organization_id,payload_json->>'tenant_id',payload_json->'payload'->>'workspace_revision',idempotency_key FROM integration_outbox WHERE event_type LIKE 'deployment.%' ORDER BY created_at,outbox_event_id"], { encoding: "utf8" }).trim().split("\n").filter(Boolean).map((line) => line.split("|"));
}

async function finalizeWebsite(page, reviewer, title) {
  const created = await apiJson(page, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title } });
  expect(created.response.status()).toBe(201);
  const projectId = created.data.projectId;
  await page.goto(`${frontend}/curriculum.html#/studio/projects/${projectId}/build`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Page title").fill(`${title} Home`);
  await page.getByLabel("Page content").fill("A controlled deployment acceptance website.");
  await page.getByRole("button", { name: "Save draft" }).click();
  await page.getByRole("button", { name: "Check My Project" }).click();
  await expect(page.getByText("Looks good")).toBeVisible();
  const submissionResponse = page.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith(`/studio/projects/${projectId}/review-submissions`));
  await page.getByRole("button", { name: "Submit for Review" }).click();
  const submission = await submissionResponse;
  expect(submission.status()).toBe(201);
  const submissionBody = await submission.json();
  const submissionId = submissionBody.data?.submissionId || submissionBody.data?.submission?.submissionId;
  expect(submissionId).toBeTruthy();
  await reviewer.goto(`${frontend}/curriculum.html#/studio/review/${projectId}/${submissionId}`, { waitUntil: "domcontentloaded" });
  const decisionResponse = reviewer.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith(`/studio/projects/${projectId}/review-submissions/${submissionId}/decision`));
  await reviewer.getByRole("button", { name: "Approve" }).click();
  expect((await decisionResponse).status()).toBe(200);
  await expect(reviewer.getByText("Review decision recorded.")).toBeVisible();
  await page.bringToFront();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Finalize Project" }).click();
  await expect(page.getByText("Finalized", { exact: true })).toBeVisible();
  const status = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/institutional-status`);
  return { projectId, deliveryId: status.data.delivery.deliveryRecordId, revision: status.data.delivery.workspaceRevision };
}

test("live failure, retry races, tenant denial, snapshots, and newer revision binding", async ({ browser }) => {
  test.setTimeout(120000);
  setup();
  const page = await pageFor(browser, "learner_A1");
  const reviewer = await pageFor(browser, "instructor_A_authorized", "instructor");
  const source = await finalizeWebsite(page, reviewer, "Phase 4.2 Website");
  const before = snapshot();

  const failedRequest = await apiJson(page, "learner_A1", "/deployments/from-studio-delivery", { method: "POST", data: { deliveryId: source.deliveryId } });
  expect(failedRequest.response.status()).toBe(400);
  const failedHistory = await apiJson(page, "learner_A1", `/studio/projects/${source.projectId}/deployments`);
  expect(failedHistory.data.items).toHaveLength(1);
  const failed = failedHistory.data.items[0];
  expect(failed.status).toBe("FAILED");
  const afterFailure = snapshot();
  expect(afterFailure[0]).toBe(before[0] + 1);
  expect(afterFailure.slice(2)).toEqual(before.slice(2));
  expect(events().some((event) => event[0] === "deployment.failed" && event[1] === failed.deploymentId)).toBe(true);
  expect(events().some((event) => event[0] === "deployment.live" && event[1] === failed.deploymentId)).toBe(false);

  const retries = await Promise.all([
    apiJson(page, "learner_A1", `/deployments/${failed.deploymentId}/retry`, { method: "POST", data: {} }),
    apiJson(page, "learner_A1", `/deployments/${failed.deploymentId}/retry`, { method: "POST", data: {} }),
  ]);
  expect(retries.every((item) => item.response.ok())).toBe(true);
  expect(new Set(retries.map((item) => item.data.deployment.deploymentId)).size).toBe(1);
  const live = retries[0].data.deployment;
  expect(live.status).toBe("LIVE");
  expect(live.workspaceRevision).toBe(source.revision);
  expect(live.liveUrl).toBeNull();
  const afterRetry = await apiJson(page, "learner_A1", `/studio/projects/${source.projectId}/deployments`);
  expect(afterRetry.data.items.some((item) => item.deploymentId === failed.deploymentId && item.status === "FAILED")).toBe(true);
  expect(events().filter((event) => event[0] === "deployment.live" && event[1] === live.deploymentId)).toHaveLength(1);

  for (const action of [
    () => apiJson(page, "learner_A1", `/deployments/${live.deploymentId}`, { headers: { "x-shs-organization-id": "phase8_org_b" } }),
    () => apiJson(page, "learner_A1", "/deployments/from-studio-delivery", { method: "POST", data: { deliveryId: source.deliveryId }, headers: { "x-shs-organization-id": "phase8_org_b" } }),
    () => apiJson(page, "learner_A1", `/deployments/${failed.deploymentId}/retry`, { method: "POST", data: {}, headers: { "x-shs-organization-id": "phase8_org_b" } }),
  ]) expect([403, 404]).toContain((await action()).response.status());

  const workspace = await apiJson(page, "learner_A1", `/studio/projects/${source.projectId}/workspace`);
  workspace.data.work.pages[0].content = "A newer finalized revision.";
  const updated = await apiJson(page, "learner_A1", `/studio/projects/${source.projectId}/workspace`, { method: "PATCH", data: { revision: workspace.data.revision, work: workspace.data.work } });
  expect(updated.response.status()).toBe(200);
  await apiJson(page, "learner_A1", `/studio/projects/${source.projectId}/qa`, { method: "POST", data: {} });
  await apiJson(page, "learner_A1", `/studio/projects/${source.projectId}/review-submissions`, { method: "POST", data: {} });
  const nextReview = await apiJson(page, "learner_A1", `/studio/projects/${source.projectId}/review/current`);
  const nextSubmissionId = nextReview.data.submission.submissionId;
  await reviewer.goto(`${frontend}/curriculum.html#/studio/review/${source.projectId}/${nextSubmissionId}`, { waitUntil: "domcontentloaded" });
  const nextDecisionResponse = reviewer.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith(`/studio/projects/${source.projectId}/review-submissions/${nextSubmissionId}/decision`));
  await reviewer.getByRole("button", { name: "Approve" }).click();
  expect((await nextDecisionResponse).status()).toBe(200);
  await expect(reviewer.getByText("Review decision recorded.")).toBeVisible();
  await page.bringToFront();
  const newerFinalize = await apiJson(page, "learner_A1", `/studio/projects/${source.projectId}/finalize`, { method: "POST", data: {} });
  expect(newerFinalize.response.status()).toBe(201);
  const newerStatus = await apiJson(page, "learner_A1", `/studio/projects/${source.projectId}/institutional-status`);
  const newerRevision = Number(workspace.data.revision) + 1;
  expect(newerStatus.data.delivery.workspaceRevision).toBe(newerRevision);
  const beforeExplicit = await apiJson(page, "learner_A1", `/studio/projects/${source.projectId}/deployments`);
  expect(beforeExplicit.data.items.some((item) => item.workspaceRevision === newerRevision)).toBe(false);
  const explicit = await apiJson(page, "learner_A1", "/deployments/from-studio-delivery", { method: "POST", data: { deliveryId: newerStatus.data.delivery.deliveryRecordId } });
  expect(explicit.response.status()).toBe(201);
  expect(explicit.data.deployment.status).toBe("LIVE");
  expect(explicit.data.deployment.workspaceRevision).toBe(newerRevision);
  expect(explicit.data.deployment.liveUrl).toBeNull();
  expect((await apiJson(page, "learner_A1", `/deployments/${live.deploymentId}`)).data.workspaceRevision).toBe(source.revision);
  expect(events().every((event) => event[2] === "phase8_org_a" && event[3] === "tenant:phase8_org_a")).toBe(true);
  await page.close();
  await reviewer.close();
});
