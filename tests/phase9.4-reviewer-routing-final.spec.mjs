import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!frontend || !api || !database) throw new Error("Phase 9.4 acceptance requires the disposable environment.");

test.describe.configure({ mode: "serial" });
test.setTimeout(240_000);

const ORG_A = "phase8_org_a";
const ORG_B = "phase8_org_b";
const TENANT_A = `tenant:${ORG_A}`;
const TENANT_B = `tenant:${ORG_B}`;
const ROLE_INSTRUCTOR = "phase8_role_instructor";
const ROLE_STUDENT = "phase8_role_student";
const users = {
  reviewerA: "phase94_reviewer_a",
  reviewerB: "phase94_reviewer_b",
  reviewerC: "phase94_reviewer_c",
  inactive: "phase94_reviewer_inactive",
  noPermission: "phase94_reviewer_no_permission",
  dualRole: "learner_A2",
  manager: "admin_A",
  foreignManager: "admin_B",
  foreignReviewer: "instructor_B",
  learner: "learner_A1",
};

const headers = (id) => ({ Authorization: `Bearer dev-token:${id}`, "Content-Type": "application/json" });

function sql(query) {
  return execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-At", "-c", query], { encoding: "utf8" }).trim();
}

function rows(query) {
  const value = sql(`SELECT COALESCE(json_agg(row_to_json(q)), '[]'::json) FROM (${query}) q`);
  return value ? JSON.parse(value) : [];
}

async function apiJson(request, id, path, options = {}) {
  const response = await request.fetch(`${api}${path}`, { ...options, headers: { ...headers(id), ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  return { response, body, data: body.data ?? body };
}

function installFixture() {
  const sqlText = `
    INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
    VALUES
      ('${users.reviewerA}', '${ORG_A}', '${users.reviewerA}@phase9.test', 'Reviewer A', 'active', 'test'),
      ('${users.reviewerB}', '${ORG_A}', '${users.reviewerB}@phase9.test', 'Reviewer B', 'active', 'test'),
      ('${users.reviewerC}', '${ORG_A}', '${users.reviewerC}@phase9.test', 'Reviewer C', 'active', 'test'),
      ('${users.inactive}', '${ORG_A}', '${users.inactive}@phase9.test', 'Inactive Reviewer', 'active', 'test'),
      ('${users.noPermission}', '${ORG_A}', '${users.noPermission}@phase9.test', 'No Permission Reviewer', 'active', 'test')
    ON CONFLICT (user_id) DO UPDATE SET status='active';
    INSERT INTO memberships (membership_id,user_id,organization_id,role_id,status,effective_from)
    VALUES
      ('phase94_mem_a','${users.reviewerA}','${ORG_A}','${ROLE_INSTRUCTOR}','active',NOW()),
      ('phase94_mem_b','${users.reviewerB}','${ORG_A}','${ROLE_INSTRUCTOR}','active',NOW()),
      ('phase94_mem_c','${users.reviewerC}','${ORG_A}','${ROLE_INSTRUCTOR}','active',NOW()),
      ('phase94_mem_inactive','${users.inactive}','${ORG_A}','${ROLE_INSTRUCTOR}','active',NOW()),
      ('phase94_mem_no_permission','${users.noPermission}','${ORG_A}','${ROLE_STUDENT}','active',NOW()),
      ('phase94_mem_dual','${users.dualRole}','${ORG_A}','${ROLE_INSTRUCTOR}','active',NOW())
    ON CONFLICT (membership_id) DO UPDATE SET status='active', role_id=EXCLUDED.role_id;
    INSERT INTO cohort_staff (cohort_staff_id,organization_id,tenant_id,cohort_id,user_id,role,status,created_by_user_id)
    VALUES
      ('phase94_staff_a','${ORG_A}','${TENANT_A}','phase8_cohort_a','${users.reviewerA}','INSTRUCTOR','ACTIVE','admin_A'),
      ('phase94_staff_b','${ORG_A}','${TENANT_A}','phase8_cohort_a','${users.reviewerB}','INSTRUCTOR','ACTIVE','admin_A'),
      ('phase94_staff_c','${ORG_A}','${TENANT_A}','phase8_cohort_a','${users.reviewerC}','INSTRUCTOR','ACTIVE','admin_A'),
      ('phase94_staff_inactive','${ORG_A}','${TENANT_A}','phase8_cohort_a','${users.inactive}','INSTRUCTOR','INACTIVE','admin_A'),
      ('phase94_staff_dual','${ORG_A}','${TENANT_A}','phase8_cohort_a','${users.dualRole}','INSTRUCTOR','ACTIVE','admin_A'),
      ('phase94_staff_b_org','${ORG_B}','${TENANT_B}','phase8_cohort_b','${users.foreignReviewer}','INSTRUCTOR','ACTIVE','admin_B')
    ON CONFLICT (cohort_staff_id) DO UPDATE SET status=EXCLUDED.status;
    INSERT INTO role_permissions (role_permission_id,role_id,permission_name)
    VALUES ('phase94_student_create','${ROLE_STUDENT}','studio.project.create'),('phase94_student_view','${ROLE_STUDENT}','studio.project.view'),('phase94_student_update','${ROLE_STUDENT}','studio.project.update')
    ON CONFLICT DO NOTHING;
  `;
  sql(sqlText);
}

function setStaff(ids) {
  const quoted = ids.length ? ids.map((id) => `'${id}'`).join(",") : "NULL";
  sql(`UPDATE cohort_staff SET status=CASE WHEN user_id IN (${quoted}) THEN 'ACTIVE' ELSE 'INACTIVE' END WHERE organization_id='${ORG_A}' AND cohort_id='phase8_cohort_a';`);
}

async function createSubmission(request, userId, title) {
  const project = await apiJson(request, userId, "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title } });
  expect(project.response.status(), `create ${title}`).toBe(201);
  const projectId = project.data.projectId;
  const workspace = await apiJson(request, userId, `/studio/projects/${projectId}/workspace`);
  expect(workspace.response.status()).toBe(200);
  const work = { pages: [{ path: "/", title: title.slice(0, 100), content: `Acceptance content for ${title}.` }] };
  const saved = await apiJson(request, userId, `/studio/projects/${projectId}/workspace`, { method: "PATCH", data: { revision: workspace.data.revision, work } });
  expect(saved.response.status(), `save ${title}`).toBe(200);
  const qa = await apiJson(request, userId, `/studio/projects/${projectId}/qa`, { method: "POST", data: {} });
  expect(qa.response.status(), `qa ${title}`).toBe(201);
  const submitted = await apiJson(request, userId, `/studio/projects/${projectId}/review-submissions`, { method: "POST", data: {} });
  expect(submitted.response.status(), `submit ${title}`).toBe(201);
  const current = await apiJson(request, userId, `/studio/projects/${projectId}/review/current`);
  return { projectId, submissionId: current.data.submission.submissionId, revision: current.data.submission.workspaceRevision };
}

function seedAssignments(submissions, reviewerId, prefix, assignedAt = "2025-01-01T00:00:00Z") {
  const values = submissions.map((item, index) => `('${prefix}_${index}','${item.submissionId}','${ORG_A}','${TENANT_A}','${reviewerId}','ASSIGNED','LEAST_ACTIVE_LOAD','fixture load','${assignedAt}')`).join(",");
  sql(`INSERT INTO studio_review_assignments (review_assignment_id,review_submission_id,organization_id,tenant_id,reviewer_user_id,status,routing_policy_key,assignment_reason,assigned_at) VALUES ${values} ON CONFLICT DO NOTHING;`);
}

function snapshot(scope = ORG_A) {
  const tables = [
    "projects", "studio_handoffs", "studio_builder_workspaces", "studio_qa_runs", "studio_review_submissions", "studio_review_decisions",
    "studio_review_assignments", "prepare_prove_evidence", "curriculum_lesson_completions", "portfolio_artifacts", "website_deployments",
    "governed_agent_packages", "agent_registry_submissions", "learner_credentials", "integration_outbox",
  ];
  return Object.fromEntries(tables.map((table) => {
    const exists = sql(`SELECT to_regclass('public.${table}') IS NOT NULL`);
    if (exists !== "t") return [table, { count: 0, rows: [] }];
    const scoped = ["integration_outbox"].includes(table) ? `organization_id='${scope}'` : `organization_id='${scope}'`;
    return [table, { count: Number(sql(`SELECT COUNT(*) FROM ${table} WHERE ${scoped}`)), rows: rows(`SELECT * FROM ${table} WHERE ${scoped} ORDER BY 1 LIMIT 100`) }];
  }));
}

test("Phase 9.4 mandatory live routing certification", async ({ browser, request }) => {
  installFixture();
  setStaff([]);

  const noReviewer = await createSubmission(request, users.learner, "Phase 9.4 No Reviewer");
  const noRoute1 = await apiJson(request, users.manager, `/studio/review-submissions/${noReviewer.submissionId}/route`, { method: "POST", data: {} });
  const noRoute2 = await apiJson(request, users.manager, `/studio/review-submissions/${noReviewer.submissionId}/route`, { method: "POST", data: {} });
  expect(noRoute1.response.status()).toBe(409);
  expect(noRoute2.response.status()).toBe(409);
  expect(Number(sql(`SELECT COUNT(*) FROM studio_review_assignments WHERE review_submission_id='${noReviewer.submissionId}' AND status IN ('ASSIGNED','IN_PROGRESS')`))).toBe(0);
  expect(Number(sql(`SELECT COUNT(*) FROM integration_outbox WHERE event_type='studio.review.routing_failed' AND subject_id='${noReviewer.submissionId}'`))).toBe(1);

  setStaff([users.reviewerA, users.reviewerB, users.reviewerC]);
  setStaff([]);
  const loadFixtures = await Promise.all([
    createSubmission(request, users.learner, "Load A 1"), createSubmission(request, users.learner, "Load A 2"), createSubmission(request, users.learner, "Load A 3"),
    createSubmission(request, users.learner, "Load B 1"),
  ]);
  setStaff([users.reviewerA, users.reviewerB, users.reviewerC]);
  seedAssignments(loadFixtures.slice(0, 3), users.reviewerA, "phase94_load_a");
  seedAssignments(loadFixtures.slice(3), users.reviewerB, "phase94_load_b", "2025-01-02T00:00:00Z");
  setStaff([]);
  const controlled = await createSubmission(request, users.learner, "Controlled Least Load");
  setStaff([users.reviewerA, users.reviewerB, users.reviewerC]);
  const loadQuery = `WITH reviewers(user_id) AS (VALUES ('${users.reviewerA}'),('${users.reviewerB}'),('${users.reviewerC}')) SELECT reviewers.user_id AS reviewer_user_id, COUNT(a.review_assignment_id) FILTER (WHERE a.status IN ('ASSIGNED','IN_PROGRESS')) AS active_load FROM reviewers LEFT JOIN studio_review_assignments a ON a.reviewer_user_id=reviewers.user_id AND a.organization_id='${ORG_A}' GROUP BY reviewers.user_id ORDER BY reviewers.user_id`;
  const loadsBefore = rows(loadQuery);
  const routed = await apiJson(request, users.manager, `/studio/review-submissions/${controlled.submissionId}/route`, { method: "POST", data: { reviewer_user_id: users.reviewerA, active_load: 999, eligibility: true } });
  expect(routed.response.status()).toBe(201);
  expect(routed.data.reviewerUserId).toBe(users.reviewerC);
  expect(Number(loadsBefore.find((x) => x.reviewer_user_id === users.reviewerA).active_load)).toBe(3);
  expect(Number(loadsBefore.find((x) => x.reviewer_user_id === users.reviewerB).active_load)).toBe(1);
  expect(Number(loadsBefore.find((x) => x.reviewer_user_id === users.reviewerC).active_load)).toBe(0);
  setStaff([]);
  const updated = await createSubmission(request, users.learner, "Updated Least Load");
  setStaff([users.reviewerA, users.reviewerB, users.reviewerC]);
  const updatedLoads = rows(loadQuery);
  const updatedRoute = await apiJson(request, users.manager, `/studio/review-submissions/${updated.submissionId}/route`, { method: "POST", data: {} });
  expect(updatedRoute.response.status()).toBe(201);
  const minLoad = Math.min(...updatedLoads.map((x) => Number(x.active_load)));
  expect(Number(updatedLoads.find((x) => x.reviewer_user_id === updatedRoute.data.reviewerUserId).active_load)).toBe(minLoad);

  sql("UPDATE studio_review_assignments SET status='COMPLETED', completed_at=NOW() WHERE review_assignment_id LIKE 'phase94_%' AND status IN ('ASSIGNED','IN_PROGRESS');");
  setStaff([]);
  const tieA = await createSubmission(request, users.learner, "Tie Break A");
  const tieB = await createSubmission(request, users.learner, "Tie Break B");
  seedAssignments([tieA], users.reviewerA, "phase94_tie_a", "2020-01-01T00:00:00Z");
  seedAssignments([tieB], users.reviewerB, "phase94_tie_b", "2024-01-01T00:00:00Z");
  setStaff([users.reviewerA, users.reviewerB]);
  const tieTarget = await createSubmission(request, users.learner, "Tie Break Target");
  const tieRoute = await apiJson(request, users.manager, `/studio/review-submissions/${tieTarget.submissionId}/route`, { method: "POST", data: {} });
  expect(tieRoute.response.status()).toBe(201);
  expect(tieRoute.data.reviewerUserId).toBe(users.reviewerA);
  setStaff([users.reviewerA, users.reviewerB, users.reviewerC]);

  const self = await createSubmission(request, users.dualRole, "Dual Role Self Review");
  const selfRoute = await apiJson(request, users.manager, `/studio/review-submissions/${self.submissionId}/route`, { method: "POST", data: {} });
  expect(selfRoute.response.status()).toBe(201);
  expect(selfRoute.data.reviewerUserId).not.toBe(users.dualRole);

  setStaff([]);
  const reassignmentTarget = await createSubmission(request, users.learner, "Reassignment Target");
  setStaff([users.reviewerA, users.reviewerB, users.reviewerC]);
  const initial = await apiJson(request, users.manager, `/studio/review-submissions/${reassignmentTarget.submissionId}/route`, { method: "POST", data: {} });
  expect(initial.response.status()).toBe(201);
  await sql(`UPDATE studio_review_assignments SET reviewer_user_id='${users.reviewerA}' WHERE review_assignment_id='${initial.data.assignmentId}'`);
  const reassigned = await apiJson(request, users.manager, `/studio/review-assignments/${initial.data.assignmentId}/reassign`, { method: "POST", data: { reviewerUserId: users.reviewerB, reason: "Workload balancing" } });
  expect(reassigned.response.status()).toBe(201);
  expect(reassigned.data.reviewerUserId).toBe(users.reviewerB);
  const history = rows(`SELECT review_assignment_id,status,reviewer_user_id,reassigned_from_id FROM studio_review_assignments WHERE review_submission_id='${reassignmentTarget.submissionId}' ORDER BY created_at`);
  expect(history).toHaveLength(2);
  expect(history[0].status).toBe("REASSIGNED");
  expect(history[1].status).toBe("ASSIGNED");
  expect(history[1].reassigned_from_id).toBe(history[0].review_assignment_id);

  const deniedTargets = [users.inactive, users.noPermission, users.learner, users.foreignReviewer];
  for (const target of deniedTargets) {
    const denied = await apiJson(request, users.manager, `/studio/review-assignments/${reassigned.data.assignmentId}/reassign`, { method: "POST", data: { reviewerUserId: target, reason: "Invalid target" } });
    expect([403, 404]).toContain(denied.response.status());
    expect(Number(sql(`SELECT COUNT(*) FROM studio_review_assignments WHERE review_submission_id='${reassignmentTarget.submissionId}'`))).toBe(2);
  }

  setStaff([]);
  const revoked = await createSubmission(request, users.learner, "Revoked Reviewer");
  setStaff([users.reviewerA, users.reviewerB, users.reviewerC]);
  const revokedRoute = await apiJson(request, users.manager, `/studio/review-submissions/${revoked.submissionId}/route`, { method: "POST", data: {} });
  await sql(`UPDATE memberships SET status='inactive' WHERE membership_id='phase94_mem_a'`);
  const revokedDecision = await apiJson(request, users.reviewerA, `/studio/projects/${revoked.projectId}/review-submissions/${revoked.submissionId}/decision`, { method: "POST", data: { decision: "APPROVED", feedback: "Should be denied" } });
  expect([401, 403, 404]).toContain(revokedDecision.response.status());
  expect(Number(sql(`SELECT COUNT(*) FROM studio_review_decisions WHERE review_submission_id='${revoked.submissionId}'`))).toBe(0);
  await sql(`UPDATE memberships SET status='active' WHERE membership_id='phase94_mem_a'`);
  const reassignedAfterRevocation = await apiJson(request, users.manager, `/studio/review-assignments/${revokedRoute.data.assignmentId}/reassign`, { method: "POST", data: { reviewerUserId: users.reviewerB, reason: "Reviewer unavailable" } });
  expect(reassignedAfterRevocation.response.status()).toBe(201);
  const reviewerCDecision = await apiJson(request, users.reviewerC, `/studio/projects/${revoked.projectId}/review-submissions/${revoked.submissionId}/decision`, { method: "POST", data: { decision: "APPROVED", feedback: "Unassigned" } });
  expect([403, 404]).toContain(reviewerCDecision.response.status());
  const reviewerBDecision = await apiJson(request, users.reviewerB, `/studio/projects/${revoked.projectId}/review-submissions/${revoked.submissionId}/decision`, { method: "POST", data: { decision: "APPROVED", feedback: "Accepted after reassignment" } });
  expect(reviewerBDecision.response.status()).toBe(200);

  const foreignQueue = await apiJson(request, users.foreignReviewer, "/studio/reviews/queue");
  expect(foreignQueue.response.status()).toBe(200);
  expect(foreignQueue.data.items.some((item) => item.submissionId === reassignmentTarget.submissionId)).toBe(false);
  const foreignDetail = await apiJson(request, users.foreignManager, `/studio/reviews/assignments/${reassigned.data.assignmentId}`);
  expect([403, 404]).toContain(foreignDetail.response.status());
  const foreignReassign = await apiJson(request, users.foreignManager, `/studio/review-assignments/${reassigned.data.assignmentId}/reassign`, { method: "POST", data: { reviewerUserId: users.foreignReviewer, reason: "Foreign" } });
  expect([403, 404]).toContain(foreignReassign.response.status());
  const foreignDecision = await apiJson(request, users.foreignReviewer, `/studio/projects/${reassignmentTarget.projectId}/review-submissions/${reassignmentTarget.submissionId}/decision`, { method: "POST", data: { decision: "APPROVED", feedback: "Foreign" } });
  expect([403, 404]).toContain(foreignDecision.response.status());

  setStaff([]);
  const concurrent = await Promise.all(Array.from({ length: 6 }, (_, i) => createSubmission(request, users.learner, `Concurrent ${i}`)));
  setStaff([users.reviewerA, users.reviewerB, users.reviewerC]);
  const concurrentRoutes = await Promise.all(concurrent.map((item) => apiJson(request, users.manager, `/studio/review-submissions/${item.submissionId}/route`, { method: "POST", data: {} })));
  expect(concurrentRoutes.every((item) => item.response.status() === 201)).toBe(true);
  for (const item of concurrent) expect(Number(sql(`SELECT COUNT(*) FROM studio_review_assignments WHERE review_submission_id='${item.submissionId}' AND status IN ('ASSIGNED','IN_PROGRESS')`))).toBe(1);
  const sameSubmission = await Promise.all(Array.from({ length: 3 }, () => apiJson(request, users.manager, `/studio/review-submissions/${concurrent[0].submissionId}/route`, { method: "POST", data: {} })));
  expect(new Set(sameSubmission.map((item) => item.data.assignmentId)).size).toBe(1);

  const routingEvents = rows(`SELECT event_type,subject_id,organization_id,idempotency_key,payload_json FROM integration_outbox WHERE organization_id='${ORG_A}' AND event_type LIKE 'studio.review.%' AND (event_type IN ('studio.review.routed','studio.review.routing_failed','studio.review.reassigned')) ORDER BY created_at`);
  expect(routingEvents.some((item) => item.event_type === "studio.review.routed")).toBe(true);
  expect(routingEvents.some((item) => item.event_type === "studio.review.routing_failed")).toBe(true);
  expect(routingEvents.some((item) => item.event_type === "studio.review.reassigned")).toBe(true);
  expect(routingEvents.every((item) => !JSON.stringify(item.payload_json).match(/decision|APPROVED|REJECTED/))).toBe(true);

  setStaff([users.reviewerA, users.reviewerB, users.reviewerC]);
  setStaff([]);
  const matrixFixture = await createSubmission(request, users.learner, "Routing Matrix");
  setStaff([users.reviewerA, users.reviewerB, users.reviewerC]);
  const before = snapshot();
  const matrixRoute = await apiJson(request, users.manager, `/studio/review-submissions/${matrixFixture.submissionId}/route`, { method: "POST", data: {} });
  expect(matrixRoute.response.status()).toBe(201);
  const after = snapshot();
  expect(after.studio_review_assignments.count - before.studio_review_assignments.count).toBe(1);
  expect(after.integration_outbox.count - before.integration_outbox.count).toBe(1);
  for (const table of ["projects", "studio_handoffs", "studio_builder_workspaces", "studio_qa_runs", "studio_review_submissions", "studio_review_decisions", "prepare_prove_evidence", "curriculum_lesson_completions", "portfolio_artifacts", "website_deployments", "governed_agent_packages", "agent_registry_submissions", "learner_credentials"]) {
    expect(after[table].count, `routing-only mutation in ${table}`).toBe(before[table].count);
  }

  const pages = [];
  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 900 }]) {
    const page = await browser.newPage({ viewport });
    await page.addInitScript(() => { window.__user = { role: "instructor", email: "phase94_reviewer_b@phase9.test", name: "phase94_reviewer_b" }; });
    await page.route("**/*", (route) => route.continue({ headers: { ...route.request().headers(), authorization: `Bearer dev-token:${users.reviewerB}` } }));
    await page.goto(`${frontend}/curriculum.html#/studio/reviewer-queue`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Needs Review" })).toBeVisible();
    await expect(page.getByText("Review Work").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    const aria = await page.locator("main.ops-page").ariaSnapshot();
    expect(aria).toContain("Needs Review");
    pages.push(page);
  }
  const queuePage = pages[1];
  const refresh = queuePage.getByRole("button", { name: "Refresh" });
  await refresh.focus();
  await queuePage.keyboard.press("Enter");
  await refresh.focus();
  await queuePage.keyboard.press("Space");
  const reviewWork = queuePage.getByRole("link", { name: "Review Work" }).first();
  await reviewWork.focus();
  await queuePage.keyboard.press("Enter");
  await expect(queuePage).toHaveURL(/studio\/review\//);
  await Promise.all(pages.map((page) => page.close()));

  const emptyPage = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await emptyPage.addInitScript(() => { window.__user = { role: "instructor", email: "phase94_reviewer_inactive@phase9.test", name: "phase94_reviewer_inactive" }; });
  await emptyPage.route("**/*", (route) => route.continue({ headers: { ...route.request().headers(), authorization: `Bearer dev-token:${users.inactive}` } }));
  await emptyPage.goto(`${frontend}/curriculum.html#/studio/reviewer-queue`, { waitUntil: "domcontentloaded" });
  await expect(emptyPage.getByText("No work is waiting for your review.")).toBeVisible();
  const emptyAria = await emptyPage.locator("main.ops-page").ariaSnapshot();
  expect(emptyAria).toContain("No work is waiting for your review.");
  await emptyPage.close();

  const reduced = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await reduced.emulateMedia({ reducedMotion: "reduce" });
  await reduced.addInitScript(() => { window.__user = { role: "instructor", email: "phase94_reviewer_b@phase9.test", name: "phase94_reviewer_b" }; });
  await reduced.route("**/*", (route) => route.continue({ headers: { ...route.request().headers(), authorization: `Bearer dev-token:${users.reviewerB}` } }));
  await reduced.goto(`${frontend}/curriculum.html#/studio/reviewer-queue`, { waitUntil: "domcontentloaded" });
  await expect(reduced.getByRole("heading", { name: "Needs Review" })).toBeVisible();
  await reduced.close();
});
