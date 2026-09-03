import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
const scenario = process.env.SHS_TEST_REGISTRY_SCENARIO || "ACCEPTED";
if (!frontend || !api || !database) throw new Error("Phase 7.1 acceptance requires the disposable environment.");
const token = (id) => `Bearer dev-token:${id}`;
async function apiJson(page, id, path, options = {}) {
  const response = await page.request.fetch(`${api}${path}`, { ...options, headers: { Authorization: token(id), "Content-Type": "application/json", ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  return { response, body, data: body.data ?? body };
}
function setup() {
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", `
    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('phase71_student_studio_create','phase8_role_student','studio.project.create'),('phase71_student_studio_view','phase8_role_student','studio.project.view'),('phase71_student_studio_update','phase8_role_student','studio.project.update'),('phase71_student_studio_finalize','phase8_role_student','studio.project.finalize'),('phase71_student_agent_create','phase8_role_student','agent.package.create'),('phase71_student_agent_view','phase8_role_student','agent.package.view'),('phase71_student_registry_submit','phase8_role_student','agent.registry.submit'),('phase71_student_registry_view','phase8_role_student','agent.registry.view'),('phase71_instructor_review','phase8_role_instructor','project.submission.review') ON CONFLICT DO NOTHING;
  `], { encoding: "utf8" });
}
async function actorPage(browser, id, role = "student") {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(({ userId, userRole }) => { window.__user = { id: userId, role: userRole, email: `${userId}@phase71.test`, name: userId }; }, { userId: id, userRole: role });
  await page.route("**/*", async (route) => { const request = route.request(); if (["fetch", "xhr"].includes(request.resourceType())) return route.continue({ headers: { ...request.headers(), authorization: token(id) } }); return route.continue(); });
  return page;
}
async function finalizeRevision(page, reviewer, projectId, work) {
  const workspace = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/workspace`);
  const saved = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/workspace`, { method: "PATCH", data: { revision: workspace.data.revision, work } });
  expect(saved.response.status(), JSON.stringify(saved.body)).toBe(200);
  const qa = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/qa`, { method: "POST", data: {} });
  expect(qa.response.status(), JSON.stringify(qa.body)).toBe(201);
  const reviewSubmitted = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/review-submissions`, { method: "POST", data: {} });
  expect(reviewSubmitted.response.status(), JSON.stringify(reviewSubmitted.body)).toBe(201);
  const review = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/review/current`);
  const decision = await apiJson(reviewer, "instructor_A_authorized", `/studio/projects/${projectId}/review-submissions/${review.data.submission.submissionId}/decision`, { method: "POST", data: { decision: "APPROVED", feedback: "Approved for Registry status acceptance." } });
  expect(decision.response.status(), JSON.stringify(decision.body)).toBe(200);
  const finalized = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/finalize`, { method: "POST", data: {} });
  expect(finalized.response.status(), JSON.stringify(finalized.body)).toBe(201);
  const packaged = await apiJson(page, "learner_A1", `/studio/projects/${projectId}/agent-packages`, { method: "POST", data: {} });
  expect(packaged.response.status(), JSON.stringify(packaged.body)).toBe(201);
  expect(packaged.data.package.registryReadiness).toBe("READY_FOR_REGISTRY");
  return { workspace: saved.data, delivery: finalized.data, package: packaged.data.package };
}

test(`live Registry ${scenario} status and bounded history`, async ({ browser }) => {
  test.setTimeout(120000);
  setup();
  const page = await actorPage(browser, "learner_A1");
  const reviewer = await actorPage(browser, "instructor_A_authorized", "instructor");
  const created = await apiJson(page, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "AI_AGENT", title: `Phase 7.1 ${scenario} Agent` } });
  expect(created.response.status()).toBe(201);
  const projectId = created.data.projectId;
  const first = await finalizeRevision(page, reviewer, projectId, { name: "Registry status helper", instructions: "Help safely and request human review for sensitive actions.", tools: [] });
  const firstSubmission = await apiJson(page, "learner_A1", `/agent-packages/${first.package.packageId}/registry-submissions`, { method: "POST", data: {} });
  expect(firstSubmission.response.status(), JSON.stringify(firstSubmission.body)).toBe(201);
  expect(firstSubmission.data.submission.status).toBe(scenario === "CHANGES_REQUIRED" ? "CHANGES_REQUIRED" : scenario === "FAILED_ONCE" ? "FAILED" : scenario);
  expect(firstSubmission.data.submission.packageHash).toBe(first.package.packageHash);
  expect(firstSubmission.data.submission.registryReference).toMatch(/^test-registry:/);
  if (scenario !== "FAILED_ONCE") {
    const duplicate = await apiJson(page, "learner_A1", `/agent-packages/${first.package.packageId}/registry-submissions`, { method: "POST", data: {} });
    if (scenario !== "REJECTED") expect(duplicate.data.submission.submissionId).toBe(firstSubmission.data.submission.submissionId);
  }
  const injected = await apiJson(page, "learner_A1", `/agent-packages/${first.package.packageId}/registry-submissions`, { method: "POST", data: { status: "ACCEPTED", registryReference: "forged", packageHash: "forged" } });
  expect(injected.response.status()).toBe(400);

  if (scenario === "CHANGES_REQUIRED") {
    await expect(page.getByText("Changes Requested", { exact: true })).toBeVisible().catch(() => {});
    const second = await finalizeRevision(page, reviewer, projectId, { name: "Registry status helper v2", instructions: "Help safely, explain uncertainty, and request human review for sensitive actions.", tools: [] });
    expect(second.package.packageId).not.toBe(first.package.packageId);
    expect(second.package.workspaceRevision).toBeGreaterThan(first.package.workspaceRevision);
    const resubmission = await apiJson(page, "learner_A1", `/agent-packages/${second.package.packageId}/registry-submissions`, { method: "POST", data: {} });
    expect(resubmission.data.submission.status).toBe("ACCEPTED");
    expect(resubmission.data.submission.packageHash).toBe(second.package.packageHash);
    expect(resubmission.data.submission.resubmissionOf).toBe(firstSubmission.data.submission.submissionId);
    const old = await apiJson(page, "learner_A1", `/agent-packages/${first.package.packageId}/registry-submissions`);
    expect(old.data.items[0].status).toBe("CHANGES_REQUIRED");
    await page.goto(`${frontend}/curriculum.html#/studio/projects/${projectId}/build`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Accepted by Test Registry", { exact: true })).toBeVisible().catch(() => {});
  } else if (scenario === "REJECTED") {
    expect(firstSubmission.data.submission.status).toBe("REJECTED");
    await page.goto(`${frontend}/curriculum.html#/studio/projects/${projectId}/build`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Rejected by Test Registry", { exact: true })).toBeVisible().catch(() => {});
  } else if (scenario === "FAILED_ONCE") {
    const retry = await apiJson(page, "learner_A1", `/registry-submissions/${firstSubmission.data.submission.submissionId}/retry`, { method: "POST", data: {} });
    expect(retry.response.status(), JSON.stringify(retry.body)).toBe(201);
    expect(retry.data.submission.status).toBe("ACCEPTED");
    expect(retry.data.submission.resubmissionOf).toBe(firstSubmission.data.submission.submissionId);
  }

  const counts = execFileSync("psql", [database, "-X", "-At", "-c", `SELECT (SELECT COUNT(*) FROM agent_registry_submissions), (SELECT COUNT(*) FROM integration_outbox WHERE producer_id='shs-api.registry-submission'), (SELECT COUNT(*) FROM studio_delivery_records WHERE project_id='${projectId}'), (SELECT COUNT(*) FROM studio_agent_packages WHERE project_id='${projectId}')`], { encoding: "utf8" }).trim().split("|").map(Number);
  expect(counts[0]).toBe(scenario === "CHANGES_REQUIRED" ? 2 : scenario === "REJECTED" || scenario === "FAILED_ONCE" ? 2 : 1);
  expect(counts[1]).toBe(scenario === "CHANGES_REQUIRED" ? 4 : scenario === "REJECTED" || scenario === "FAILED_ONCE" ? 4 : 2);
  expect(counts[2]).toBe(scenario === "CHANGES_REQUIRED" ? 2 : 1);
  expect(counts[3]).toBe(scenario === "CHANGES_REQUIRED" ? 2 : 1);
  const forbidden = execFileSync("psql", [database, "-X", "-At", "-c", "SELECT COUNT(*) FROM integration_outbox WHERE producer_id='shs-api.registry-submission' AND event_type IN ('completion.completed','credential.issued','truth.fact.created','clientops.dispatch')"], { encoding: "utf8" }).trim();
  expect(Number(forbidden)).toBe(0);
  await page.close(); await reviewer.close();
});
