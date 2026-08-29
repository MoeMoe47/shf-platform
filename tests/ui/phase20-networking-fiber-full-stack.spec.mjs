import { test, expect } from "@playwright/test";

const baseUrl = String(process.env.SHS_TEST_FRONTEND_URL || "").replace(/\/$/, "");
const apiUrl = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const learner = "Bearer dev-token:user_student_001";
const reviewer = "Bearer dev-token:user_reviewer_001";
const scenarios = [
  { lesson: "data-center-specialization-11-network-topology", activity: "grade11-networking-fiber-topology-interpretation", title: "Network Architecture and Topology", system: "Network path" },
  { lesson: "data-center-specialization-11-connectivity-troubleshooting", activity: "grade11-networking-fiber-connectivity-troubleshooting", title: "Connectivity Troubleshooting", system: "Gateway path" },
  { lesson: "data-center-specialization-11-structured-cabling", activity: "grade11-networking-fiber-cabling-documentation", title: "Structured Cabling and Documentation", system: "Structured cable path" },
];
const headers = (authorization) => ({ Authorization: authorization });

test("Networking and Fiber proofs use the generic full-stack review workflow", {
  skip: baseUrl && apiUrl ? false : "SHS_TEST_FRONTEND_URL and SHS_TEST_API_URL are required",
  timeout: 90_000,
}, async ({ page }) => {
  for (const scenario of scenarios) {
    await page.setExtraHTTPHeaders(headers(learner));
    await page.goto(`${baseUrl}/curriculum.html#/curriculum/lessons/${scenario.lesson}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: scenario.title })).toBeVisible();
    await page.getByRole("tab", { name: "Apply" }).click();
    await page.getByLabel("Observations (one fact per line)").fill("The synthetic network state is recorded.\nA relevant link or path warning is visible.");
    await page.getByLabel("Affected system hypothesis").fill(scenario.system);
    await page.getByLabel("What remains uncertain?").fill("The synthetic evidence does not confirm the physical root cause.");
    await page.getByLabel("Safe next step or escalation").fill("Document the evidence and escalate through the approved network procedure.");
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
