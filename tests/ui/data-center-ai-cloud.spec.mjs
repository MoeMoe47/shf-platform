import { test, expect } from "@playwright/test";

const base = process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5173";
const lessons = [
  ["data-center-specialization-11-ai-cloud-foundations", "AI and Cloud Infrastructure Foundations"],
  ["data-center-specialization-11-cpu-gpu-workloads", "CPU, GPU, Accelerators, and Workloads"],
  ["data-center-specialization-11-virtualization-containers", "Virtualization, Virtual Machines, and Containers"],
  ["data-center-specialization-11-cloud-infrastructure", "Cloud Infrastructure Concepts"],
  ["data-center-specialization-11-storage-data-movement", "Storage and Data Movement"],
  ["data-center-specialization-11-capacity-bottlenecks", "Capacity, Utilization, and Bottleneck Analysis"],
  ["data-center-specialization-11-availability-scaling", "Availability, Redundancy, and Scaling"],
  ["data-center-specialization-11-ai-power-cooling", "AI Infrastructure Power and Cooling"],
  ["data-center-specialization-11-ai-monitoring", "AI Infrastructure Monitoring and Operations"],
  ["data-center-specialization-11-ai-cloud-project", "Design and Diagnose a Simulated AI Infrastructure Workload"],
];

test("all AI and Cloud lessons render through the canonical route", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const [id, title] of lessons) {
    await page.goto(`${base}/curriculum.html#/curriculum/lessons/${id}`);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Learn" })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("AI infrastructure proof is accessible and simulation-only on narrow screens", async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport);
    await page.goto(`${base}/curriculum.html#/curriculum/lessons/data-center-specialization-11-ai-cloud-project`);
    await page.getByRole("tab", { name: "Apply" }).click();
    await expect(page.getByTestId("prepare-prove-proof-activity")).toBeVisible();
    await expect(page.getByText("SIMULATION ONLY")).toBeVisible();
    await expect(page.getByLabel("Observations (one fact per line)")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width + 1);
    await page.getByLabel("Observations (one fact per line)").focus();
    await page.keyboard.type("Synthetic telemetry is available for review.");
    await expect(page.locator(":focus")).toHaveAccessibleName("Observations (one fact per line)");
  }
});
