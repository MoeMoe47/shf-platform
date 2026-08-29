import { test, expect } from "@playwright/test";
const base = String(process.env.SHS_TEST_FRONTEND_URL || "").replace(/\/$/, "");
const api = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const learner = "Bearer dev-token:user_student_001";
const reviewer = "Bearer dev-token:user_reviewer_001";
const scenarios = [
  ["data-center-specialization-11-airflow-management", "grade11-mechanical-hvac-thermal-airflow-interpretation", "Airflow and Thermal Zones", "Thermal and airflow system"],
  ["data-center-specialization-11-cooling-capacity", "grade11-mechanical-hvac-cooling-capacity-reliability", "Cooling Load, Capacity, and Headroom", "Cooling capacity model"],
];
const headers = (token) => ({ Authorization: token });
async function post(page, path, token, data) {
  const response = await page.request.post(`${api}${path}`, { headers: headers(token), data });
  const body = await response.text();
  expect(response.status(), `${path}: ${body}`).toBeGreaterThanOrEqual(200);
  expect(response.status(), `${path}: ${body}`).toBeLessThan(300);
  return JSON.parse(body).data;
}
test("Mechanical and HVAC candidates use the generic proof and reassessment flow", { skip: base && api ? false : "stack URLs required", timeout: 90_000 }, async ({ page }) => {
  for (const [lesson, activity, title, system] of scenarios) {
    await page.setExtraHTTPHeaders(headers(learner));
    await page.goto(`${base}/curriculum.html#/curriculum/lessons/${lesson}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await page.getByRole("tab", { name: "Apply" }).click();
    await page.getByLabel("Observations (one fact per line)").fill("A synthetic environmental reading is recorded.\nA relevant thermal warning is visible.");
    await page.getByLabel("Affected system hypothesis").fill(system);
    await page.getByLabel("What remains uncertain?").fill("The simulation does not confirm a physical cause.");
    await page.getByLabel("Safe next step or escalation").fill("Document the evidence and escalate to an authorized mechanical team.");
    await page.getByRole("button", { name: "Submit evidence for review" }).click();
    await expect(page.getByTestId("prepare-prove-proof-status")).toContainText("pending review");
    const status = await page.request.get(`${api}/prepare-prove/proof-status?activity_id=${activity}`, { headers: headers(learner) });
    const evidenceId = (await status.json()).data.evidence.evidence_id;
    await page.setExtraHTTPHeaders(headers(reviewer));
    await page.goto(`${base}/curriculum.html#/curriculum/instructor/prove/${evidenceId}`, { waitUntil: "networkidle" });
    await expect(page.getByText("Criteria version 1")).toBeVisible();
    await page.getByRole("button", { name: "Record demonstrated" }).click();
    await expect(page.getByTestId("prepare-prove-review").getByRole("status")).toContainText("DEMONSTRATED");
  }
  const insufficientResult = await post(page, "/prepare-prove/activity-results", learner, { result: { activity_id: "grade11-mechanical-hvac-cooling-incident-analysis", observations: ["Rack temperature is rising."], affected_system: "Cooling system", uncertainty: "Cause is not confirmed.", safe_next_step: "Open the cooling unit and inspect the compressor." } });
  const insufficientEvidence = await post(page, "/prepare-prove/evidence", learner, { source_result_id: insufficientResult.result_id, criterion: "cooling-incident-analysis" });
  await post(page, `/prepare-prove/evidence/${insufficientEvidence.evidence_id}/review`, reviewer, { decision: "EVIDENCE_INSUFFICIENT" });
  const reassessmentResult = await post(page, "/prepare-prove/activity-results", learner, { result: { activity_id: "grade11-mechanical-hvac-cooling-incident-analysis-reassessment", observations: ["Rack exhaust has a rising trend.", "One cooling unit is unavailable.", "Humidity is stable."], affected_system: "Thermal zone and cooling redundancy", uncertainty: "The simulation does not confirm the root cause.", safe_next_step: "Document the evidence and escalate to an authorized mechanical team." } });
  const reassessmentEvidence = await post(page, "/prepare-prove/evidence", learner, { source_result_id: reassessmentResult.result_id, criterion: "cooling-incident-analysis" });
  await post(page, `/prepare-prove/evidence/${reassessmentEvidence.evidence_id}/review`, reviewer, { decision: "DEMONSTRATED" });
});
