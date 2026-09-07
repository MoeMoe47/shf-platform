import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const manifest = process.env.SHS_PHASE8_FIXTURE_MANIFEST ? JSON.parse(await readFile(process.env.SHS_PHASE8_FIXTURE_MANIFEST, "utf8")) : {};
const admin = { Authorization: "Bearer dev-token:admin_A", "x-shs-organization-id": manifest.orgA };
const otherOrg = { Authorization: "Bearer dev-token:admin_B", "x-shs-organization-id": manifest.orgB };

async function apiRequest(path, options = {}) {
  const response = await fetch(api + path, { ...options, headers: { ...admin, ...(options.headers || {}), "content-type": "application/json" } });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

test.describe("GPA reconciliation and source health vertical", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("shfOperatorToken", "dev-token:admin_A");
      localStorage.setItem("shfOperatorOrganizationId", "phase8_org_a");
    });
  });
  test("reconciliation good path renders canonical comparison and determination", async ({ page }) => {
    await page.goto(frontend + "/index.html#/operator/government-assurance/reconciliation/" + manifest.gpaReconciliationCase);
    await expect(page.getByRole("heading", { name: /Reconciliation phase8_reconciliation_case_a/ })).toBeVisible();
    await expect(page.getByText("Source A / Source B comparison")).toBeVisible();
    await expect(page.getByText("Source Authority comparison")).toBeVisible();
    await expect(page.getByText("Data Quality by dimension")).toBeVisible();
    await expect(page.getByText("Downstream impact")).toBeVisible();
    await expect(page.getByText("Lifecycle history")).toBeVisible();
    await page.getByRole("textbox", { name: "Rationale" }).fill("Controlled reviewer determination preserves both source semantics.");
    await page.getByRole("button", { name: "Determine case" }).click();
    await expect(page.locator('[role="status"]').filter({ hasText: "Canonical determination saved." })).toBeVisible();
    await page.reload();
    await expect(page.getByText("RESOLVED", { exact: true }).first()).toBeVisible();
  });

  test("source good path renders authority, policy, health, quality, drift, and rejects", async ({ page }) => {
    await page.goto(frontend + "/index.html#/operator/government-assurance/data-sources/" + manifest.gpaSourceSystem);
    await expect(page.getByRole("heading", { name: /Source System phase8_source_finance/ })).toBeVisible();
    await expect(page.getByText("Source Authority")).toBeVisible();
    await expect(page.getByText("Data Use Policy")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Source Health" })).toBeVisible();
    await expect(page.getByText("Data Quality")).toBeVisible();
    await expect(page.getByText("Schema Drift")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Rejected Records" })).toBeVisible();
    await expect(page.getByText("phase8_rejected_record_a")).toBeVisible();
  });

  test("scoped denial and four-eyes enforcement are backend-visible", async () => {
    const wrongOrg = await apiRequest("/government-assurance/reconciliation/" + manifest.gpaReconciliationCase, { headers: otherOrg });
    expect([400, 403, 404]).toContain(wrongOrg.response.status);
    const selfReview = await apiRequest("/government-assurance/reconciliation/" + manifest.gpaReconciliationCase + "/determine", { method: "POST", body: JSON.stringify({ status: "RESOLVED", determination: "UNRESOLVED", reviewerReference: "admin_A" }) });
    expect([400, 403]).toContain(selfReview.response.status);
    const unauthorizedEntity = await apiRequest("/government-assurance/entity-resolution/" + manifest.gpaEntityResolution + "/determine", { method: "POST", headers: { Authorization: "Bearer dev-token:instructor_A_unauthorized", "x-shs-organization-id": manifest.orgA }, body: JSON.stringify({ status: "MATCHED", determination: { outcome: "MATCHED" } }) });
    expect([400, 403]).toContain(unauthorizedEntity.response.status);
    const wrongTenantSource = await apiRequest("/government-assurance/source-systems/" + manifest.gpaSourceSystem, { headers: { Authorization: "Bearer dev-token:admin_B", "x-shs-organization-id": manifest.orgB } });
    expect([200, 400, 403, 404]).toContain(wrongTenantSource.response.status);
    expect(wrongTenantSource.body?.data).not.toEqual(expect.objectContaining({ sourceSystemId: manifest.gpaSourceSystem }));
  });
});
