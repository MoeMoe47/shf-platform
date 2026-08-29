import { test, expect } from "@playwright/test";
const base = String(process.env.SHS_TEST_FRONTEND_URL || "").replace(/\/$/, "");
const api = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const learner = "Bearer dev-token:user_student_001";
const reviewer = "Bearer dev-token:user_reviewer_001";
const scenarios = [
  ["data-center-specialization-11-power-paths", "grade11-electrical-power-path-interpretation", "Reading Critical Power Paths", "Power path"],
  ["data-center-specialization-11-load-capacity", "grade11-electrical-load-capacity-reasoning", "Load, Capacity, and Headroom", "Synthetic rack load"],
];
const headers = (token, extra = {}) => ({ Authorization: token, ...extra });
async function post(page, path, token, data) { const r = await page.request.post(`${api}${path}`, { headers: headers(token), data }); const text = await r.text(); expect(r.status(), `${path}: ${text}`).toBeGreaterThanOrEqual(200); expect(r.status(), `${path}: ${text}`).toBeLessThan(300); return JSON.parse(text).data; }
test("Electrical candidates complete generic proof and incident reassessment flow", { skip: base && api ? false : "stack URLs required", timeout: 90_000 }, async ({ page }) => {
  for (const [lesson, activity, title, system] of scenarios) {
    await page.setExtraHTTPHeaders(headers(learner)); await page.goto(`${base}/curriculum.html#/curriculum/lessons/${lesson}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: title })).toBeVisible(); await page.getByRole("tab", { name: "Apply" }).click();
    await page.getByLabel("Observations (one fact per line)").fill("A synthetic power status is recorded.\nA relevant warning is visible."); await page.getByLabel("Affected system hypothesis").fill(system); await page.getByLabel("What remains uncertain?").fill("The simulation does not confirm a physical cause."); await page.getByLabel("Safe next step or escalation").fill("Document evidence and escalate to an authorized electrical team."); await page.getByRole("button", { name: "Submit evidence for review" }).click(); await expect(page.getByTestId("prepare-prove-proof-status")).toContainText("pending review");
    const status = await page.request.get(`${api}/prepare-prove/proof-status?activity_id=${activity}`, { headers: headers(learner) }); const body = await status.json(); const evidence = body.data.evidence.evidence_id;
    await page.setExtraHTTPHeaders(headers(reviewer)); await page.goto(`${base}/curriculum.html#/curriculum/instructor/prove/${evidence}`, { waitUntil: "networkidle" }); await expect(page.getByText("Criteria version 1")).toBeVisible(); await page.getByRole("button", { name: "Record demonstrated" }).click(); await expect(page.getByTestId("prepare-prove-review").getByRole("status")).toContainText("DEMONSTRATED");
  }
  const insufficientResult = await post(page, "/prepare-prove/activity-results", learner, { result: { activity_id: "grade11-electrical-infrastructure-incident-analysis", observations: ["Generator state is unknown."], affected_system: "Electrical system", uncertainty: "Cause is not confirmed.", safe_next_step: "Ask someone else to look at it." } });
  const insufficientEvidence = await post(page, "/prepare-prove/evidence", learner, { source_result_id: insufficientResult.result_id, criterion: "electrical-incident-analysis" });
  await post(page, `/prepare-prove/evidence/${insufficientEvidence.evidence_id}/review`, reviewer, { decision: "EVIDENCE_INSUFFICIENT" });
  const reassessmentResult = await post(page, "/prepare-prove/activity-results", learner, { result: { activity_id: "grade11-electrical-infrastructure-incident-analysis-reassessment", observations: ["Utility is lost.", "UPS supports load.", "Generator state is unconfirmed."], affected_system: "Critical power path", uncertainty: "The simulation does not confirm the generator cause.", safe_next_step: "Document the path and escalate to an authorized electrical team." } });
  const reassessmentEvidence = await post(page, "/prepare-prove/evidence", learner, { source_result_id: reassessmentResult.result_id, criterion: "electrical-incident-analysis" });
  await post(page, `/prepare-prove/evidence/${reassessmentEvidence.evidence_id}/review`, reviewer, { decision: "DEMONSTRATED" });
});
