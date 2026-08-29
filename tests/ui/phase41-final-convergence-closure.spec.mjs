import { test, expect } from "@playwright/test";
import "./phase40-grade12-convergence-closure.spec.mjs";

const api = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const program = "data-center-specialization-11";
const admin = "Bearer dev-token:user_admin_001";
const reviewer = "Bearer dev-token:user_reviewer_001";
const json = (token) => ({ Authorization: token, "Content-Type": "application/json" });
const learners = [
  ["user_assignment_technical_001", "technical-operations"],
  ["user_assignment_networking_001", "networking-fiber"],
  ["user_assignment_electrical_001", "electrical-infrastructure"],
  ["user_assignment_mechanical_001", "mechanical-hvac"],
  ["user_assignment_security_001", "cybersecurity-security"],
  ["user_assignment_ai_001", "ai-cloud-infrastructure"],
];

async function call(page, method, path, token, data, expected = 200) {
  let response = await page.request[method](`${api}${path}`, { headers: json(token), data });
  if (response.status() === 429) {
    const retryAfter = Number((await response.json()).error?.retry_after_seconds || 1);
    await page.waitForTimeout((retryAfter + 1) * 1000);
    response = await page.request[method](`${api}${path}`, { headers: json(token), data });
  }
  const body = await response.text();
  expect(response.status(), `${method} ${path}: ${body}`).toBe(expected);
  return body ? JSON.parse(body).data : undefined;
}

async function projectTeam(page, title, mode, members) {
  const project = await call(page, "post", "/projects", admin, { program_id: program, title, project_type: "GRADE12_CONVERGENCE_FOUNDATION" }, 201);
  const team = await call(page, "post", `/projects/${project.project_id}/teams`, admin, { mode }, 201);
  for (const [learner_id, specialization_id] of members) await call(page, "post", `/project-teams/${team.team_id}/members`, admin, { learner_id, specialization_id }, 201);
  return { project, team };
}

test("Phase 41 closes gate negatives, privacy, reassessment boundaries, and Project team-size convergence", { skip: api ? false : "disposable stack URL required", timeout: 240_000 }, async ({ page }) => {
  const noCourseLearner = "user_student_001";
  await call(page, "post", "/program-specialization-assignments", admin, { learner_id: noCourseLearner, program_id: program, specialization_id: "technical-operations", grade: 11, assignment_type: "PRIMARY", assignment_source: "PROGRAM_ASSIGNMENT" }, 201);
  const noCourse = await call(page, "get", `/programs/${program}/capstone-entry`, `Bearer dev-token:${noCourseLearner}`);
  expect(noCourse.status).toBe("CAPSTONE_ENTRY_NOT_ELIGIBLE");
  expect(noCourse.missing_requirements.map((item) => item.code)).toContain("ACTIVE_MATCHING_GRADE12_COURSE_REQUIRED");

  const crossTenant = await page.request.get(`${api}/programs/${program}/capstone-entry?learner_id=user_assignment_technical_001`, { headers: { ...json(reviewer), "x-shs-organization-id": "org_other" } });
  expect(crossTenant.status()).toBe(403);
  const employer = await page.request.get(`${api}/programs/${program}/capstone-entry`, { headers: json("Bearer dev-token:user_employer_001") });
  expect(employer.status()).toBe(403);

  // Restore the transferred learner's active branch for the six-role team fixture.
  await call(page, "post", "/program-specialization-assignments", admin, { learner_id: learners[1][0], program_id: program, specialization_id: "networking-fiber", grade: 11, assignment_type: "PRIMARY", assignment_source: "ADVISOR_CHANGE" }, 201);
  // The existing authenticated-user limiter is part of the runtime contract; let the
  // imported branch suites' admin burst window expire before the team matrix.
  await page.waitForTimeout(17_000);
  await projectTeam(page, "Phase 41 individual integrated mode", "INDIVIDUAL_INTEGRATED_MODE", [learners[0]]);
  await projectTeam(page, "Phase 41 two member team", "COLLABORATIVE_MODE", learners.slice(0, 2));
  await projectTeam(page, "Phase 41 three member team", "COLLABORATIVE_MODE", learners.slice(0, 3));
  await projectTeam(page, "Phase 41 five member team", "COLLABORATIVE_MODE", learners.slice(0, 5));
  const six = await projectTeam(page, "Phase 41 six role team", "COLLABORATIVE_MODE", learners);
  const seven = await projectTeam(page, "Phase 41 seven member duplicate role team", "COLLABORATIVE_MODE", [...learners, learners[0]]);
  expect(seven.team.status).toBe("ACTIVE");
  const incomplete = await projectTeam(page, "Phase 41 incomplete role team", "COLLABORATIVE_MODE", learners.slice(0, 3));
  expect(incomplete.team.status).toBe("ACTIVE");

  const technical = `Bearer dev-token:${learners[0][0]}`;
  const v1 = await call(page, "post", `/project-teams/${six.team.team_id}/submissions`, technical, { version: 1, payload: { artifact: "synthetic-v1" }, artifact_refs: ["synthetic://phase41-v1"] }, 201);
  const v2 = await call(page, "post", `/project-teams/${six.team.team_id}/submissions`, technical, { version: 2, payload: { artifact: "synthetic-v2" }, artifact_refs: ["synthetic://phase41-v2"] }, 201);
  expect(v1.version).toBe(1);
  expect(v2.version).toBe(2);
  const duplicate = await page.request.post(`${api}/project-teams/${six.team.team_id}/submissions`, { headers: json(technical), data: { version: 2, payload: { artifact: "overwrite" } } });
  expect(duplicate.status()).toBe(409);
  await call(page, "post", `/project-submissions/${v1.submission_id}/review`, admin, { status: "NEEDS_REVISION" });
  await call(page, "post", `/project-submissions/${v2.submission_id}/review`, admin, { status: "ACCEPTED" });
  const submissions = await call(page, "get", `/projects/${six.project.project_id}/submissions`, admin);
  expect(submissions).toHaveLength(2);
  expect(submissions.map((item) => item.status)).toEqual(["NEEDS_REVISION", "ACCEPTED"]);

  const nonMember = await page.request.post(`${api}/project-teams/${six.team.team_id}/submissions`, { headers: json("Bearer dev-token:user_student_001"), data: { version: 3, payload: {} } });
  expect(nonMember.status()).toBe(403);
});
