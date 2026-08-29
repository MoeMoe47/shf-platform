import { test, expect } from "@playwright/test";

const base = process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5173";
const lessons = [
  ["data-center-specialization-11-network-topology", "Network Architecture and Topology"],
  ["data-center-specialization-11-switching-ethernet", "Switching and Ethernet"],
  ["data-center-specialization-11-addressing-gateway-dns", "Addressing, Gateways, and DNS"],
  ["data-center-specialization-11-structured-cabling", "Structured Cabling and Documentation"],
  ["data-center-specialization-11-fiber-infrastructure", "Fiber Infrastructure"],
  ["data-center-specialization-11-network-monitoring", "Network Monitoring and Telemetry"],
  ["data-center-specialization-11-connectivity-troubleshooting", "Connectivity Troubleshooting"],
  ["data-center-specialization-11-network-reliability", "Network Reliability and Redundancy"],
  ["data-center-specialization-11-networking-fiber-project", "Diagnose and Document a Simulated Network Failure"],
];

test("all Networking and Fiber lessons render through the canonical route", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const [id, title] of lessons) {
    await page.goto(`${base}/curriculum.html#/curriculum/lessons/${id}`);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Learn" })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("network proof activity is keyboard accessible and safe on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/curriculum.html#/curriculum/lessons/data-center-specialization-11-networking-fiber-project`);
  await page.getByRole("tab", { name: "Apply" }).click();
  await expect(page.getByTestId("prepare-prove-proof-activity")).toBeVisible();
  await expect(page.getByText("SIMULATION ONLY")).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow-x", "visible");
  await expect(page.getByLabel("Observations (one fact per line)")).toBeVisible();
  await page.getByLabel("Observations (one fact per line)").focus();
  await page.keyboard.type("The synthetic primary uplink is down.");
  await page.getByLabel("Affected system hypothesis").fill("Network path");
  await page.getByLabel("What remains uncertain?").fill("The simulation does not confirm a physical cause.");
  await page.getByLabel("Safe next step or escalation").fill("Document the path and escalate to an authorized network team.");
  await page.getByRole("button", { name: "Submit evidence for review" }).focus();
  await expect(page.locator(":focus")).toHaveAccessibleName("Submit evidence for review");
});
