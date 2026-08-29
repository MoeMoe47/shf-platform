import { test, expect } from "@playwright/test";

const baseUrl = String(process.env.SHS_TEST_FRONTEND_URL || "").replace(/\/$/, "");
const apiUrl = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const lessonId = "data-center-specialization-11-monitoring-proof";
const learnerToken = "Bearer dev-token:user_student_001";
const reviewerToken = "Bearer dev-token:user_reviewer_001";
const unauthorizedToken = "Bearer dev-token:user_operator_001";

function auth(token) {
  return { Authorization: token };
}

test("Grade 11 learner to reviewer to learner proof workflow uses the disposable full stack", {
  skip: baseUrl && apiUrl ? false : "SHS_TEST_FRONTEND_URL and SHS_TEST_API_URL are required",
  timeout: 60_000,
}, async ({ page }) => {
  await page.setExtraHTTPHeaders(auth(learnerToken));
  await page.goto(`${baseUrl}/curriculum.html#/curriculum/lessons/${lessonId}`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Monitoring Data and Safe Technical Findings" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Learn" })).toBeVisible();
  await page.getByRole("tab", { name: "Apply" }).click();
  await expect(page.getByTestId("prepare-prove-proof-activity")).toBeVisible();
  await expect(page.getByText("Synthetic monitoring data")).toBeVisible();

  await page.getByLabel("Observations (one fact per line)").fill("Rack temperature is rising.\nCPU utilization is normal.\nNetwork link is active.");
  await page.getByLabel("Affected system hypothesis").fill("Cooling and airflow");
  await page.getByLabel("What remains uncertain?").fill("The synthetic data does not identify the physical cause.");
  await page.getByLabel("Safe next step or escalation").fill("Record the trend and escalate to the qualified facilities team; do not open equipment.");
  await page.getByRole("button", { name: "Submit evidence for review" }).click();
  await expect(page.getByTestId("prepare-prove-proof-status")).toContainText("pending review", { timeout: 10_000 });

  const learnerStatus = await page.request.get(`${apiUrl}/prepare-prove/proof-status`, { headers: auth(learnerToken) });
  expect(learnerStatus.status()).toBe(200);
  const statusBody = await learnerStatus.json();
  expect(statusBody.data.decision).toBeNull();
  const evidenceId = statusBody.data.evidence.evidence_id;

  const selfReview = await page.request.post(`${apiUrl}/prepare-prove/evidence/${evidenceId}/review`, {
    headers: auth(learnerToken), data: { decision: "DEMONSTRATED" },
  });
  expect(selfReview.status()).toBe(403);

  const unauthorizedReview = await page.request.get(`${apiUrl}/prepare-prove/evidence/${evidenceId}`, { headers: auth(unauthorizedToken) });
  expect(unauthorizedReview.status()).toBe(403);

  await page.setExtraHTTPHeaders(auth(reviewerToken));
  await page.goto(`${baseUrl}/curriculum.html#/curriculum/instructor/prove/${evidenceId}`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("prepare-prove-review")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Evidence Review" })).toBeVisible();
  await expect(page.getByText("Criteria version 1")).toBeVisible();
  await expect(page.getByText("Rack temperature is rising.")).toBeVisible();
  await page.getByRole("button", { name: "Record demonstrated" }).click();
  await expect(page.getByTestId("prepare-prove-review").getByRole("status")).toContainText("DEMONSTRATED", { timeout: 10_000 });

  const repeatedReview = await page.request.post(`${apiUrl}/prepare-prove/evidence/${evidenceId}/review`, {
    headers: auth(reviewerToken), data: { decision: "DEMONSTRATED" },
  });
  expect(repeatedReview.status()).toBe(200);

  await page.setExtraHTTPHeaders(auth(learnerToken));
  await page.goto(`${baseUrl}/curriculum.html#/curriculum/lessons/${lessonId}`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Apply" }).click();
  await expect(page.getByTestId("prepare-prove-proof-status")).toContainText("Criteria demonstrated", { timeout: 10_000 });

  const crossTenant = await page.request.get(`${apiUrl}/prepare-prove/evidence/${evidenceId}`, {
    headers: { ...auth(reviewerToken), "x-shs-organization-id": "org_other" },
  });
  expect(crossTenant.status()).toBe(403);

  const secondEvidence = await page.request.post(`${apiUrl}/prepare-prove/evidence`, {
    headers: auth(learnerToken), data: { source_result_id: statusBody.data.result.result_id, criterion: "insufficient-finding" },
  });
  expect(secondEvidence.status()).toBe(201);
  const insufficientId = (await secondEvidence.json()).data.evidence_id;
  const insufficientReview = await page.request.post(`${apiUrl}/prepare-prove/evidence/${insufficientId}/review`, {
    headers: auth(reviewerToken), data: { decision: "EVIDENCE_INSUFFICIENT" },
  });
  expect(insufficientReview.status()).toBe(200);
  const insufficientStatus = await page.request.get(`${apiUrl}/prepare-prove/proof-status`, { headers: auth(learnerToken) });
  expect(insufficientStatus.status()).toBe(200);
  expect((await insufficientStatus.json()).data.decision.decision).toBe("EVIDENCE_INSUFFICIENT");
});
