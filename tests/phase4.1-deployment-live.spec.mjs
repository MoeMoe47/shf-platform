import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!frontend || !api || !database) throw new Error("Phase 4.1 acceptance requires the disposable environment.");

const token = (id) => `Bearer dev-token:${id}`;
const headers = (id) => ({ Authorization: token(id), "Content-Type": "application/json" });

async function actorPage(browser, id, role = "student") {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(({ id: userId, role: userRole }) => { window.__user = { id: userId, role: userRole, email: `${userId}@phase4.test`, name: userId }; }, { id, role });
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

function enableDeploymentPermissions() {
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", `
    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('phase41_student_studio_create','phase8_role_student','studio.project.create'),
      ('phase41_student_studio_view','phase8_role_student','studio.project.view'),
      ('phase41_student_studio_update','phase8_role_student','studio.project.update'),
      ('phase41_student_studio_finalize','phase8_role_student','studio.project.finalize'),
      ('phase41_student_deploy_create','phase8_role_student','website.deployment.create'),
      ('phase41_student_deploy_view','phase8_role_student','website.deployment.view')
    ON CONFLICT DO NOTHING;
    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('phase41_instructor_deploy_manage','phase8_role_instructor','website.deployment.manage'),
      ('phase41_instructor_deploy_view','phase8_role_instructor','website.deployment.view')
    ON CONFLICT DO NOTHING;
    INSERT INTO curriculum_evidence_rules
      (evidence_rule_id, organization_id, source_type, evidence_type, truth_fact_type, competency_id, rule_version, review_required, created_by_user_id)
    VALUES ('phase41_studio_rule', 'phase8_org_a', 'STUDIO_DELIVERY', 'STUDIO_PROJECT_FINALIZED', NULL,
      'competency_prepare_prove_monitoring_finding', 1, true, 'admin_A')
    ON CONFLICT DO NOTHING;
  `], { encoding: "utf8" });
}

async function finalizeWebsite(page, reviewer) {
  const created = await apiJson(page, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title: "Phase 4.1 Website" } });
  expect(created.response.status()).toBe(201);
  const projectId = created.data.projectId;
  await page.goto(`${frontend}/curriculum.html#/studio/projects/${projectId}/build`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Page title").fill("Deployment Home");
  await page.getByLabel("Page content").fill("A deterministic test deployment.");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Check My Project" }).click();
  await expect(page.getByText("Looks good")).toBeVisible();
  const submit = page.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith(`/studio/projects/${projectId}/review-submissions`));
  await page.getByRole("button", { name: "Submit for Review" }).click();
  expect((await submit).status()).toBe(201);
  const review = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/review/current`);
  await reviewer.goto(`${frontend}/curriculum.html#/studio/review/${projectId}/${review.data.submission.submissionId}`, { waitUntil: "domcontentloaded" });
  const decisionResponse = reviewer.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith(`/studio/projects/${projectId}/review-submissions/${review.data.submission.submissionId}/decision`));
  await reviewer.getByRole("button", { name: "Approve" }).click();
  expect((await decisionResponse).status()).toBe(200);
  await page.bringToFront();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Finalize Project" }).click();
  await expect(page.getByText("Finalized", { exact: true })).toBeVisible();
  const status = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/institutional-status`);
  return { projectId, deliveryId: status.data.delivery.deliveryRecordId, revision: status.data.delivery.workspaceRevision };
}

test.describe.configure({ mode: "serial" });

test("live Website deployment API creates one exact-revision TEST deployment", async ({ browser }) => {
  enableDeploymentPermissions();
  const page = await actorPage(browser, "learner_A1");
  const reviewer = await actorPage(browser, "instructor_A_authorized", "instructor");
  const source = await finalizeWebsite(page, reviewer);

  const first = await apiJson(page, "learner_A1", "/deployments/from-studio-delivery", { method: "POST", data: { deliveryId: source.deliveryId } });
  expect(first.response.status()).toBe(201);
  expect(first.data.deployment.status).toBe("LIVE");
  expect(first.data.deployment.projectType).toBe("WEBSITE");
  expect(first.data.deployment.workspaceRevision).toBe(source.revision);
  expect(first.data.deployment.target).toBe("TEST");
  expect(first.data.deployment.providerKey).toBe("local_mock");
  expect(first.data.deployment.liveUrl).toBeNull();
  const deploymentId = first.data.deployment.deploymentId;

  const duplicate = await apiJson(page, "learner_A1", "/deployments/from-studio-delivery", { method: "POST", data: { deliveryId: source.deliveryId } });
  expect(duplicate.response.status()).toBe(201);
  expect(duplicate.data.idempotent).toBe(true);
  expect(duplicate.data.deployment.deploymentId).toBe(deploymentId);

  const concurrent = await Promise.all(Array.from({ length: 3 }, () => apiJson(page, "learner_A1", "/deployments/from-studio-delivery", { method: "POST", data: { deliveryId: source.deliveryId } })));
  expect(concurrent.every((item) => item.response.ok())).toBe(true);
  expect(new Set(concurrent.map((item) => item.data.deployment.deploymentId)).size).toBe(1);

  const detail = await apiJson(page, "learner_A1", `/deployments/${deploymentId}`);
  expect(detail.response.status()).toBe(200);
  expect(detail.data.workspaceRevision).toBe(source.revision);
  const history = await apiJson(page, "learner_A1", `/studio/projects/${source.projectId}/deployments`);
  expect(history.response.status()).toBe(200);
  expect(history.data.items).toHaveLength(1);

  const revision = await apiJson(page, "learner_A1", `/studio/projects/${source.projectId}/workspace`);
  const work = revision.data.work;
  work.pages[0].content = "A newer workspace revision is not automatically deployed.";
  const newer = await apiJson(page, "learner_A1", `/studio/projects/${source.projectId}/workspace`, { method: "PATCH", data: { revision: revision.data.revision, work } });
  expect(newer.response.status()).toBe(200);
  const afterEdit = await apiJson(page, "learner_A1", `/deployments/${deploymentId}`);
  expect(afterEdit.data.status).toBe("LIVE");
  expect(afterEdit.data.workspaceRevision).toBe(source.revision);

  const sameOrgOtherLearner = await apiJson(page, "learner_A2", `/deployments/${deploymentId}`);
  expect([403, 404]).toContain(sameOrgOtherLearner.response.status());
  const foreign = await apiJson(page, "learner_B1", `/deployments/${deploymentId}`);
  expect([403, 404]).toContain(foreign.response.status());
  const forged = await apiJson(page, "learner_A1", "/deployments/from-studio-delivery", { method: "POST", data: { deliveryId: source.deliveryId, projectType: "AI_AGENT", status: "LIVE", liveUrl: "https://public.invalid" } });
  expect(forged.response.status()).toBe(400);

  await page.close();
  await reviewer.close();
});

test("live Website deployment API rejects AI Agent delivery and foreign create", async ({ browser }) => {
  enableDeploymentPermissions();
  const page = await actorPage(browser, "learner_A1");
  const reviewer = await actorPage(browser, "instructor_A_authorized", "instructor");
  const created = await apiJson(page, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "AI_AGENT", title: "Phase 4.1 Agent" } });
  expect(created.response.status()).toBe(201);
  const agent = created.data.projectId;
  await page.goto(`${frontend}/curriculum.html#/studio/projects/${agent}/build`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Agent name").fill("Safe Agent");
  await page.getByLabel("Instructions").fill("Explain safely.");
  await page.getByRole("button", { name: "Save draft" }).click();
  await page.getByRole("button", { name: "Check My Project" }).click();
  await expect(page.getByText("Looks good")).toBeVisible();
  const agentSubmit = page.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith(`/studio/projects/${agent}/review-submissions`));
  await page.getByRole("button", { name: "Submit for Review" }).click();
  expect((await agentSubmit).status()).toBe(201);
  const review = await apiJson(page, "learner_A1", `/studio/projects/${agent}/review/current`);
  await reviewer.goto(`${frontend}/curriculum.html#/studio/review/${agent}/${review.data.submission.submissionId}`, { waitUntil: "domcontentloaded" });
  const agentDecision = reviewer.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith(`/studio/projects/${agent}/review-submissions/${review.data.submission.submissionId}/decision`));
  await reviewer.getByRole("button", { name: "Approve" }).click();
  expect((await agentDecision).status()).toBe(200);
  await page.bringToFront();
  await page.reload({ waitUntil: "domcontentloaded" });
  const agentFinalize = page.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith(`/studio/projects/${agent}/finalize`));
  await page.getByRole("button", { name: "Finalize Project" }).click();
  expect((await agentFinalize).status()).toBe(201);
  const status = await apiJson(page, "learner_A1", `/studio/projects/${agent}/institutional-status`);
  const attempted = await apiJson(page, "learner_A1", "/deployments/from-studio-delivery", { method: "POST", data: { deliveryId: status.data.delivery.deliveryRecordId } });
  expect([400, 403]).toContain(attempted.response.status());
  const foreignCreate = await apiJson(page, "learner_B1", "/deployments/from-studio-delivery", { method: "POST", data: { deliveryId: status.data.delivery.deliveryRecordId } });
  expect([400, 403, 404]).toContain(foreignCreate.response.status());
  await page.close();
  await reviewer.close();
});
