import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!frontend || !api || !database) throw new Error("Phase 10 browser acceptance requires the disposable environment.");
const token = (id) => `Bearer dev-token:${id}`;
const headers = (id) => ({ Authorization: token(id), "Content-Type": "application/json" });

async function actorPage(browser, id, role = "student", viewport = { width: 1440, height: 900 }) {
  const page = await browser.newPage({ viewport });
  await page.addInitScript(({ id, role }) => { window.__user = { role, email: `${id}@phase10.test`, name: id }; }, { id, role });
  await page.route("**/*", async (route) => route.continue({ headers: { ...route.request().headers(), authorization: token(id) } }));
  return page;
}

async function apiJson(page, id, path, options = {}) {
  const response = await page.request.fetch(`${api}${path}`, { ...options, headers: { ...headers(id), ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  return { response, body, data: body.data ?? body };
}

function enablePhase10Rule() {
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", "INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES ('phase10_student_studio_create','phase8_role_student','studio.project.create'),('phase10_student_studio_view','phase8_role_student','studio.project.view'),('phase10_student_studio_update','phase8_role_student','studio.project.update'),('phase10_student_studio_finalize','phase8_role_student','studio.project.finalize') ON CONFLICT DO NOTHING; INSERT INTO curriculum_evidence_rules (evidence_rule_id, organization_id, source_type, evidence_type, truth_fact_type, competency_id, rule_version, review_required, created_by_user_id) VALUES ('phase10_studio_rule_a','phase8_org_a','STUDIO_DELIVERY','STUDIO_PROJECT_FINALIZED',NULL,'competency_prepare_prove_monitoring_finding',1,true,'admin_A') ON CONFLICT DO NOTHING;"], { encoding: "utf8" });
}

test("finalized Website work enters canonical reviewable Evidence without completion or Portfolio claims", async ({ browser }) => {
  enablePhase10Rule();
  const student = await actorPage(browser, "learner_A1", "student", { width: 390, height: 900 });
  const reviewer = await actorPage(browser, "instructor_A_authorized", "instructor");
  const created = await apiJson(student, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title: "Phase 10 Evidence Website" } });
  expect(created.response.status()).toBe(201);
  const projectId = created.data.projectId;
  await student.goto(`${frontend}/curriculum.html#/studio/projects/${projectId}/build`, { waitUntil: "domcontentloaded" });
  await student.getByLabel("Page title").fill("Evidence Website");
  await student.getByLabel("Page content").fill("Finalized student work.");
  await student.getByRole("button", { name: "Save draft" }).click();
  await student.getByRole("button", { name: "Check My Project" }).click();
  await expect(student.getByText("Looks good")).toBeVisible();
  const submitResponse = student.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith(`/studio/projects/${projectId}/review-submissions`));
  await student.getByRole("button", { name: "Submit for Review" }).click();
  expect((await submitResponse).status()).toBe(201);
  const review = await apiJson(student, "learner_A1", `/studio/projects/${projectId}/review/current`);
  await reviewer.goto(`${frontend}/curriculum.html#/studio/review/${projectId}/${review.data.submission.submissionId}`, { waitUntil: "domcontentloaded" });
  await reviewer.getByRole("button", { name: "Approve" }).click();
  await student.reload({ waitUntil: "domcontentloaded" });
  await student.getByRole("button", { name: "Finalize Project" }).click();
  await expect(student.getByText("Finalized", { exact: true })).toBeVisible();
  await student.getByRole("button", { name: "Prepare Evidence" }).click();
  await expect(student.getByText(/Evidence is being processed/)).toBeVisible();
  const status = await apiJson(student, "learner_A1", `/studio/projects/${projectId}/institutional-status`);
  expect(status.data.evidence[0].status).toBe("REVIEWABLE");
  expect(status.data.portfolio.status).toBe("NOT_CONNECTED");
  expect(status.data.whatYouProved).toEqual([]);
  await expect(student.locator("body")).not.toContainText(/Completed|Credential|Published|Registry approved|Portfolio added/i);
  expect(await student.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await student.close();
  await reviewer.close();
});
