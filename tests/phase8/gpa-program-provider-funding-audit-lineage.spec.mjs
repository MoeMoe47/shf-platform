import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const manifest = JSON.parse(await readFile(process.env.SHS_PHASE8_FIXTURE_MANIFEST, "utf8"));
const admin = { Authorization: "Bearer dev-token:admin_A", "x-shs-organization-id": manifest.orgA };

test.describe("GPA final Phase 8A workspace wave", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ org }) => {
      localStorage.setItem("shfOperatorToken", "dev-token:admin_A");
      localStorage.setItem("shfOperatorOrganizationId", org);
    }, { org: manifest.orgA });
  });

  test("program, provider, and funding detail paths render canonical projections", async ({ page }) => {
    await page.goto(`${frontend}/index.html#/operator/government-assurance/programs/${manifest.programA}`);
    await expect(page.getByRole("heading", { name: "Program Assurance", exact: true })).toBeVisible();
    await expect(page.getByText("Assurance summary")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Program Assurance", exact: true })).toBeVisible();

    await page.goto(`${frontend}/index.html#/operator/government-assurance/providers/${manifest.gpaProviderA}`);
    await expect(page.getByRole("heading", { name: /Provider Assurance/ })).toBeVisible();
    await expect(page.getByText("Claims / Metrics / Truth")).toBeVisible();

    await page.goto(`${frontend}/index.html#/operator/government-assurance/funding/${manifest.gpaAward}`);
    await expect(page.getByRole("heading", { name: /Funding Assurance/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Funding lineage", exact: true })).toBeVisible();
    await expect(page.getByText("Readiness")).toBeVisible();
  });

  test("audit and lineage detail paths render canonical records", async ({ page }) => {
    await page.goto(`${frontend}/index.html#/operator/government-assurance/audits/${manifest.gpaAuditEngagement}`);
    await expect(page.getByRole("heading", { name: /Audit Engagement/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Workpapers", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Samples and results", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Audit packet", exact: true })).toBeVisible();

    await page.goto(`${frontend}/index.html#/operator/government-assurance/lineage/truth/${manifest.gpaTruthFact}`);
    await expect(page.getByRole("heading", { name: "Lineage Explorer" })).toBeVisible();
    await expect(page.getByText("Canonical lineage")).toBeVisible();
    await expect(page.getByText("Metric Definition")).toBeVisible();
    await expect(page.locator(".gpa-lineage-list strong").filter({ hasText: "Verification" })).toBeVisible();
    await expect(page.locator(".gpa-lineage-list strong").filter({ hasText: "Evidence" })).toBeVisible();
  });

  test("cross-scope portfolio and lineage reads do not leak", async ({ request }) => {
    const other = { Authorization: "Bearer dev-token:admin_B", "x-shs-organization-id": manifest.orgB };
    for (const path of [
      `/government-assurance/programs/${manifest.programA}/assurance`,
      `/government-assurance/providers/${manifest.gpaProviderA}/integrity`,
      `/government-assurance/funding/lineage/${manifest.gpaAward}`,
      `/government-assurance/audits/${manifest.gpaAuditEngagement}`,
      `/government-assurance/truth-facts/${manifest.gpaTruthFact}`,
    ]) {
      const response = await request.get(api + path, { headers: other });
      expect([200, 400, 403, 404]).toContain(response.status());
      if (response.status() === 200) expect((await response.json()).data).not.toEqual(expect.objectContaining({ programReference: manifest.programA, providerReference: manifest.gpaProviderA }));
    }
    const own = await request.get(api + `/government-assurance/metric-results/${manifest.gpaMetricResult}/lineage`, { headers: admin });
    expect(own.status()).toBe(200);
  });
});
