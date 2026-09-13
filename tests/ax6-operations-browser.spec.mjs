import { test, expect } from "@playwright/test";

const api = () => process.env.SHS_TEST_API_URL;
const frontend = () => process.env.SHS_TEST_FRONTEND_URL;
const auth = (userId) => ({ Authorization: `Bearer dev-token:${userId}`, "Content-Type": "application/json" });
async function call(userId, path, options = {}) { const response = await fetch(`${api()}${path}`, { ...options, headers: { ...auth(userId), ...(options.headers || {}) }, body: options.body === undefined ? undefined : JSON.stringify(options.body) }); return { response, body: await response.json().catch(() => ({})) }; }

test("operations center shows health, ingested issue, remediation and consent-bound support", async ({ page }) => {
  const finding = await call("admin_A", "/accessibility/operations/issues/ingest", { method: "POST", body: { findingId: "ax6-browser-finding", sourceType: "AX5", sourceId: "settings", sourceRoute: "/settings", experience: "Accessibility Settings", category: "PRIMARY_ACTION", severity: "SERIOUS", origin: "AX5_AUTOMATED", description: "A required control needs review.", humanReviewRequired: true } });
  expect(finding.response.status).toBe(201);
  const repeat = await call("admin_A", "/accessibility/operations/issues/ingest", { method: "POST", body: { findingId: "ax6-browser-finding", sourceType: "AX5", sourceId: "settings", sourceRoute: "/settings", experience: "Accessibility Settings", category: "PRIMARY_ACTION", severity: "SERIOUS", origin: "AX5_AUTOMATED", description: "A required control needs review.", humanReviewRequired: true } });
  expect(repeat.body.data.issueId).toBe(finding.body.data.issueId);
  await page.addInitScript((value) => localStorage.setItem("shfOperatorToken", value), "dev-token:admin_A");
  await page.goto(`${frontend()}/#/operator/accessibility-operations`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Accessibility Operations" })).toBeVisible();
  await expect(page.getByText("DEGRADED", { exact: true })).toBeVisible();
  await expect(page.getByText("Human review required", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Assign to me" }).click();
  await expect(page.getByText("Issue assigned.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Start remediation" }).click();
  await expect(page.getByText("Issue moved to remediation.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Request retest" }).click();
  await expect(page.getByText("Issue queued for retest.", { exact: true })).toBeVisible();
  await page.getByLabel("What access help is needed?").fill("I still cannot complete this task with my assistive technology.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Request human help" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Support request" })).toBeVisible();
});

test("Companion accessibility mode remains guidance-only", async () => {
  const result = await call("learner_A1", "/companion/accessibility/help");
  expect(result.response.ok).toBeTruthy();
  expect(result.body.data.authority).toBe("GUIDANCE_ONLY");
  expect(result.body.data.capabilities).toContain("HUMAN_ESCALATION");
  expect(result.body.data.note).toContain("cannot approve accommodations");
});

test("repeated verified finding is reopened as a regression", async () => {
  const input = { findingId: "ax6-regression-finding", sourceType: "AX5", sourceId: "curriculum", sourceRoute: "/curriculum", severity: "SERIOUS", origin: "AX5_AUTOMATED", description: "Regression fixture." };
  const first = await call("admin_A", "/accessibility/operations/issues/ingest", { method: "POST", body: input });
  await call("admin_A", `/accessibility/operations/issues/${first.body.data.issueId}`, { method: "PATCH", body: { status: "VERIFIED" } });
  const second = await call("admin_A", "/accessibility/operations/issues/ingest", { method: "POST", body: input });
  expect(second.body.data.issueId).toBe(first.body.data.issueId);
  expect(second.body.data.status).toBe("REGRESSION");
});

test("anonymous and another organization cannot access operations", async () => {
  const anonymous = await fetch(`${api()}/accessibility/operations/issues`, { headers: { Authorization: "Bearer dev-token:anonymous" } });
  expect([401, 403]).toContain(anonymous.status);
  const otherOrg = await call("admin_B", "/accessibility/operations/issues");
  expect(otherOrg.response.ok).toBeTruthy();
  expect(otherOrg.body.data.items.some((item) => item.findingId === "ax6-browser-finding")).toBe(false);
});
