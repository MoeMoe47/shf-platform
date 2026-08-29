import { test, expect } from "@playwright/test";

const baseUrl = String(process.env.SHS_TEST_FRONTEND_URL || "").replace(/\/$/, "");
const apiUrl = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const learner = "Bearer dev-token:user_student_001";
const reviewer = "Bearer dev-token:user_reviewer_001";
const scenarios = [
  { lesson: "data-center-specialization-11-monitoring-proof", activity: "grade11-technical-operations-monitoring-proof", title: "Monitoring Data and Safe Technical Findings", system: "Cooling and airflow" },
  { lesson: "data-center-specialization-11-linux-inspection", activity: "grade11-technical-operations-linux-inspection", title: "Linux Systems Inspection", system: "Sandbox filesystem" },
  { lesson: "data-center-specialization-11-telemetry-troubleshooting", activity: "grade11-technical-operations-troubleshooting-documentation", title: "Service and Resource Troubleshooting", system: "Service and resource state" },
];
const headers = (authorization) => ({ Authorization: authorization });

test("Technical Operations proofs use one full-stack review workflow", {
  skip: baseUrl && apiUrl ? false : "SHS_TEST_FRONTEND_URL and SHS_TEST_API_URL are required",
  timeout: 90_000,
}, async ({ page }) => {
  for (const scenario of scenarios) {
    await page.setExtraHTTPHeaders(headers(learner));
    await page.goto(`${baseUrl}/curriculum.html#/curriculum/lessons/${scenario.lesson}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: scenario.title })).toBeVisible();
    await page.getByRole("tab", { name: "Apply" }).click();
    await page.getByLabel("Observations (one fact per line)").fill("The synthetic status is recorded.\nA relevant warning is visible.");
    await page.getByLabel("Affected system hypothesis").fill(scenario.system);
    await page.getByLabel("What remains uncertain?").fill("The synthetic evidence does not confirm root cause.");
    await page.getByLabel("Safe next step or escalation").fill("Document the observation and escalate through the approved procedure.");
    await page.getByRole("button", { name: "Submit evidence for review" }).click();
    await expect(page.getByTestId("prepare-prove-proof-status")).toContainText("pending review", { timeout: 10_000 });

    const statusResponse = await page.request.get(`${apiUrl}/prepare-prove/proof-status?activity_id=${scenario.activity}`, { headers: headers(learner) });
    expect(statusResponse.status()).toBe(200);
    const status = await statusResponse.json();
    expect(status.data.result.activity_id).toBe(scenario.activity);
    expect(status.data.decision).toBeNull();
    const evidenceId = status.data.evidence.evidence_id;

    await page.setExtraHTTPHeaders(headers(reviewer));
    await page.goto(`${baseUrl}/curriculum.html#/curriculum/instructor/prove/${evidenceId}`, { waitUntil: "networkidle" });
    await expect(page.getByTestId("prepare-prove-review")).toBeVisible();
    await expect(page.getByText("Criteria version 1")).toBeVisible();
    await page.getByRole("button", { name: "Record demonstrated" }).click();
    await expect(page.getByTestId("prepare-prove-review").getByRole("status")).toContainText("DEMONSTRATED", { timeout: 10_000 });

    await page.setExtraHTTPHeaders(headers(learner));
    await page.goto(`${baseUrl}/curriculum.html#/curriculum/lessons/${scenario.lesson}`, { waitUntil: "networkidle" });
    await page.getByRole("tab", { name: "Apply" }).click();
    await expect(page.getByTestId("prepare-prove-proof-status")).toContainText("Criteria demonstrated", { timeout: 10_000 });
  }
});
