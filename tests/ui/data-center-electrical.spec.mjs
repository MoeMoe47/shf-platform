import { test, expect } from "@playwright/test";
const base = process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5173";
const lessons = [
  ["data-center-specialization-11-electrical-safety", "Electrical Infrastructure Safety"],
  ["data-center-specialization-11-power-quantities", "Voltage, Current, Resistance, and Power"],
  ["data-center-specialization-11-power-paths", "Reading Critical Power Paths"],
  ["data-center-specialization-11-load-capacity", "Load, Capacity, and Headroom"],
  ["data-center-specialization-11-ups-generator", "UPS and Generator Architecture"],
  ["data-center-specialization-11-power-reliability", "Power Redundancy and Reliability"],
  ["data-center-specialization-11-power-monitoring", "Power Monitoring and Alarms"],
  ["data-center-specialization-11-electrical-incident-project", "Analyze a Simulated Critical Power Incident"],
];
test("Electrical Infrastructure routes render and retain safety boundaries", async ({ page }) => {
  for (const [id, title] of lessons) {
    await page.goto(`${base}/curriculum.html#/curriculum/lessons/${id}`);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Learn" })).toBeVisible();
  }
  await page.goto(`${base}/curriculum.html#/curriculum/lessons/data-center-specialization-11-electrical-incident-project`);
  await page.getByRole("tab", { name: "Apply" }).click();
  await expect(page.getByText("SIMULATION ONLY")).toBeVisible();
});
