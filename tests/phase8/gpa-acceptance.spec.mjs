import { test, expect } from "@playwright/test";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const token = "Bearer dev-token:admin_A";

test("GPA operating environment loads the controlled pilot scope", async ({ page, request }) => {
  const readiness = await request.get(`${api}/government-assurance/pilot/readiness`, { headers: { Authorization: token, "x-shs-organization-id": "phase8_org_a" } });
  expect(readiness.status()).toBe(200);
  const readinessBody = await readiness.json();
  expect(readinessBody.data.configuration.pilot_configuration_id).toBe("phase8_pilot_gpa");
  expect(readinessBody.data.status).toBe("READY_FOR_COUNTY_ACCEPTANCE");

  await page.addInitScript(() => {
    window.localStorage.setItem("shfOperatorToken", "dev-token:admin_A");
    window.localStorage.setItem("shfOperatorOrganizationId", "phase8_org_a");
  });
  await page.goto(`${frontend}/index.html#/operator/government-assurance`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Government Program Assurance" })).toBeVisible();
  for (const label of ["Overview", "Programs", "Providers", "Funding", "Claims", "Verification", "Monitoring", "Reconciliation", "Audit", "Data Sources", "Reports", "Pilot Administration"]) {
    await expect(page.getByRole("link", { name: label, exact: true })).toBeVisible();
  }
  await page.getByRole("link", { name: "Pilot Administration", exact: true }).click();
  await expect(page.getByText("Controlled County Assurance Pilot")).toBeVisible();
  await page.getByRole("link", { name: "Transparency", exact: true }).click();
  await expect(page.getByText("Public-Safe Transparency")).toBeVisible();
  await expect(page.getByText("120")).toBeVisible();

  for (const label of ["Programs", "Providers", "Funding", "Claims", "Verification", "Monitoring", "Reconciliation", "Audit", "Data Sources", "Reports"]) {
    await page.getByRole("link", { name: label, exact: true }).click();
    const heading = label === "Data Sources" ? "Data Sources / Data Quality" : label === "Monitoring" ? "Monitoring Work Queue" : label === "Reports" ? "Controlled Reports" : `${label} Assurance`;
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    if (label === "Claims") {
      const firstClaim = page.locator("table tbody button").first();
      if (await firstClaim.count()) {
        await firstClaim.click();
        await expect(page.getByRole("heading", { name: "Claims Detail" })).toBeVisible();
      }
    }
  }
});
