import { test, expect } from "@playwright/test";

const baseUrl = String(process.env.SHS_TEST_FRONTEND_URL || "").replace(/\/$/, "");
const apiUrl = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const lessonId = "data-center-specialization-11-connectivity-troubleshooting";
const activityId = "grade11-networking-fiber-connectivity-troubleshooting";
const reassessmentActivityId = "grade11-networking-fiber-connectivity-troubleshooting-reassessment";
const learnerToken = "Bearer dev-token:user_student_001";
const reviewerToken = "Bearer dev-token:user_reviewer_001";
const unauthorizedToken = "Bearer dev-token:user_operator_001";
const auth = (token, extra = {}) => ({ Authorization: token, ...extra });

async function submitProof(page, token, activity, values) {
  const response = await page.request.post(`${apiUrl}/prepare-prove/activity-results`, { headers: auth(token), data: { result: { activity_id: activity, ...values } } });
  expect(response.status()).toBe(201);
  return (await response.json()).data;
}

async function createEvidence(page, token, resultId, criterion) {
  const response = await page.request.post(`${apiUrl}/prepare-prove/evidence`, { headers: auth(token), data: { source_result_id: resultId, criterion } });
  expect(response.status()).toBe(201);
  return (await response.json()).data;
}

test("Networking closure proves insufficient evidence, reassessment, history, and authorization boundaries", {
  skip: baseUrl && apiUrl ? false : "SHS_TEST_FRONTEND_URL and SHS_TEST_API_URL are required",
  timeout: 90_000,
}, async ({ page }) => {
  await page.setExtraHTTPHeaders(auth(learnerToken));
  await page.goto(`${baseUrl}/curriculum.html#/curriculum/lessons/${lessonId}`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Connectivity Troubleshooting" })).toBeVisible();
  await page.getByRole("tab", { name: "Apply" }).click();
  await page.getByLabel("Observations (one fact per line)").fill("The device has an address.");
  await page.getByLabel("Affected system hypothesis").fill("The fiber is definitely broken");
  await page.getByLabel("What remains uncertain?").fill("I have not checked the gateway or path evidence.");
  await page.getByLabel("Safe next step or escalation").fill("Ask someone else to look at it.");
  await page.getByRole("button", { name: "Submit evidence for review" }).click();
  await expect(page.getByTestId("prepare-prove-proof-status")).toContainText("pending review", { timeout: 10_000 });

  const firstResult = await submitProof(page, learnerToken, activityId, { observations: ["The device has an address."], affected_system: "The fiber is definitely broken", uncertainty: "I have not checked the gateway or path evidence.", safe_next_step: "Ask someone else to look at it." });
  const firstEvidence = await createEvidence(page, learnerToken, firstResult.result_id, "connectivity-troubleshooting");
  const selfReview = await page.request.post(`${apiUrl}/prepare-prove/evidence/${firstEvidence.evidence_id}/review`, { headers: auth(learnerToken), data: { decision: "DEMONSTRATED" } });
  expect(selfReview.status()).toBe(403);
  const staffRead = await page.request.get(`${apiUrl}/prepare-prove/evidence/${firstEvidence.evidence_id}`, { headers: auth(unauthorizedToken) });
  expect(staffRead.status()).toBe(403);
  const crossTenantRead = await page.request.get(`${apiUrl}/prepare-prove/evidence/${firstEvidence.evidence_id}`, { headers: auth(reviewerToken, { "x-shs-organization-id": "org_other" }) });
  expect(crossTenantRead.status()).toBe(403);
  const crossTenantReview = await page.request.post(`${apiUrl}/prepare-prove/evidence/${firstEvidence.evidence_id}/review`, { headers: auth(reviewerToken, { "x-shs-organization-id": "org_other" }), data: { decision: "EVIDENCE_INSUFFICIENT" } });
  expect(crossTenantReview.status()).toBe(403);

  await page.setExtraHTTPHeaders(auth(reviewerToken));
  await page.goto(`${baseUrl}/curriculum.html#/curriculum/instructor/prove/${firstEvidence.evidence_id}`, { waitUntil: "networkidle" });
  await expect(page.getByText("Criteria version 1")).toBeVisible();
  await page.getByRole("button", { name: "Record insufficient evidence" }).click();
  await expect(page.getByTestId("prepare-prove-review").getByRole("status")).toContainText("EVIDENCE_INSUFFICIENT", { timeout: 10_000 });

  await page.setExtraHTTPHeaders(auth(learnerToken));
  const firstStatus = await page.request.get(`${apiUrl}/prepare-prove/proof-status?activity_id=${activityId}`, { headers: auth(learnerToken) });
  expect((await firstStatus.json()).data.decision.decision).toBe("EVIDENCE_INSUFFICIENT");
  await page.goto(`${baseUrl}/curriculum.html#/curriculum/lessons/${lessonId}`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Apply" }).click();
  await expect(page.getByTestId("prepare-prove-proof-status")).toContainText("Evidence insufficient", { timeout: 10_000 });

  const secondResult = await submitProof(page, learnerToken, reassessmentActivityId, { observations: ["The interface is up.", "The gateway test fails."], affected_system: "Gateway path", uncertainty: "The simulation does not confirm a physical cause.", safe_next_step: "Document the result and escalate to an authorized network team." });
  const secondEvidence = await createEvidence(page, learnerToken, secondResult.result_id, "connectivity-troubleshooting");
  const secondReview = await page.request.post(`${apiUrl}/prepare-prove/evidence/${secondEvidence.evidence_id}/review`, { headers: auth(reviewerToken), data: { decision: "DEMONSTRATED" } });
  expect(secondReview.status()).toBe(200);
  const repeatedReview = await page.request.post(`${apiUrl}/prepare-prove/evidence/${secondEvidence.evidence_id}/review`, { headers: auth(reviewerToken), data: { decision: "DEMONSTRATED" } });
  expect(repeatedReview.status()).toBe(200);
  expect((await repeatedReview.json()).data.decision_id).toBe((await secondReview.json()).data.decision_id);

  const secondStatus = await page.request.get(`${apiUrl}/prepare-prove/proof-status?activity_id=${reassessmentActivityId}`, { headers: auth(learnerToken) });
  expect((await secondStatus.json()).data.decision.decision).toBe("DEMONSTRATED");
  const history = await page.request.get(`${apiUrl}/prepare-prove/evidence/${secondEvidence.evidence_id}`, { headers: auth(reviewerToken) });
  expect(history.status()).toBe(200);
});
