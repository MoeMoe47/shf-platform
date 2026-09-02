import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!frontend || !api || !database) throw new Error("Phase 10.1 acceptance requires the disposable environment.");

const token = (id) => `Bearer dev-token:${id}`;
const headers = (id) => ({ Authorization: token(id), "Content-Type": "application/json" });

async function actorPage(browser, id, role = "student", viewport = { width: 1440, height: 900 }) {
  const page = await browser.newPage({ viewport });
  await page.addInitScript(({ id, role }) => { window.__user = { role, email: `${id}@phase10-1.test`, name: id }; }, { id, role });
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

function seedPhase10_1() {
  const sql = `
    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('phase10_1_student_studio_create','phase8_role_student','studio.project.create'),
      ('phase10_1_student_studio_view','phase8_role_student','studio.project.view'),
      ('phase10_1_student_studio_update','phase8_role_student','studio.project.update'),
      ('phase10_1_student_studio_finalize','phase8_role_student','studio.project.finalize'),
      ('phase10_1_instructor_studio_view','phase8_role_instructor','studio.project.view')
    ON CONFLICT DO NOTHING;
    INSERT INTO curriculum_evidence_rules (evidence_rule_id, organization_id, source_type, evidence_type, truth_fact_type, competency_id, rule_version, review_required, created_by_user_id)
      VALUES ('phase10_1_studio_rule','phase8_org_a','STUDIO_DELIVERY','STUDIO_PROJECT_FINALIZED',NULL,'competency_prepare_prove_monitoring_finding',1,true,'admin_A')
    ON CONFLICT DO NOTHING;
    INSERT INTO completion_policies (policy_id, organization_id, curriculum_release_id, assigned_content_type, assigned_content_id, status, version, created_by_user_id, activated_by_user_id, activated_at)
      VALUES ('phase10_1_studio_only_policy','phase9_org_placeholder','phase9_release_2','LESSON','unit-a:lesson-b','ACTIVE',1,'admin_A','admin_A',NOW())
    ON CONFLICT DO NOTHING;
  `;
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", sql.replace("phase9_org_placeholder", "phase8_org_a")], { encoding: "utf8" });
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", `
    INSERT INTO completion_policy_requirements (requirement_id, policy_id, organization_id, requirement_type, target_reference, configuration, required, sequence)
      VALUES ('phase10_1_studio_requirement','phase10_1_studio_only_policy','phase8_org_a','STUDIO_PROJECT','pending-project','{}',true,1)
    ON CONFLICT DO NOTHING;
    INSERT INTO assignments (assignment_id, organization_id, cohort_id, course_id, lesson_id, title, assignment_type, created_by, due_at, status, curriculum_release_id, assigned_content_type, assigned_content_id, visibility_scope, completion_policy_id)
      VALUES ('phase10_1_studio_assignment','phase8_org_a','phase8_cohort_a','phase9_course_a','phase9_lesson_b','Studio-only Assignment','assignment','admin_A',NOW()+INTERVAL '7 days','published','phase9_release_2','LESSON','unit-a:lesson-b','targeted','phase10_1_studio_only_policy')
    ON CONFLICT DO NOTHING;
    INSERT INTO assignment_targets (assignment_target_id, assignment_id, organization_id, target_type, user_id, created_by)
      VALUES ('phase10_1_studio_target','phase10_1_studio_assignment','phase8_org_a','LEARNER','learner_A2','admin_A')
    ON CONFLICT DO NOTHING;
    INSERT INTO assignment_targets (assignment_target_id, assignment_id, organization_id, target_type, cohort_id, created_by)
      VALUES ('phase10_1_studio_cohort_target','phase10_1_studio_assignment','phase8_org_a','COHORT','phase8_cohort_a','admin_A')
    ON CONFLICT DO NOTHING;
  `], { encoding: "utf8" });
}

async function completeStudioFlow(browser, { learner, projectType, title, viewport }) {
  const student = await actorPage(browser, learner, "student", viewport);
  const reviewer = await actorPage(browser, "instructor_A_authorized", "instructor");
  const created = await apiJson(student, learner, "/studio/projects", { method: "POST", data: { projectType, title } });
  expect(created.response.status()).toBe(201);
  const projectId = created.data.projectId;
  await student.goto(`${frontend}/curriculum.html#/studio/projects/${projectId}/build`, { waitUntil: "domcontentloaded" });
  if (projectType === "AI_AGENT") {
    await student.getByLabel("Agent name").fill("Student Planning Agent");
    await student.getByLabel("Instructions").fill("Help the student organize a safe project plan.");
  } else {
    await student.getByLabel("Page title").fill("Evidence Website");
    await student.getByLabel("Page content").fill("Finalized student work.");
  }
  await student.getByRole("button", { name: "Save draft" }).click();
  await expect(student.getByText("Saved", { exact: true })).toBeVisible();
  await student.getByRole("button", { name: "Check My Project" }).click();
  await expect(student.getByText("Looks good")).toBeVisible();
  const submit = student.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith(`/studio/projects/${projectId}/review-submissions`));
  await student.getByRole("button", { name: "Submit for Review" }).click();
  expect((await submit).status()).toBe(201);
  const review = await apiJson(student, learner, `/studio/projects/${projectId}/review/current`);
  await reviewer.goto(`${frontend}/curriculum.html#/studio/review/${projectId}/${review.data.submission.submissionId}`, { waitUntil: "domcontentloaded" });
  await reviewer.getByRole("button", { name: "Approve" }).click();
  await student.reload({ waitUntil: "domcontentloaded" });
  await student.getByRole("button", { name: "Finalize Project" }).click();
  await expect(student.getByText("Finalized", { exact: true })).toBeVisible();
  await student.getByRole("button", { name: "Prepare Evidence" }).click();
  await expect(student.getByText(/Evidence is being processed/)).toBeVisible();
  return { student, reviewer, projectId };
}

function queryRows(sql) {
  return execFileSync("psql", [database, "-X", "-At", "-F", "|", "-c", sql], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
}

test.describe.configure({ mode: "serial" });

test("AI Agent finalized work enters Evidence without Registry, credential, ClientOps, or completion claims", async ({ browser }) => {
  seedPhase10_1();
  const { student, reviewer, projectId } = await completeStudioFlow(browser, { learner: "learner_A1", projectType: "AI_AGENT", title: "Phase 10.1 Agent Evidence", viewport: { width: 768, height: 1024 } });
  const status = await apiJson(student, "learner_A1", `/studio/projects/${projectId}/institutional-status`);
  expect(status.data.destination).toBe("STUDENT");
  expect(status.data.evidence).toHaveLength(1);
  expect(status.data.evidence[0].status).toBe("REVIEWABLE");
  expect(status.data.portfolio.status).toBe("NOT_CONNECTED");
  await expect(student.locator("body")).not.toContainText(/Registry approved|certif(?:ied|ication)|production ready|deployed|Credential(?: awarded)?|Assignment complete/i);
  const downstream = queryRows(`SELECT (SELECT COUNT(*) FROM learner_credentials),(SELECT COUNT(*) FROM curriculum_lesson_completions),(SELECT COUNT(*) FROM prepare_prove_evidence WHERE source_type='STUDIO_DELIVERY')`);
  expect(downstream).toHaveLength(1);
  await student.close();
  await reviewer.close();
});

test("Evidence is idempotent, scoped, and remains historical after a newer workspace revision", async ({ browser }) => {
  const { student, reviewer, projectId } = await completeStudioFlow(browser, { learner: "learner_A2", projectType: "WEBSITE", title: "Phase 10.1 Stale Evidence", viewport: { width: 390, height: 900 } });
  const first = await apiJson(student, "learner_A2", `/studio/projects/${projectId}/institutional-status`);
  const deliveryId = first.data.delivery.deliveryRecordId;
  const evidenceBefore = queryRows(`SELECT evidence_id, provenance_json FROM prepare_prove_evidence WHERE source_type='STUDIO_DELIVERY' AND source_record_id='${deliveryId}'`);
  expect(evidenceBefore).toHaveLength(1);
  const repeat = await apiJson(student, "learner_A2", `/studio/projects/${projectId}/evidence`, { method: "POST", data: {} });
  expect(repeat.response.status()).toBe(201);
  expect(queryRows(`SELECT evidence_id FROM prepare_prove_evidence WHERE source_type='STUDIO_DELIVERY' AND source_record_id='${deliveryId}'`)).toHaveLength(1);
  await student.getByLabel("Page content").fill("A newer draft that is not approved.");
  await student.getByRole("button", { name: "Save draft" }).click();
  await expect(student.getByText("Saved", { exact: true })).toBeVisible();
  await expect(student.getByText("Evidence is from an earlier version", { exact: true })).toBeVisible();
  const after = await apiJson(student, "learner_A2", `/studio/projects/${projectId}/institutional-status`);
  expect(after.data.delivery.workspaceRevision).toBe(1);
  expect(after.data.currentWorkspaceRevision).toBe(2);
  expect(after.data.delivery.isCurrent).toBe(false);
  expect(after.data.evidence[0].isCurrent).toBe(false);
  expect(after.data.evidence[0].evidenceId).toBe(first.data.evidence[0].evidenceId);
  expect(queryRows(`SELECT evidence_id, provenance_json FROM prepare_prove_evidence WHERE evidence_id='${first.data.evidence[0].evidenceId}'`)).toEqual(evidenceBefore);
  await expect(student.locator("body")).not.toContainText(/assignment complete|Verified completion|Published/i);
  const foreignGet = await apiJson(student, "instructor_B", `/studio/projects/${projectId}/institutional-status`);
  expect([403, 404]).toContain(foreignGet.response.status());
  const foreignPost = await apiJson(student, "instructor_B", `/studio/projects/${projectId}/evidence`, { method: "POST", data: {} });
  expect([403, 404]).toContain(foreignPost.response.status());
  const crossLearner = await apiJson(student, "learner_A1", `/studio/projects/${projectId}/institutional-status`);
  expect([403, 404]).toContain(crossLearner.response.status());
  await student.close();
  await reviewer.close();
});

test("assignment-origin Studio completion is policy-evaluated and preserves the assignment lineage", async ({ browser }) => {
  seedPhase10_1();
  const student = await actorPage(browser, "learner_A2");
  const handoff = await apiJson(student, "learner_A2", "/studio/handoffs/assignment", { method: "POST", data: { assignmentId: "phase10_1_studio_assignment", projectType: "WEBSITE", title: "Assignment Studio Evidence" } });
  expect(handoff.response.status()).toBe(201);
  const projectId = handoff.data.projectId;
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", `UPDATE completion_policy_requirements SET target_reference='${projectId}' WHERE requirement_id='phase10_1_studio_requirement';`], { encoding: "utf8" });
  const project = await apiJson(student, "learner_A2", `/studio/projects/${projectId}`);
  expect(project.data.assignmentId).toBe("phase10_1_studio_assignment");
  expect(project.data.curriculumReleaseId).toBe("phase9_release_2");
  const reviewer = await actorPage(browser, "instructor_A_authorized", "instructor");
  const initialProgress = await apiJson(reviewer, "instructor_A_authorized", "/studio/assignments/phase10_1_studio_assignment/progress");
  expect(initialProgress.response.status()).toBe(200);
  expect(initialProgress.data.learners.find((row) => row.learner.id === "learner_A2").state).toBe("STARTED");
  await student.goto(`${frontend}/curriculum.html#/studio/projects/${projectId}/build`, { waitUntil: "domcontentloaded" });
  await student.getByLabel("Page title").fill("Assignment Website");
  await student.getByLabel("Page content").fill("Assignment-owned Studio work.");
  await student.getByRole("button", { name: "Save draft" }).click();
  await student.getByRole("button", { name: "Check My Project" }).click();
  const assignmentSubmit = student.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith(`/studio/projects/${projectId}/review-submissions`));
  await student.getByRole("button", { name: "Submit for Review" }).click();
  expect((await assignmentSubmit).status()).toBe(201);
  const readyProgress = await apiJson(reviewer, "instructor_A_authorized", "/studio/assignments/phase10_1_studio_assignment/progress");
  expect(readyProgress.data.learners.find((row) => row.learner.id === "learner_A2").state).toBe("READY_FOR_REVIEW");
  const review = await apiJson(student, "learner_A2", `/studio/projects/${projectId}/review/current`);
  await reviewer.goto(`${frontend}/curriculum.html#/studio/review/${projectId}/${review.data.submission.submissionId}`, { waitUntil: "domcontentloaded" });
  await reviewer.getByRole("button", { name: "Approve" }).click();
  await student.reload({ waitUntil: "domcontentloaded" });
  await student.getByRole("button", { name: "Finalize Project" }).click();
  const finalProgress = await apiJson(reviewer, "instructor_A_authorized", "/studio/assignments/phase10_1_studio_assignment/progress");
  const finalRow = finalProgress.data.learners.find((row) => row.learner.id === "learner_A2");
  expect(finalRow.state).toBe("FINALIZED");
  expect(finalRow.studioRequirementSatisfied).toBe(true);
  await reviewer.goto(`${frontend}/curriculum.html#/studio/assignments/phase10_1_studio_assignment/progress`, { waitUntil: "domcontentloaded" });
  await expect(reviewer.getByRole("heading", { name: "Studio-only Assignment" })).toBeVisible();
  await expect(reviewer.getByText("Finalized", { exact: true })).toBeVisible();
  const completion = await apiJson(student, "learner_A2", "/assignments/phase10_1_studio_assignment/check-completion", { method: "POST", data: {} });
  expect(completion.response.status()).toBe(200);
  expect(completion.data.complete).toBe(true);
  expect(completion.data.requirements).toHaveLength(1);
  expect(completion.data.requirements[0].type).toBe("STUDIO_PROJECT");
  expect(completion.data.requirements[0].satisfied).toBe(true);
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", `INSERT INTO completion_policy_requirements (requirement_id, policy_id, organization_id, requirement_type, target_reference, configuration, required, sequence)
    VALUES ('phase10_1_unrelated_requirement','phase10_1_studio_only_policy','phase8_org_a','ARCADE','phase10_1_unfinished_activity','{}',true,2);`], { encoding: "utf8" });
  const incomplete = await apiJson(student, "learner_A2", "/assignments/phase10_1_studio_assignment/check-completion", { method: "POST", data: {} });
  expect(incomplete.response.status()).toBe(200);
  expect(incomplete.data.complete).toBe(false);
  expect(incomplete.data.requirements.find((requirement) => requirement.type === "STUDIO_PROJECT").satisfied).toBe(true);
  expect(incomplete.data.requirements.find((requirement) => requirement.type === "ARCADE").satisfied).toBe(false);
  await student.close();
  await reviewer.close();
});
