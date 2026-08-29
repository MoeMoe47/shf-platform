import { test, expect } from "@playwright/test";

const base = process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5173";
const lessons = [
  ["data-center-specialization-11-cybersecurity-safety", "Security, Authorization, and Professional Boundaries"],
  ["data-center-specialization-11-identity-authentication", "Identity and Authentication"],
  ["data-center-specialization-11-authorization-least-privilege", "Authorization and Least Privilege"],
  ["data-center-specialization-11-physical-security", "Physical Access and Facility Security"],
  ["data-center-specialization-11-security-monitoring-logs", "Security Monitoring and Synthetic Logs"],
  ["data-center-specialization-11-account-lifecycle", "Account and Access Lifecycle"],
  ["data-center-specialization-11-defensive-system-security", "Defensive Network and System Security"],
  ["data-center-specialization-11-security-documentation", "Security Documentation and Evidence Handling"],
  ["data-center-specialization-11-security-incident-reasoning", "Defensive Security Incident Reasoning"],
  ["data-center-specialization-11-security-incident-project", "Analyze a Simulated Access-Control Incident"],
];

test("all Security lessons render through the canonical route", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const [id, title] of lessons) {
    await page.goto(`${base}/curriculum.html#/curriculum/lessons/${id}`);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Learn" })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("Security proof activity is accessible and simulation-only on narrow screens", async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport);
    await page.goto(`${base}/curriculum.html#/curriculum/lessons/data-center-specialization-11-security-incident-project`);
    await page.getByRole("tab", { name: "Apply" }).click();
    await expect(page.getByTestId("prepare-prove-proof-activity")).toBeVisible();
    await expect(page.getByText("SIMULATION ONLY")).toBeVisible();
    await expect(page.getByLabel("Observations (one fact per line)")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width + 1);
    await page.getByLabel("Observations (one fact per line)").focus();
    await page.keyboard.type("A synthetic access event is recorded.");
    await expect(page.locator(":focus")).toHaveAccessibleName("Observations (one fact per line)");
  }
});
