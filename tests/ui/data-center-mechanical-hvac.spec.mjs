import { test, expect } from "@playwright/test";
const base = process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5173";
const lessons = [
  ["data-center-specialization-11-mechanical-hvac-safety", "Mechanical and HVAC Safety Boundaries"],
  ["data-center-specialization-11-heat-thermal-fundamentals", "Heat and Thermal Fundamentals"],
  ["data-center-specialization-11-airflow-management", "Airflow and Thermal Zones"],
  ["data-center-specialization-11-environmental-conditions", "Temperature, Humidity, and Environmental Conditions"],
  ["data-center-specialization-11-cooling-architecture", "Cooling-System Architecture"],
  ["data-center-specialization-11-cooling-capacity", "Cooling Load, Capacity, and Headroom"],
  ["data-center-specialization-11-environmental-monitoring", "Environmental Monitoring and Alarms"],
  ["data-center-specialization-11-cooling-reliability", "Cooling Reliability and Redundancy"],
  ["data-center-specialization-11-preventive-maintenance", "Preventive Maintenance and Trend Analysis"],
  ["data-center-specialization-11-thermal-incident-project", "Diagnose a Simulated Cooling Incident"],
];
test("Mechanical and HVAC routes render with safe thermal boundaries", async ({ page }) => {
  for (const [id, title] of lessons) {
    await page.goto(`${base}/curriculum.html#/curriculum/lessons/${id}`);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Learn" })).toBeVisible();
  }
  await page.goto(`${base}/curriculum.html#/curriculum/lessons/data-center-specialization-11-thermal-incident-project`);
  await page.getByRole("tab", { name: "Apply" }).click();
  await expect(page.getByText("SIMULATION ONLY")).toBeVisible();
});
