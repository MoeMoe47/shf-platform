import { expect } from "@playwright/test";

export const api = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
export const program = "data-center-specialization-11";
export const admin = "Bearer dev-token:user_admin_001";
export const reviewer = "Bearer dev-token:user_reviewer_001";
export const otherAdmin = "Bearer dev-token:user_other_admin_001";
export const employer = "Bearer dev-token:user_employer_001";
export const branchData = {
  "technical-operations": { course: "data-center-technical-operations-12", g11: ["data-center-specialization-11-monitoring-proof", "data-center-specialization-11-linux-inspection", "data-center-specialization-11-telemetry-troubleshooting"], g11a: ["grade11-technical-operations-monitoring-proof", "grade11-technical-operations-linux-inspection", "grade11-technical-operations-troubleshooting-documentation"], g12: ["data-center-specialization-12-monitoring-proof", "data-center-specialization-12-runbooks-operational-handoffs", "data-center-specialization-12-advanced-technical-operations-project"], proof: "grade12-technical-operations-multi-system-operations-analysis" },
  "networking-fiber": { course: "data-center-networking-fiber-12", g11: ["data-center-specialization-11-network-topology", "data-center-specialization-11-connectivity-troubleshooting", "data-center-specialization-11-networking-fiber-project"], g11a: ["grade11-networking-fiber-topology-interpretation", "grade11-networking-fiber-connectivity-troubleshooting", "grade11-networking-fiber-cabling-documentation"], g12: ["data-center-specialization-12-network-architecture-dependencies", "data-center-specialization-12-network-incident-coordination", "data-center-specialization-12-advanced-networking-project"], proof: "grade12-networking-fiber-resilient-network-path-analysis" },
  "electrical-infrastructure": { course: "data-center-electrical-infrastructure-12", g11: ["data-center-specialization-11-power-paths", "data-center-specialization-11-load-capacity", "data-center-specialization-11-electrical-incident-project"], g11a: ["grade11-electrical-power-path-interpretation", "grade11-electrical-load-capacity-reasoning", "grade11-electrical-infrastructure-incident-analysis"], g12: ["data-center-specialization-12-critical-power-architecture", "data-center-specialization-12-critical-power-incident-coordination", "data-center-specialization-12-advanced-electrical-infrastructure-project"], proof: "grade12-electrical-infrastructure-critical-power-reliability-analysis" },
  "mechanical-hvac": { course: "data-center-mechanical-hvac-12", g11: ["data-center-specialization-11-airflow-management", "data-center-specialization-11-cooling-capacity", "data-center-specialization-11-thermal-incident-project"], g11a: ["grade11-mechanical-hvac-thermal-airflow-interpretation", "grade11-mechanical-hvac-cooling-capacity-reliability", "grade11-mechanical-hvac-cooling-incident-analysis"], g12: ["data-center-specialization-12-advanced-thermal-infrastructure", "data-center-specialization-12-environmental-monitoring-trends", "data-center-specialization-12-advanced-mechanical-hvac-project"], proof: "grade12-mechanical-hvac-thermal-capacity-reliability-analysis" },
  "cybersecurity-security": { course: "data-center-cybersecurity-security-12", g11: ["data-center-specialization-11-authorization-least-privilege", "data-center-specialization-11-security-monitoring-logs", "data-center-specialization-11-security-incident-project"], g11a: ["grade11-security-access-control-analysis", "grade11-security-log-alert-interpretation", "grade11-security-incident-documentation-escalation"], g12: ["data-center-specialization-12-advanced-identity-access-governance", "data-center-specialization-12-incident-evidence-preservation", "data-center-specialization-12-advanced-security-project"], proof: "grade12-cybersecurity-security-access-governance-analysis" },
  "ai-cloud-infrastructure": { course: "data-center-ai-cloud-infrastructure-12", g11: ["data-center-specialization-11-cpu-gpu-workloads", "data-center-specialization-11-capacity-bottlenecks", "data-center-specialization-11-ai-cloud-project"], g11a: ["grade11-ai-cloud-workload-analysis", "grade11-ai-cloud-capacity-bottleneck-analysis", "grade11-ai-cloud-reliability-operations-analysis"], g12: ["data-center-specialization-12-advanced-multi-node-compute", "data-center-specialization-12-reliability-redundancy-observability", "data-center-specialization-12-advanced-ai-cloud-infrastructure-project"], proof: "grade12-ai-cloud-infrastructure-capacity-bottleneck-analysis" },
};
export const shared11 = ["data-center-specialization-11-safety-professional-practice", "data-center-specialization-11-technical-communication", "data-center-specialization-11-reliability-systems-thinking", "data-center-specialization-11-evidence-and-feedback", "data-center-specialization-11-career-transition-planning"];
export const shared12 = ["data-center-specialization-12-advanced-technical-communication", "data-center-specialization-12-change-risk-escalation", "data-center-specialization-12-cross-team-collaboration", "data-center-specialization-12-evidence-quality-defense", "data-center-specialization-12-career-postsecondary-transition"];

export const token = (id) => `Bearer dev-token:${id}`;
export const headers = (value) => ({ Authorization: value, "Content-Type": "application/json" });
export async function call(page, method, path, auth, data, expected = 200) {
  const response = await page.request[method](`${api}${path}`, { headers: headers(auth), data });
  const body = await response.text();
  expect(response.status(), `${method} ${path}: ${body}`).toBe(expected);
  return body ? JSON.parse(body).data : undefined;
}
export async function status(page, method, path, auth, data) {
  const response = await page.request[method](`${api}${path}`, { headers: headers(auth), data });
  const body = await response.text();
  return { status: response.status(), body: body ? JSON.parse(body) : undefined };
}
export async function proof(page, learner, activityId, criterion, reviewDecision = "DEMONSTRATED") {
  const result = await call(page, "post", "/prepare-prove/activity-results", learner, { result: { activity_id: activityId, observations: ["Synthetic evidence was reviewed."], uncertainty: "The scenario does not establish root cause.", safe_next_step: "Document and escalate through the authorized workflow." } }, 201);
  const evidence = await call(page, "post", "/prepare-prove/evidence", learner, { source_result_id: result.result_id, criterion }, 201);
  if (reviewDecision) await call(page, "post", `/prepare-prove/evidence/${evidence.evidence_id}/review`, reviewer, { decision: reviewDecision }, 200);
  return { result, evidence };
}
export async function establishGrade11(page, learnerId, specialization) {
  const branch = branchData[specialization];
  await call(page, "post", "/program-specialization-assignments", admin, { learner_id: learnerId, program_id: program, specialization_id: specialization, grade: 11, assignment_type: "PRIMARY", assignment_source: "PROGRAM_ASSIGNMENT" }, 201);
  for (const lesson of [...shared11, ...branch.g11]) await call(page, "post", `/curriculum/lessons/${lesson}/complete`, token(learnerId), { curriculum: program });
  for (const activity of branch.g11a) await proof(page, token(learnerId), activity, "phase43a-grade11");
}
export async function establishGrade12(page, learnerId, specialization, { review = "DEMONSTRATED", omitCourse = false, omitShared12 = false, omitBranch12 = false, omitProof = false } = {}) {
  const branch = branchData[specialization];
  if (!omitCourse) await call(page, "post", "/program-course-assignments", admin, { learner_id: learnerId, program_id: program, course_id: branch.course, specialization_id: specialization }, 201);
  const lessons = [...(omitShared12 ? shared12.slice(1) : shared12), ...(omitBranch12 ? branch.g12.slice(1) : branch.g12)];
  for (const lesson of lessons) await call(page, "post", `/curriculum/lessons/${lesson}/complete`, token(learnerId), { curriculum: branch.course });
  if (!omitProof) return proof(page, token(learnerId), branch.proof, "phase43a-grade12", review);
  return undefined;
}
export async function gate(page, auth) { return call(page, "get", `/programs/${program}/capstone-entry`, auth); }
