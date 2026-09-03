import { test, expect } from "@playwright/test";

const URL = "http://localhost:5173/career.html#/portfolio";
const credential = {
  id: "learner_credential_1",
  lifecycle: "ISSUED",
  issuedAt: "2026-09-03T12:00:00.000Z",
  definition: { name: "Studio Project Badge", issuingAuthority: "Silicon Heartland Foundation" },
};

async function mockPortfolio(page) {
  await page.route("**/portfolio", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data: { portfolio: { portfolioId: "portfolio_1" }, artifacts: [] } }) }));
  await page.route("**/credentials/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data: { items: [credential] } }) }));
}

test.describe("durable Credential presentation", () => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 900 }]) {
    test(`renders at ${viewport.width}px without horizontal overflow`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await mockPortfolio(page);
      await page.goto(URL, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "Credentials & Badges" })).toBeVisible();
      await expect(page.getByText("Studio Project Badge")).toBeVisible();
      await expect(page.getByText("Earned")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    });
  }

  test("empty state ignores legacy localStorage", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("credentials", JSON.stringify([{ name: "Fake Credential" }])));
    await page.route("**/portfolio", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data: { portfolio: { portfolioId: "portfolio_1" }, artifacts: [] } }) }));
    await page.route("**/credentials/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data: { items: [] } }) }));
    await page.goto(URL, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("No credentials issued yet.")).toBeVisible();
    await expect(page.getByText("Fake Credential")).toHaveCount(0);
  });

  test("issued, empty, and revoked states expose semantic status without fake controls", async ({ page }) => {
    await mockPortfolio(page);
    await page.goto(URL, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Studio Project Badge")).toBeVisible();
    const issuedTree = await page.getByRole("main", { name: "Portfolio" }).ariaSnapshot();
    expect(issuedTree).toContain("Credentials & Badges");
    expect(issuedTree).toContain("Studio Project Badge");
    expect(issuedTree).toContain("Earned");
    expect(issuedTree).toContain("Issued by the institution");
    expect(await page.locator(".sp-badge").getAttribute("tabindex")).toBeNull();
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);

    await page.route("**/credentials/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data: { items: [] } }) }));
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText("No credentials issued yet.")).toBeVisible();
    const emptyTree = await page.getByRole("main", { name: "Portfolio" }).ariaSnapshot();
    expect(emptyTree).toContain("No credentials issued yet");

    await page.route("**/credentials/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data: { items: [{ ...credential, lifecycle: "REVOKED" }] } }) }));
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText("No credentials issued yet.")).toBeVisible();
    const revokedTree = await page.getByRole("main", { name: "Portfolio" }).ariaSnapshot();
    expect(revokedTree).toContain("No credentials issued yet");
  });
});
