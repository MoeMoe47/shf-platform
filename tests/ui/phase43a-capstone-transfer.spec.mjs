import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { admin, branchData, call, establishGrade11, establishGrade12, gate, program, token } from "./phase43a-capstone-test-helpers.mjs";

test("Phase 43A proves transfer re-lock and new-branch re-unlock", { timeout: 240_000 }, async ({ page }) => {
  const learnerId = "user_assignment_networking_001";
  const learner = token(learnerId);

  await establishGrade11(page, learnerId, "networking-fiber");
  await establishGrade12(page, learnerId, "networking-fiber");
  const before = await gate(page, learner);
  expect(before.status).toBe("CAPSTONE_ENTRY_ELIGIBLE");

  await call(page, "post", "/program-specialization-assignments", admin, { learner_id: learnerId, program_id: program, specialization_id: "ai-cloud-infrastructure", grade: 11, assignment_type: "PRIMARY", assignment_source: "ADVISOR_CHANGE" }, 201);
  const relocked = await gate(page, learner);
  expect(relocked.status).toBe("CAPSTONE_ENTRY_NOT_ELIGIBLE");
  expect(relocked.specialization_id).toBe("ai-cloud-infrastructure");

  await establishGrade11(page, learnerId, "ai-cloud-infrastructure");
  await establishGrade12(page, learnerId, "ai-cloud-infrastructure");
  const after = await gate(page, learner);
  expect(after.status).toBe("CAPSTONE_ENTRY_ELIGIBLE");
  expect(after.specialization_id).toBe("ai-cloud-infrastructure");
  expect(after.course_id).toBe(branchData["ai-cloud-infrastructure"].course);

  const assignments = await call(page, "get", `/program-specialization-assignments/${learnerId}?program_id=${program}`, admin);
  expect(assignments.some((row) => row.specialization_id === "networking-fiber" && row.status === "TRANSFERRED")).toBeTruthy();
  expect(assignments.some((row) => row.specialization_id === "ai-cloud-infrastructure" && row.status === "ACTIVE")).toBeTruthy();
  const courses = await call(page, "get", `/program-course-assignments/${learnerId}`, admin);
  expect(courses.some((row) => row.course_id === branchData["networking-fiber"].course && row.status === "TRANSFERRED")).toBeTruthy();
  expect(courses.some((row) => row.course_id === branchData["ai-cloud-infrastructure"].course && row.status === "ACTIVE")).toBeTruthy();
  const db = (sql) => execFileSync("psql", [process.env.SHS_TEST_DATABASE_URL, "-At", "-F", "\t", "-c", sql], { encoding: "utf8" }).trim();
  const history = db(`SELECT (SELECT COUNT(*) FROM program_specialization_assignments WHERE learner_id='${learnerId}' AND specialization_id='networking-fiber' AND status='TRANSFERRED'), (SELECT COUNT(*) FROM program_specialization_assignments WHERE learner_id='${learnerId}' AND specialization_id='ai-cloud-infrastructure' AND status='ACTIVE'), (SELECT COUNT(*) FROM program_course_assignments WHERE learner_id='${learnerId}' AND course_id='${branchData["networking-fiber"].course}' AND status='TRANSFERRED'), (SELECT COUNT(*) FROM program_course_assignments WHERE learner_id='${learnerId}' AND course_id='${branchData["ai-cloud-infrastructure"].course}' AND status='ACTIVE'), (SELECT COUNT(*) FROM prepare_prove_activity_results WHERE user_id='${learnerId}' AND activity_id IN ('${branchData["networking-fiber"].proof}','${branchData["ai-cloud-infrastructure"].proof}')), (SELECT COUNT(*) FROM prepare_prove_evidence WHERE user_id='${learnerId}' AND activity_id IN ('${branchData["networking-fiber"].proof}','${branchData["ai-cloud-infrastructure"].proof}')), (SELECT COUNT(*) FROM learner_competency_decisions WHERE user_id='${learnerId}'), (SELECT COUNT(*) FROM projects WHERE created_by_user_id='${learnerId}'), (SELECT COUNT(*) FROM project_teams)`);
  const [oldSpecialization, currentSpecialization, oldCourse, currentCourse, results, evidence, decisions, projects, teams] = history.split("\t").map(Number);
  expect(oldSpecialization).toBe(1);
  expect(currentSpecialization).toBe(1);
  expect(oldCourse).toBe(1);
  expect(currentCourse).toBe(1);
  expect(results).toBeGreaterThanOrEqual(2);
  expect(evidence).toBeGreaterThanOrEqual(2);
  expect(decisions).toBeGreaterThanOrEqual(2);
  expect(projects).toBe(0);
  expect(teams).toBe(0);
  console.log(`[phase43a-transfer] ${JSON.stringify({ before: before.status, relocked: relocked.status, after: after.status, specialization_history: assignments, course_history: courses })}`);
});
