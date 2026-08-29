import { test, expect } from "@playwright/test";

const base = String(process.env.SHS_TEST_FRONTEND_URL || "").replace(/\/$/, "");
const api = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const learner = "Bearer dev-token:user_student_001";
const reviewer = "Bearer dev-token:user_reviewer_001";
const unauthorized = "Bearer dev-token:user_operator_001";
const headers = (token, extra = {}) => ({ Authorization: token, ...extra });

async function request(page, method, path, token, data, expected) {
  const response = await page.request[method](`${api}${path}`, { headers: headers(token), data });
  const body = await response.text();
  expect(response.status(), `${method} ${path}: ${body}`).toBe(expected);
  return body ? JSON.parse(body).data : undefined;
}

async function result(page, activity, values) {
  return request(page, "post", "/prepare-prove/activity-results", learner, { result: { activity_id: activity, ...values } }, 201);
}

async function evidence(page, resultId, criterion) {
  return request(page, "post", "/prepare-prove/evidence", learner, { source_result_id: resultId, criterion }, 201);
}

async function review(page, token, evidenceId, decision, expected = 200) {
  return request(page, "post", `/prepare-prove/evidence/${evidenceId}/review`, token, { decision }, expected);
}

const positiveScenarios = [
  ["data-center-specialization-11-cpu-gpu-workloads", "grade11-ai-cloud-workload-analysis", "CPU, GPU, Accelerators, and Workloads", "Synthetic AI workload", "workload-infrastructure-analysis"],
  ["data-center-specialization-11-capacity-bottlenecks", "grade11-ai-cloud-capacity-bottleneck-analysis", "Capacity, Utilization, and Bottleneck Analysis", "Synthetic capacity model", "capacity-bottleneck-analysis"],
];

test("AI/Cloud supports learner, reviewer, reassessment, and reporting boundaries", { skip: base && api ? false : "stack URLs required", timeout: 120_000 }, async ({ page }) => {
  for (const [lesson, activity, title, system, criterion] of positiveScenarios) {
    await page.setExtraHTTPHeaders(headers(learner));
    await page.goto(`${base}/curriculum.html#/curriculum/lessons/${lesson}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await page.getByRole("tab", { name: "Apply" }).click();
    await page.getByLabel("Observations (one fact per line)").fill("GPU utilization is high while memory pressure is rising.\nNetwork throughput remains within the synthetic scenario range.");
    await page.getByLabel("Affected system hypothesis").fill(system);
    await page.getByLabel("What remains uncertain?").fill("The simulation does not confirm a single root cause.");
    await page.getByLabel("Safe next step or escalation").fill("Compare resource signals, document the evidence, and escalate through an authorized infrastructure process.");
    await page.getByRole("button", { name: "Submit evidence for review" }).click();
    await expect(page.getByTestId("prepare-prove-proof-status")).toContainText("pending review");
    const status = await request(page, "get", `/prepare-prove/proof-status?activity_id=${activity}`, learner, undefined, 200);
    expect(status.evidence).toBeTruthy();
    expect(status.decision).toBeFalsy();
    await page.setExtraHTTPHeaders(headers(reviewer));
    await page.goto(`${base}/curriculum.html#/curriculum/instructor/prove/${status.evidence.evidence_id}`, { waitUntil: "networkidle" });
    await expect(page.getByText("Criteria version 1")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Criteria" })).toBeVisible();
    await page.getByRole("button", { name: "Record demonstrated" }).click();
    await expect(page.getByTestId("prepare-prove-review").getByRole("status")).toContainText("DEMONSTRATED");
    await page.setExtraHTTPHeaders(headers(learner));
    await page.goto(`${base}/curriculum.html#/curriculum/lessons/${lesson}`, { waitUntil: "networkidle" });
    await page.getByRole("tab", { name: "Apply" }).click();
    await expect(page.getByTestId("prepare-prove-proof-status")).toContainText("Criteria demonstrated");
    const repeated = await review(page, reviewer, status.evidence.evidence_id, "DEMONSTRATED");
    expect(repeated.decision_id).toBeTruthy();
  }

  const insufficientResult = await result(page, "grade11-ai-cloud-reliability-operations-analysis", {
    observations: ["One compute node is degraded."],
    affected_system: "AI workload",
    uncertainty: "I do not know whether storage or network is affected.",
    safe_next_step: "Delete the workload and provision an expensive public cloud instance.",
  });
  const insufficientEvidence = await evidence(page, insufficientResult.result_id, "reliability-operations-analysis");
  const selfReview = await page.request.post(`${api}/prepare-prove/evidence/${insufficientEvidence.evidence_id}/review`, { headers: headers(learner), data: { decision: "EVIDENCE_INSUFFICIENT" } });
  expect(selfReview.status()).toBe(403);
  const unauthorizedRead = await page.request.get(`${api}/prepare-prove/evidence/${insufficientEvidence.evidence_id}`, { headers: headers(unauthorized) });
  expect(unauthorizedRead.status()).toBe(403);
  const employerRead = await page.request.get(`${api}/prepare-prove/evidence/${insufficientEvidence.evidence_id}`, { headers: headers(unauthorized, { "x-shs-organization-id": "org_shf_001" }) });
  expect(employerRead.status()).toBe(403);
  const crossTenantRead = await page.request.get(`${api}/prepare-prove/evidence/${insufficientEvidence.evidence_id}`, { headers: headers(reviewer, { "x-shs-organization-id": "org_other" }) });
  expect(crossTenantRead.status()).toBe(403);
  const crossTenantReview = await page.request.post(`${api}/prepare-prove/evidence/${insufficientEvidence.evidence_id}/review`, { headers: headers(reviewer, { "x-shs-organization-id": "org_other" }), data: { decision: "EVIDENCE_INSUFFICIENT" } });
  expect(crossTenantReview.status()).toBe(403);
  await review(page, reviewer, insufficientEvidence.evidence_id, "EVIDENCE_INSUFFICIENT");
  const insufficientStatus = await request(page, "get", "/prepare-prove/proof-status?activity_id=grade11-ai-cloud-reliability-operations-analysis", learner, undefined, 200);
  expect(insufficientStatus.decision.decision).toBe("EVIDENCE_INSUFFICIENT");

  const reassessmentResult = await result(page, "grade11-ai-cloud-reliability-operations-analysis-reassessment", {
    observations: ["One compute node is degraded.", "Storage latency is rising while replicated storage remains available.", "A/B network paths are available.", "Power and cooling trends remain within the synthetic scenario range."],
    affected_system: "AI workload reliability and storage path",
    uncertainty: "The simulation does not confirm the root cause.",
    safe_next_step: "Document the evidence and escalate through an authorized infrastructure operations process.",
  });
  const reassessmentEvidence = await evidence(page, reassessmentResult.result_id, "reliability-operations-analysis");
  await review(page, reviewer, reassessmentEvidence.evidence_id, "DEMONSTRATED");
  const repeated = await review(page, reviewer, reassessmentEvidence.evidence_id, "DEMONSTRATED");
  const current = await request(page, "get", "/prepare-prove/proof-status?activity_id=grade11-ai-cloud-reliability-operations-analysis-reassessment", learner, undefined, 200);
  expect(current.decision.decision).toBe("DEMONSTRATED");
  expect(repeated.decision_id).toBe(current.decision.decision_id);
});
