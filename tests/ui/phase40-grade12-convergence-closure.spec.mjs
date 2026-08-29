import { test, expect } from "@playwright/test";
import "./phase32-grade12-reference-closure-full-stack.spec.mjs";
import "./phase33-grade12-networking-advanced-full-stack.spec.mjs";
import "./phase34-grade12-electrical-advanced-full-stack.spec.mjs";
import "./phase35-grade12-mechanical-hvac-advanced-full-stack.spec.mjs";
import "./phase36-grade12-security-advanced-full-stack.spec.mjs";
import "./phase38-grade12-ai-cloud-advanced-full-stack.spec.mjs";

const api = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const program = "data-center-specialization-11";
const admin = "Bearer dev-token:user_admin_001";
const json = (token) => ({ Authorization: token, "Content-Type": "application/json" });
const branches = [
  { learner: "user_assignment_technical_001", specialization: "technical-operations", course: "data-center-technical-operations-12", lessons: ["data-center-specialization-12-monitoring-proof", "data-center-specialization-12-runbooks-operational-handoffs", "data-center-specialization-12-advanced-technical-operations-project"], proof: "grade12-technical-operations-multi-system-operations-analysis" },
  { learner: "user_assignment_networking_001", specialization: "networking-fiber", course: "data-center-networking-fiber-12", lessons: ["data-center-specialization-12-network-architecture-dependencies", "data-center-specialization-12-network-incident-coordination", "data-center-specialization-12-advanced-networking-project"], proof: "grade12-networking-fiber-resilient-network-path-analysis" },
  { learner: "user_assignment_electrical_001", specialization: "electrical-infrastructure", course: "data-center-electrical-infrastructure-12", lessons: ["data-center-specialization-12-critical-power-architecture", "data-center-specialization-12-critical-power-incident-coordination", "data-center-specialization-12-advanced-electrical-infrastructure-project"], proof: "grade12-electrical-infrastructure-critical-power-reliability-analysis" },
  { learner: "user_assignment_mechanical_001", specialization: "mechanical-hvac", course: "data-center-mechanical-hvac-12", lessons: ["data-center-specialization-12-advanced-thermal-infrastructure", "data-center-specialization-12-environmental-monitoring-trends", "data-center-specialization-12-advanced-mechanical-hvac-project"], proof: "grade12-mechanical-hvac-thermal-capacity-reliability-analysis" },
  { learner: "user_assignment_security_001", specialization: "cybersecurity-security", course: "data-center-cybersecurity-security-12", lessons: ["data-center-specialization-12-advanced-identity-access-governance", "data-center-specialization-12-incident-evidence-preservation", "data-center-specialization-12-advanced-security-project"], proof: "grade12-cybersecurity-security-access-governance-analysis" },
  { learner: "user_assignment_ai_001", specialization: "ai-cloud-infrastructure", course: "data-center-ai-cloud-infrastructure-12", lessons: ["data-center-specialization-12-advanced-multi-node-compute", "data-center-specialization-12-reliability-redundancy-observability", "data-center-specialization-12-advanced-ai-cloud-infrastructure-project"], proof: "grade12-ai-cloud-infrastructure-capacity-bottleneck-analysis" },
];
const shared = ["data-center-specialization-12-advanced-technical-communication", "data-center-specialization-12-change-risk-escalation", "data-center-specialization-12-cross-team-collaboration", "data-center-specialization-12-evidence-quality-defense", "data-center-specialization-12-career-postsecondary-transition"];

async function call(page, method, path, token, data, expected = 200) {
  const response = await page.request[method](`${api}${path}`, { headers: json(token), data });
  const body = await response.text();
  expect(response.status(), `${method} ${path}: ${body}`).toBe(expected);
  return body ? JSON.parse(body).data : undefined;
}

test("Phase 40 proves six real branches satisfy the derived capstone gate and remain isolated", { skip: api ? false : "disposable stack URL required", timeout: 240_000 }, async ({ page }) => {
  for (const branch of branches) {
    const token = `Bearer dev-token:${branch.learner}`;
    for (const lesson of shared) await call(page, "post", `/curriculum/lessons/${lesson}/complete`, token, { curriculum: branch.course });
    for (const lesson of branch.lessons) await call(page, "post", `/curriculum/lessons/${lesson}/complete`, token, { curriculum: branch.course });
    const gate = await call(page, "get", `/programs/${program}/capstone-entry`, token);
    expect(gate.status, branch.specialization).toBe("CAPSTONE_ENTRY_ELIGIBLE");
    expect(gate.policy_version).toBe("grade12-capstone-entry-v1");
    expect(gate.capstone_status).toBe("ARCHITECTURE_DEFINED_NON_EXECUTABLE");
    expect(gate.course_id).toBe(branch.course);
  }

  const noAssignment = await call(page, "get", `/programs/${program}/capstone-entry`, "Bearer dev-token:user_no_assignment_001");
  expect(noAssignment.status).toBe("CAPSTONE_ENTRY_NOT_ELIGIBLE");
  expect(noAssignment.missing_requirements.map((item) => item.code)).toContain("ACTIVE_SPECIALIZATION_REQUIRED");

  const transferLearner = branches[1];
  await call(page, "post", "/program-specialization-assignments", admin, { learner_id: transferLearner.learner, program_id: program, specialization_id: "ai-cloud-infrastructure", grade: 11, assignment_type: "PRIMARY", assignment_source: "ADVISOR_CHANGE" }, 201);
  const relocked = await call(page, "get", `/programs/${program}/capstone-entry`, `Bearer dev-token:${transferLearner.learner}`);
  expect(relocked.status).toBe("CAPSTONE_ENTRY_NOT_ELIGIBLE");
  expect(relocked.specialization_id).toBe("ai-cloud-infrastructure");

  for (let index = 0; index < branches.length; index += 1) {
    const source = branches[index];
    const target = branches[(index + 1) % branches.length];
    const token = `Bearer dev-token:${source.learner}`;
    const proof = await page.request.post(`${api}/prepare-prove/activity-results`, { headers: json(token), data: { result: { activity_id: target.proof, observations: ["Cross-branch attempt."], safe_next_step: "Stop and use the authorized branch workflow." } } });
    expect(proof.status(), `${source.specialization} -> ${target.specialization} proof`).toBe(403);
    const completion = await page.request.post(`${api}/curriculum/lessons/${target.lessons[0]}/complete`, { headers: json(token), data: { curriculum: target.course } });
    expect(completion.status(), `${source.specialization} -> ${target.specialization} completion`).toBe(403);
    const assignment = await page.request.post(`${api}/program-course-assignments`, { headers: json(admin), data: { learner_id: source.learner, program_id: program, course_id: target.course, specialization_id: target.specialization } });
    expect(assignment.status(), `${source.specialization} -> ${target.specialization} assignment`).toBe(400);
  }
});
