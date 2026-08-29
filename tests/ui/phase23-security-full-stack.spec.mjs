import { test, expect } from "@playwright/test";

const base = String(process.env.SHS_TEST_FRONTEND_URL || "").replace(/\/$/, "");
const api = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const learner = "Bearer dev-token:user_student_001";
const reviewer = "Bearer dev-token:user_reviewer_001";
const unauthorized = "Bearer dev-token:user_operator_001";
const auth = (token, extra = {}) => ({ Authorization: token, ...extra });
const scenarios = [
  ["data-center-specialization-11-authorization-least-privilege", "grade11-security-access-control-analysis", "Authorization and Least Privilege", "Synthetic access-control model", "access-control-analysis"],
  ["data-center-specialization-11-security-monitoring-logs", "grade11-security-log-alert-interpretation", "Security Monitoring and Synthetic Logs", "Synthetic security event set", "security-log-alert-interpretation"],
];

async function request(page, method, path, token, data, expected) {
  const response = await page.request[method](`${api}${path}`, { headers: auth(token), data });
  const body = await response.text();
  expect(response.status(), `${method} ${path}: ${body}`).toBe(expected);
  return body ? JSON.parse(body).data : undefined;
}

async function submitResult(page, token, activity, values) {
  return request(page, "post", "/prepare-prove/activity-results", token, { result: { activity_id: activity, ...values } }, 201);
}

async function createEvidence(page, token, resultId, criterion) {
  return request(page, "post", "/prepare-prove/evidence", token, { source_result_id: resultId, criterion }, 201);
}

async function review(page, token, evidenceId, decision, expected = 200) {
  return request(page, "post", `/prepare-prove/evidence/${evidenceId}/review`, token, { decision }, expected);
}

test("Security specialization uses the generic proof, review, privacy, and reassessment flow", { skip: base && api ? false : "stack URLs required", timeout: 120_000 }, async ({ page }) => {
  for (const [lesson, activity, title, system, criterion] of scenarios) {
    await page.setExtraHTTPHeaders(auth(learner));
    await page.goto(`${base}/curriculum.html#/curriculum/lessons/${lesson}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await page.getByRole("tab", { name: "Apply" }).click();
    await page.getByLabel("Observations (one fact per line)").fill("A synthetic event is recorded.\nA relevant status is visible.");
    await page.getByLabel("Affected system hypothesis").fill(system);
    await page.getByLabel("What remains uncertain?").fill("The simulation does not confirm intent or root cause.");
    await page.getByLabel("Safe next step or escalation").fill("Preserve synthetic records and escalate through an authorized security process.");
    await page.getByRole("button", { name: "Submit evidence for review" }).click();
    await expect(page.getByTestId("prepare-prove-proof-status")).toContainText("pending review");
    const status = await request(page, "get", `/prepare-prove/proof-status?activity_id=${activity}`, learner, undefined, 200);
    const evidenceId = status.evidence.evidence_id;
    expect(status.decision).toBeFalsy();

    await page.setExtraHTTPHeaders(auth(reviewer));
    await page.goto(`${base}/curriculum.html#/curriculum/instructor/prove/${evidenceId}`, { waitUntil: "networkidle" });
    await expect(page.getByText("Criteria version 1")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Criteria" })).toBeVisible();
    await page.getByRole("button", { name: "Record demonstrated" }).click();
    await expect(page.getByTestId("prepare-prove-review").getByRole("status")).toContainText("DEMONSTRATED");

    await page.setExtraHTTPHeaders(auth(learner));
    await page.goto(`${base}/curriculum.html#/curriculum/lessons/${lesson}`, { waitUntil: "networkidle" });
    await page.getByRole("tab", { name: "Apply" }).click();
    await expect(page.getByTestId("prepare-prove-proof-status")).toContainText("Criteria demonstrated");
  }

  const insufficient = await submitResult(page, learner, "grade11-security-incident-documentation-escalation", {
    observations: ["A badge event occurred."],
    affected_system: "Security system",
    uncertainty: "The actor and cause are not confirmed.",
    safe_next_step: "Disable the account and delete the logs.",
  });
  const insufficientEvidence = await createEvidence(page, learner, insufficient.result_id, "security-incident-documentation-escalation");

  const selfReview = await page.request.post(`${api}/prepare-prove/evidence/${insufficientEvidence.evidence_id}/review`, { headers: auth(learner), data: { decision: "EVIDENCE_INSUFFICIENT" } });
  expect(selfReview.status()).toBe(403);
  const unauthorizedRead = await page.request.get(`${api}/prepare-prove/evidence/${insufficientEvidence.evidence_id}`, { headers: auth(unauthorized) });
  expect(unauthorizedRead.status()).toBe(403);
  const employerRead = await page.request.get(`${api}/prepare-prove/evidence/${insufficientEvidence.evidence_id}`, { headers: auth(unauthorized, { "x-shs-organization-id": "org_shf_001" }) });
  expect(employerRead.status()).toBe(403);
  const crossTenantRead = await page.request.get(`${api}/prepare-prove/evidence/${insufficientEvidence.evidence_id}`, { headers: auth(reviewer, { "x-shs-organization-id": "org_other" }) });
  expect(crossTenantRead.status()).toBe(403);
  const crossTenantReview = await page.request.post(`${api}/prepare-prove/evidence/${insufficientEvidence.evidence_id}/review`, { headers: auth(reviewer, { "x-shs-organization-id": "org_other" }), data: { decision: "EVIDENCE_INSUFFICIENT" } });
  expect(crossTenantReview.status()).toBe(403);

  await review(page, reviewer, insufficientEvidence.evidence_id, "EVIDENCE_INSUFFICIENT");
  const insufficientStatus = await request(page, "get", "/prepare-prove/proof-status?activity_id=grade11-security-incident-documentation-escalation", learner, undefined, 200);
  expect(insufficientStatus.decision.decision).toBe("EVIDENCE_INSUFFICIENT");

  const reassessment = await submitResult(page, learner, "grade11-security-incident-documentation-escalation-reassessment", {
    observations: ["A restricted-zone badge event occurred at 02:10.", "A contractor login occurred at 02:14.", "A permission change occurred at 02:16."],
    affected_system: "Identity and access-control records",
    uncertainty: "The events are correlated in time, but intent and cause remain unconfirmed.",
    safe_next_step: "Preserve synthetic records and escalate through the authorized security process.",
  });
  const reassessmentEvidence = await createEvidence(page, learner, reassessment.result_id, "security-incident-documentation-escalation");
  await review(page, reviewer, reassessmentEvidence.evidence_id, "DEMONSTRATED");
  const repeated = await review(page, reviewer, reassessmentEvidence.evidence_id, "DEMONSTRATED");
  const current = await request(page, "get", "/prepare-prove/proof-status?activity_id=grade11-security-incident-documentation-escalation-reassessment", learner, undefined, 200);
  expect(current.decision.decision).toBe("DEMONSTRATED");
  expect(repeated.decision_id).toBe(current.decision.decision_id);
});
