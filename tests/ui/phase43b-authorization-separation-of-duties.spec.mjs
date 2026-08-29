import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { establishGrade11 } from "./phase43a-capstone-test-helpers.mjs";

const api = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const program = "data-center-specialization-11";
const learnerId = "user_assignment_technical_001";
const token = (id) => `Bearer dev-token:${id}`;
const headers = (auth, extra = {}) => ({ Authorization: auth, "Content-Type": "application/json", ...extra });
const actors = {
  learner: token(learnerId), ordinary: token("user_phase43b_staff_001"), course: token("user_phase43b_course_001"), manager: token("user_phase43b_manager_001"), projectReviewer: token("user_phase43b_project_reviewer_001"), competencyReviewer: token("user_phase43b_competency_reviewer_001"), academic: token("user_phase43b_academic_001"), crossTenant: token("user_other_admin_001"), employer: token("user_employer_001"),
};
async function request(page, method, path, auth, data, expected) {
  const response = await page.request[method](`${api}${path}`, { headers: headers(auth), data });
  const body = await response.text();
  if (expected !== undefined) expect(response.status(), `${method} ${path}: ${body}`).toBe(expected);
  return { status: response.status(), body: body ? JSON.parse(body) : null };
}
function db(sql) { return execFileSync("psql", [process.env.SHS_TEST_DATABASE_URL, "-At", "-F", "\t", "-c", sql], { encoding: "utf8" }).trim(); }

test("Phase 43B proves authorization and separation of duties", { timeout: 240_000 }, async ({ page }) => {
  await request(page, "post", "/program-specialization-assignments", actors.academic, { learner_id: learnerId, program_id: program, specialization_id: "technical-operations", grade: 11, assignment_type: "PRIMARY", assignment_source: "PROGRAM_ASSIGNMENT" }, 201);
  const project = await request(page, "post", "/projects", actors.academic, { program_id: program, title: "Phase 43B authorization fixture", project_type: "AUTHORIZATION_FIXTURE" }, 201);
  const team = await request(page, "post", `/projects/${project.body.data.project_id}/teams`, actors.manager, { mode: "COLLABORATIVE_MODE" }, 201);
  await request(page, "post", "/program-specialization-assignments", actors.academic, { learner_id: "user_assignment_networking_001", program_id: program, specialization_id: "networking-fiber", grade: 11, assignment_type: "PRIMARY", assignment_source: "PROGRAM_ASSIGNMENT" }, 201);
  const member = await request(page, "post", `/project-teams/${team.body.data.team_id}/members`, actors.manager, { learner_id: learnerId, specialization_id: "technical-operations" }, 201);
  const submission = await request(page, "post", `/project-teams/${team.body.data.team_id}/submissions`, actors.learner, { version: 1, payload: { synthetic: true } }, 201);
  await establishGrade11(page, learnerId, "technical-operations");

  const gateRows = [];
  for (const [name, auth, expected] of [["learner self", actors.learner, 200], ["authorized academic", actors.academic, 200], ["ordinary staff", actors.ordinary, 403], ["cross tenant", actors.crossTenant, 403], ["employer", actors.employer, 403]]) {
    const row = await request(page, "get", `/programs/${program}/capstone-entry?learner_id=${learnerId}`, auth);
    gateRows.push({ name, status: row.status, expected }); expect(row.status).toBe(expected);
    if (expected !== 200) expect(JSON.stringify(row.body)).not.toMatch(/CAPSTONE_ENTRY_|missing_requirements|course_id/);
  }
  const courseRows = [];
  for (const [name, auth, expected] of [["course assigner", actors.course, 201], ["learner", actors.learner, 403], ["ordinary staff", actors.ordinary, 403], ["project manager", actors.manager, 403], ["project reviewer", actors.projectReviewer, 403], ["competency reviewer", actors.competencyReviewer, 403], ["cross tenant", actors.crossTenant, 400], ["employer", actors.employer, 403]]) {
    const row = await request(page, "post", "/program-course-assignments", auth, { learner_id: learnerId, program_id: program, course_id: "data-center-technical-operations-12", specialization_id: "technical-operations" }); courseRows.push({ name, status: row.status, expected, body: row.body }); console.log(`[phase43b-course] ${JSON.stringify(courseRows.at(-1))}`); expect(row.status, JSON.stringify(row.body)).toBe(expected);
  }
  const teamRows = [];
  for (const [name, auth, expected] of [["manager", actors.manager, 201], ["learner", actors.learner, 403], ["ordinary staff", actors.ordinary, 403], ["course assigner", actors.course, 403], ["project reviewer", actors.projectReviewer, 403], ["competency reviewer", actors.competencyReviewer, 403], ["cross tenant", actors.crossTenant, 403], ["employer", actors.employer, 403]]) {
    const row = await request(page, "post", `/project-teams/${team.body.data.team_id}/members`, auth, { learner_id: "user_assignment_networking_001", specialization_id: "networking-fiber" }); teamRows.push({ name, status: row.status, expected }); expect(row.status).toBe(expected);
  }
  const teamReadRows = [];
  for (const [name, auth, expected] of [["authorized academic", actors.academic, 200], ["team learner", actors.learner, 403], ["ordinary staff", actors.ordinary, 403], ["course assigner", actors.course, 403], ["competency reviewer", actors.competencyReviewer, 403], ["cross tenant", actors.crossTenant, 403], ["employer", actors.employer, 403]]) {
    const row = await request(page, "get", `/projects/${project.body.data.project_id}/submissions`, auth); teamReadRows.push({ name, status: row.status, expected }); expect(row.status).toBe(expected);
  }
  const reviewRows = [];
  for (const [name, auth, expected] of [["project reviewer", actors.projectReviewer, 200], ["learner", actors.learner, 403], ["ordinary staff", actors.ordinary, 403], ["course assigner", actors.course, 403], ["manager", actors.manager, 403], ["competency reviewer", actors.competencyReviewer, 403], ["cross tenant", actors.crossTenant, 403], ["employer", actors.employer, 403]]) {
    const row = await request(page, "post", `/project-submissions/${submission.body.data.submission_id}/review`, auth, { status: "NEEDS_REVISION" }); reviewRows.push({ name, status: row.status, expected }); expect(row.status).toBe(expected);
  }
  const evidence = await request(page, "post", "/prepare-prove/activity-results", actors.learner, { result: { activity_id: "grade12-technical-operations-multi-system-operations-analysis", observations: ["Synthetic authorization fixture."], safe_next_step: "Escalate through approved review." } }, 201);
  const evidenceRow = await request(page, "post", "/prepare-prove/evidence", actors.learner, { source_result_id: evidence.body.data.result_id, criterion: "phase43b" }, 201);
  const competencyRows = [];
  for (const [name, auth, expected] of [["competency reviewer", actors.competencyReviewer, 200], ["learner", actors.learner, 403], ["ordinary staff", actors.ordinary, 403], ["course assigner", actors.course, 403], ["manager", actors.manager, 403], ["project reviewer", actors.projectReviewer, 403], ["cross tenant", actors.crossTenant, 403], ["employer", actors.employer, 403]]) {
    const row = await request(page, "post", `/prepare-prove/evidence/${evidenceRow.body.data.evidence_id}/review`, auth, { decision: "DEMONSTRATED" }); competencyRows.push({ name, status: row.status, expected }); expect(row.status).toBe(expected);
  }
  const courseOnlyProject = await request(page, "post", `/projects/${project.body.data.project_id}/teams`, actors.course, { mode: "COLLABORATIVE_MODE" }); expect(courseOnlyProject.status).toBe(403);
  const counts = db(`SELECT (SELECT COUNT(*) FROM project_team_members WHERE team_id='${team.body.data.team_id}'), (SELECT COUNT(*) FROM project_submissions WHERE submission_id='${submission.body.data.submission_id}'), (SELECT COUNT(*) FROM learner_competency_decisions WHERE evidence_id='${evidenceRow.body.data.evidence_id}')`);
  expect(counts).toBe("2\t1\t1");
  const spoofedHeader = await request(page, "get", `/programs/${program}/capstone-entry?learner_id=${learnerId}`, actors.academic, undefined);
  expect(spoofedHeader.status).toBe(200);
  const headerSpoof = await page.request.get(`${api}/programs/${program}/capstone-entry?learner_id=${learnerId}`, { headers: headers(actors.academic, { "x-shs-organization-id": "org_other" }) });
  expect(headerSpoof.status()).toBe(403);
  console.log(`[phase43b-auth] ${JSON.stringify({ gateRows, courseRows, teamRows, teamReadRows, reviewRows, competencyRows, member: member.body.data.role_id, course_assignment: "program.course.assign", team_management: "project.team.manage", project_review: "project.submission.review", competency_review: "verification.review+verification.approve", gate_read: "curriculum.lesson.complete + program.read", team_read_route: "GET /projects/:projectId/submissions (no dedicated roster endpoint)" })}`);
});
