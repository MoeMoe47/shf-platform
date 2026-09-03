import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!frontend || !api || !database) throw new Error("Phase 3.2 acceptance requires the disposable environment.");

const token = (id) => `Bearer dev-token:${id}`;
const headers = (id) => ({ Authorization: token(id), "Content-Type": "application/json" });

async function actorPage(browser, id, role = "student", viewport = { width: 1440, height: 900 }) {
  const page = await browser.newPage({ viewport });
  await page.addInitScript(({ userId, userRole }) => {
    window.__user = { id: userId, role: userRole, email: `${userId}@phase3-2.test`, name: userId };
  }, { userId: id, userRole: role });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (["fetch", "xhr"].includes(request.resourceType())) {
      return route.continue({ headers: { ...request.headers(), authorization: token(id) } });
    }
    return route.continue();
  });
  return page;
}

async function apiJson(page, id, path, options = {}) {
  const response = await page.request.fetch(`${api}${path}`, {
    ...options,
    headers: { ...headers(id), ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  return { response, body, data: body.data ?? body };
}

function seedAssignmentFixture() {
  const sql = `
    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('phase32_student_create','phase8_role_student','studio.project.create'),
      ('phase32_student_view','phase8_role_student','studio.project.view'),
      ('phase32_student_update','phase8_role_student','studio.project.update'),
      ('phase32_student_finalize','phase8_role_student','studio.project.finalize'),
      ('phase32_instructor_view','phase8_role_instructor','studio.project.view')
    ON CONFLICT DO NOTHING;
    INSERT INTO curriculum_evidence_rules
      (evidence_rule_id, organization_id, source_type, evidence_type, truth_fact_type, competency_id, rule_version, review_required, created_by_user_id)
    VALUES ('phase32_studio_rule','phase8_org_a','STUDIO_DELIVERY','STUDIO_PROJECT_FINALIZED',NULL,
      'competency_prepare_prove_monitoring_finding',1,true,'admin_A')
    ON CONFLICT DO NOTHING;
    INSERT INTO completion_policies
      (policy_id, organization_id, curriculum_release_id, assigned_content_type, assigned_content_id, status, version, created_by_user_id, activated_by_user_id, activated_at)
    VALUES ('phase32_studio_policy','phase8_org_a','phase9_release_2','LESSON','unit-a:lesson-b','ACTIVE',1,'admin_A','admin_A',NOW())
    ON CONFLICT DO NOTHING;
    INSERT INTO completion_policy_requirements
      (requirement_id, policy_id, organization_id, requirement_type, target_reference, configuration, required, sequence)
    VALUES ('phase32_studio_requirement','phase32_studio_policy','phase8_org_a','STUDIO_PROJECT','pending-project','{"projectType":"WEBSITE"}',true,1)
    ON CONFLICT DO NOTHING;
    INSERT INTO assignments
      (assignment_id, organization_id, cohort_id, course_id, lesson_id, title, assignment_type, created_by, due_at, status, curriculum_release_id, assigned_content_type, assigned_content_id, visibility_scope, completion_policy_id)
    VALUES ('phase32_studio_assignment','phase8_org_a','phase8_cohort_a','phase9_course_a','phase9_lesson_b','Phase 3.2 Studio Assignment','assignment','admin_A',NOW()+INTERVAL '7 days','published','phase9_release_2','LESSON','unit-a:lesson-b','targeted','phase32_studio_policy')
    ON CONFLICT DO NOTHING;
    INSERT INTO assignment_targets (assignment_target_id, assignment_id, organization_id, target_type, user_id, created_by)
    VALUES ('phase32_studio_target','phase32_studio_assignment','phase8_org_a','LEARNER','learner_A2','admin_A')
    ON CONFLICT DO NOTHING;
  `;
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", sql], { encoding: "utf8" });
}

function rows(sql) {
  return execFileSync("psql", [database, "-X", "-At", "-F", "|", "-c", sql], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
}

function institutionalCounts() {
  return rows(`SELECT
    (SELECT COUNT(*) FROM portfolio_profiles),
    (SELECT COUNT(*) FROM portfolio_artifacts),
    (SELECT COUNT(*) FROM curriculum_lesson_completions),
    (SELECT COUNT(*) FROM learner_credentials),
    (SELECT COUNT(*) FROM integration_outbox WHERE event_type LIKE 'portfolio.%'),
    (SELECT COUNT(*) FROM studio_delivery_records),
    (SELECT COUNT(*) FROM prepare_prove_evidence)`)[0].split("|");
}

async function completeAssignmentStudio(page, reviewer) {
  const handoff = await apiJson(page, "learner_A2", "/studio/handoffs/assignment", {
    method: "POST",
    data: { assignmentId: "phase32_studio_assignment", projectType: "WEBSITE", title: "Assignment Portfolio Website" },
  });
  expect(handoff.response.status()).toBe(201);
  const projectId = handoff.data.projectId;
  const repeat = await apiJson(page, "learner_A2", "/studio/handoffs/assignment", {
    method: "POST",
    data: { assignmentId: "phase32_studio_assignment", projectType: "WEBSITE", title: "Assignment Portfolio Website" },
  });
  expect(repeat.response.status()).toBe(201);
  expect(repeat.data.projectId).toBe(projectId);
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", `UPDATE completion_policy_requirements SET target_reference='${projectId}' WHERE requirement_id='phase32_studio_requirement'`], { encoding: "utf8" });

  await page.goto(`${frontend}/curriculum.html#/studio/projects/${projectId}/build`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Page title").fill("Assignment Website");
  await page.getByLabel("Page content").fill("Assignment-owned durable Studio work.");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Check My Project" }).click();
  await expect(page.getByText("Looks good")).toBeVisible();
  const submission = page.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith(`/studio/projects/${projectId}/review-submissions`));
  await page.getByRole("button", { name: "Submit for Review" }).click();
  expect((await submission).status()).toBe(201);
  const review = await apiJson(page, "learner_A2", `/studio/projects/${projectId}/review/current`);
  await reviewer.goto(`${frontend}/curriculum.html#/studio/review/${projectId}/${review.data.submission.submissionId}`, { waitUntil: "domcontentloaded" });
  await reviewer.getByRole("button", { name: "Approve" }).click();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Finalize Project" }).click();
  await expect(page.getByText("Finalized", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Prepare Evidence" }).click();
  await expect(page.getByText(/Evidence is being processed/)).toBeVisible();
  const status = await apiJson(page, "learner_A2", `/studio/projects/${projectId}/institutional-status`);
  expect(status.data.evidence).toHaveLength(1);
  expect(status.data.evidence[0].isCurrent).toBe(true);
  return { projectId, evidenceId: status.data.evidence[0].evidenceId };
}

test.describe.configure({ mode: "serial" });

test("assignment-origin Evidence reaches durable Portfolio without completion shortcut", async ({ browser }) => {
  seedAssignmentFixture();
  const student = await actorPage(browser, "learner_A2");
  const reviewer = await actorPage(browser, "instructor_A_authorized", "instructor");
  const { projectId, evidenceId } = await completeAssignmentStudio(student, reviewer);
  const completionBeforeAdd = await apiJson(student, "learner_A2", "/assignments/phase32_studio_assignment/check-completion", { method: "POST", data: {} });
  expect(completionBeforeAdd.response.status()).toBe(200);
  expect(completionBeforeAdd.data.requirements.find((item) => item.type === "STUDIO_PROJECT").satisfied).toBe(true);
  const beforePortfolioAction = institutionalCounts();
  const add = student.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith("/portfolio/artifacts/from-evidence"));
  await student.getByRole("button", { name: "Add to Portfolio" }).click();
  expect((await add).status()).toBe(201);
  await expect(student.getByText(/Already in Portfolio/)).toBeVisible();
  await student.goto(`${frontend}/curriculum.html#/curriculum/asl/portfolio`, { waitUntil: "domcontentloaded" });
  await expect(student.getByRole("heading", { name: "Portfolio", level: 1 })).toBeVisible();
  const artifact = await apiJson(student, "learner_A2", "/portfolio/artifacts");
  expect(artifact.data.items).toHaveLength(1);
  expect(artifact.data.items[0].provenance.evidenceId).toBe(evidenceId);
  expect(artifact.data.items[0].provenance.studioProjectId).toBe(projectId);
  expect(artifact.data.items[0].provenance.assignmentId).toBe("phase32_studio_assignment");
  const completionAfterAdd = await apiJson(student, "learner_A2", "/assignments/phase32_studio_assignment/check-completion", { method: "POST", data: {} });
  expect(completionAfterAdd.data.complete).toBe(true);
  expect(completionAfterAdd.data.requirements).toHaveLength(1);
  expect(institutionalCounts().slice(2, 4)).toEqual(beforePortfolioAction.slice(2, 4));
  expect(institutionalCounts()[5]).toBe(beforePortfolioAction[5]);
  await student.close();
  await reviewer.close();
});

test("Portfolio failure is announced and retry is durable and idempotent", async ({ browser }) => {
  const student = await actorPage(browser, "learner_A2");
  const status = await apiJson(student, "learner_A2", "/portfolio/artifacts");
  const existing = status.data.items[0];
  expect(existing).toBeTruthy();
  const before = institutionalCounts();
  await student.goto(`${frontend}/curriculum.html#/curriculum/asl/portfolio`, { waitUntil: "domcontentloaded" });
  let failOnce = true;
  await student.route("**/portfolio/artifacts/*", async (route) => {
    if (failOnce && route.request().method() === "PATCH") {
      failOnce = false;
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ ok: false, error: "controlled_failure" }) });
      return;
    }
    await route.continue({ headers: { ...route.request().headers(), authorization: token("learner_A2") } });
  });
  await student.getByRole("button", { name: "Edit Presentation" }).click();
  await student.getByLabel("Project title").fill("Retry-safe assignment artifact");
  await student.getByRole("button", { name: "Save Presentation" }).click();
  await expect(student.getByRole("alert")).toContainText("could not save");
  await expect(student.getByText("Retry-safe assignment artifact")).not.toBeVisible();
  const retryResponse = student.waitForResponse((response) => response.request().method() === "PATCH" && response.url().includes("/portfolio/artifacts/"));
  await student.getByRole("button", { name: "Save Presentation" }).click();
  expect((await retryResponse).status()).toBe(200);
  await student.reload({ waitUntil: "domcontentloaded" });
  const durable = await apiJson(student, "learner_A2", "/portfolio/artifacts");
  expect(durable.data.items[0].presentation.title).toBe("Retry-safe assignment artifact");
  await expect(student.getByText("Retry-safe assignment artifact", { exact: true })).toBeVisible();
  expect(institutionalCounts()[1]).toBe(before[1]);
  expect(Number(institutionalCounts()[4]) - Number(before[4])).toBe(1);
  await student.close();
});

test("Portfolio surfaces pass desktop, tablet, mobile, keyboard, and semantic checks", async ({ browser }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 900 }]) {
    const page = await actorPage(browser, "learner_A2", "student", viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => {
      localStorage.setItem("portfolio:items", JSON.stringify([{ title: "FAKE LEGACY ARTIFACT" }]));
      localStorage.setItem("civic:portfolio:artifacts", JSON.stringify([{ title: "FAKE CIVIC ARTIFACT" }]));
      localStorage.setItem("lesson-local-portfolio", JSON.stringify([{ title: "FAKE LESSON ARTIFACT" }]));
    });
    await page.goto(`${frontend}/curriculum.html#/curriculum/asl/portfolio`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Portfolio", level: 1 })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/FAKE (LEGACY|CIVIC|LESSON) ARTIFACT/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    const edit = page.getByRole("button", { name: "Edit Presentation" }).first();
    await edit.focus();
    await expect(edit).toBeFocused();
    await edit.press("Enter");
    await expect(page.getByLabel("Project title")).toBeVisible();
    await expect(page.getByRole("option", { name: "Public" })).toHaveCount(0);
    await expect(page.getByRole("option", { name: "Unlisted" })).toHaveCount(0);
    const snapshot = await page.getByRole("main", { name: "Portfolio" }).ariaSnapshot();
    expect(snapshot).toContain("Portfolio");
    expect(snapshot).toContain("Project title");
    expect(snapshot).toContain("Visibility");
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.close();
  }
});

test("Portfolio authorization and unsupported visibility remain fail-closed", async ({ browser }) => {
  const owner = await actorPage(browser, "learner_A2");
  const sameOrg = await actorPage(browser, "learner_A1");
  const foreign = await actorPage(browser, "learner_B1");
  const items = await apiJson(owner, "learner_A2", "/portfolio/artifacts");
  const artifact = items.data.items[0];
  expect(artifact).toBeTruthy();
  const privateRead = await apiJson(sameOrg, "learner_A1", `/portfolio/artifacts/${artifact.artifactId}`);
  expect([403, 404]).toContain(privateRead.response.status());
  const foreignRead = await apiJson(foreign, "learner_B1", `/portfolio/artifacts/${artifact.artifactId}`);
  expect([403, 404]).toContain(foreignRead.response.status());
  const foreignWrite = await apiJson(foreign, "learner_B1", `/portfolio/artifacts/${artifact.artifactId}`, { method: "PATCH", data: { title: "forged" } });
  expect([403, 404]).toContain(foreignWrite.response.status());
  const forged = await apiJson(owner, "learner_A2", "/portfolio/artifacts/from-evidence", { method: "POST", data: { evidenceId: artifact.provenance.evidenceId, learnerId: "learner_A1", organizationId: "phase8_org_b", tenantId: "tenant:phase8_org_b", visibility: "PUBLIC" } });
  expect([400, 403]).toContain(forged.response.status());
  const unsupported = await apiJson(owner, "learner_A2", `/portfolio/artifacts/${artifact.artifactId}`, { method: "PATCH", data: { visibility: "PUBLIC" } });
  expect([400, 403]).toContain(unsupported.response.status());
  await owner.close();
  await sameOrg.close();
  await foreign.close();
});
