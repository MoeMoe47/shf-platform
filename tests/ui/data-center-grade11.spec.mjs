import { test, expect } from "@playwright/test";

const base = process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5173";
const lesson = {
  id: "data-center-specialization-11-monitoring-proof",
  title: "Monitoring Data and Safe Technical Findings",
};
const grade11Lessons = [
  ["data-center-specialization-11-safety-professional-practice", "Safety, Permission, and Professional Judgment"],
  ["data-center-specialization-11-technical-communication", "Technical Communication and Handoffs"],
  ["data-center-specialization-11-reliability-systems-thinking", "Reliability, Risk, and Escalation"],
  ["data-center-specialization-11-evidence-and-feedback", "From Performance to Evidence"],
  ["data-center-specialization-11-career-transition-planning", "Technical Pathway and Transition Planning"],
  ["data-center-specialization-11-monitoring-proof", "Monitoring Data and Safe Technical Findings"],
  ["data-center-specialization-11-server-operations", "Server Operations Workflow"],
  ["data-center-specialization-11-asset-inventory", "Hardware Inventory and Asset Records"],
  ["data-center-specialization-11-linux-inspection", "Linux Systems Inspection"],
  ["data-center-specialization-11-telemetry-troubleshooting", "Service and Resource Troubleshooting"],
  ["data-center-specialization-11-technical-operations-project", "Restore and Document a Simulated Infrastructure Service"],
];

test("all Grade 11 shared-core and Technical Operations routes render", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const [id, title] of grade11Lessons) {
    await page.goto(`${base}/curriculum.html#/curriculum/lessons/${id}`);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Learn" })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("Grade 11 shared-core proof lesson renders through the canonical student route", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/curriculum.html#/curriculum/lessons/${lesson.id}`);
  await expect(page.getByRole("heading", { name: lesson.title })).toBeVisible();
  await page.getByRole("tab", { name: "Apply" }).click();
  await expect(page.getByTestId("prepare-prove-proof-activity")).toBeVisible();
  await expect(page.getByText("SIMULATION ONLY")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Grade 11 proof activity remains usable by keyboard on a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/curriculum.html#/curriculum/lessons/${lesson.id}`);
  await page.getByRole("tab", { name: "Apply" }).click();

  const activity = page.getByTestId("prepare-prove-proof-activity");
  await expect(activity).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow-x", "visible");
  await expect(page.getByLabel("Observations (one fact per line)")).toBeVisible();

  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  await page.getByLabel("Observations (one fact per line)").focus();
  await page.keyboard.type("Rack temperature is rising.");
  await page.getByRole("button", { name: "Submit proof activity" }).focus();
  await expect(page.locator(":focus")).toHaveAccessibleName("Submit proof activity");
});
