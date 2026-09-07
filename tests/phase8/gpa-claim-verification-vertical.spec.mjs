import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const manifest = JSON.parse(await readFile(process.env.SHS_PHASE8_FIXTURE_MANIFEST, "utf8"));
const adminHeaders = { Authorization: "Bearer dev-token:admin_A", "x-shs-organization-id": manifest.orgA };

test("Claim and Verification vertical supports stable deep links and canonical reads", async ({ page, request }) => {
  await page.addInitScript(({ org }) => {
    window.localStorage.setItem("shfOperatorToken", "dev-token:admin_A");
    window.localStorage.setItem("shfOperatorOrganizationId", org);
  }, { org: manifest.orgA });

  await page.goto(`${frontend}/index.html#/operator/government-assurance/claims/${manifest.gpaClaim}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Claims Detail" })).toBeVisible();
  await expect(page.getByText("Claim Readiness")).toBeVisible();
  await expect(page.getByText("Evidence and Admissibility")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lifecycle History" })).toBeVisible();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Claims Detail" })).toBeVisible();

  const claim = await request.get(`${api}/government-assurance/claims/${manifest.gpaClaim}`, { headers: adminHeaders });
  expect(claim.status()).toBe(200);
  const verification = await request.get(`${api}/government-assurance/verifications/${manifest.gpaVerification}`, { headers: adminHeaders });
  expect(verification.status()).toBe(200);

  await page.goto(`${frontend}/index.html#/operator/government-assurance/verification/${manifest.gpaVerification}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Verification Detail" })).toBeVisible();
  await expect(page.getByText("Verification Evidence")).toBeVisible();
  await expect(page.getByText("Verification History")).toBeVisible();
  await page.getByRole("button", { name: "Start Verification" }).click();
  await expect(page.getByText("Canonical verification action succeeded.")).toBeVisible();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Verification Detail" })).toBeVisible();
});

test("Claim and Verification scope and self-verification denials are enforced", async ({ request }) => {
  const wrongOrg = await request.get(`${api}/government-assurance/claims/${manifest.gpaClaim}`, { headers: { Authorization: "Bearer dev-token:admin_B", "x-shs-organization-id": manifest.orgB } });
  expect([200, 403, 404]).toContain(wrongOrg.status());
  if (wrongOrg.status() === 200) expect((await wrongOrg.json()).data).toBeNull();

  const wrongTenant = await request.get(`${api}/government-assurance/verifications/${manifest.gpaVerification}`, { headers: { Authorization: "Bearer dev-token:admin_B", "x-shs-organization-id": manifest.orgB } });
  expect([200, 403, 404]).toContain(wrongTenant.status());
  if (wrongTenant.status() === 200) expect((await wrongTenant.json()).data).toBeNull();

  const selfVerification = await request.post(`${api}/government-assurance/verifications/request`, {
    headers: { ...adminHeaders, "content-type": "application/json" },
    data: { claimId: manifest.gpaClaim, methodId: "phase8_method_authoritative", verifierReference: "phase8_provider_a", requestedLevel: "V4" },
  });
  expect([400, 403]).toContain(selfVerification.status());
});
