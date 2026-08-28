import { expect, test } from "@playwright/test";

const foundationBase = process.env.SHF_FOUNDATION_BASE_URL || "http://127.0.0.1:5173";
const universeOrigin = process.env.SHF_UNIVERSE_ORIGIN || "http://127.0.0.1:5173";
const foundationReportsUrl = `${foundationBase}/foundation.html#reports`;

test("public Foundation reports route shows governed Return to Universe link without automatic return", async ({ page }) => {
  await page.goto(`${foundationBase}/foundation.html?returnOrigin=http://evil.invalid#reports?returnOrigin=http://evil.invalid`, {
    waitUntil: "domcontentloaded",
  });

  await expect(page).toHaveURL(/\/foundation\.html\?returnOrigin=http:\/\/evil\.invalid#reports/);
  await expect(page.locator("#reports")).toBeAttached();
  await expect(page.getByRole("heading", { name: "Empowering Pathways to Success" })).toBeVisible();

  const returnLink = page.getByRole("link", { name: "Return to Universe" });
  await expect(returnLink).toBeVisible();
  await expect(returnLink).toHaveAttribute("href", `${universeOrigin}/universe`);

  const href = await returnLink.getAttribute("href");
  expect(href).not.toContain("/universe/v1-lab");
  expect(href).not.toContain("/universe/silicon-heartland-foundation");
  expect(href).not.toContain("evil.invalid");

  await page.waitForTimeout(700);
  await expect(page).toHaveURL(/\/foundation\.html\?returnOrigin=http:\/\/evil\.invalid#reports/);

  await page.goto(foundationReportsUrl, { waitUntil: "domcontentloaded" });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(foundationReportsUrl);
  await expect(returnLink).toHaveAttribute("href", `${universeOrigin}/universe`);
});

test("Foundation return link is layout-wide and excluded from admin and Hub shells", async ({ page }) => {
  for (const hash of ["#reports", "#/about", "#/mission"]) {
    await page.goto(`${foundationBase}/foundation.html${hash}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("link", { name: "Return to Universe" })).toHaveAttribute(
      "href",
      `${universeOrigin}/universe`
    );
  }

  await page.goto(`${foundationBase}/admin.html#/hub`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: "Return to Universe" })).toHaveCount(0);
  await expect(page.getByText("RETURN TO UNIVERSE")).toHaveCount(0);
});

test("Foundation Back navigation returns to reports hash after deliberate Universe selection", async ({ page }) => {
  await page.goto(foundationReportsUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "Return to Universe" }).click();

  await expect(page).toHaveURL(`${universeOrigin}/universe`);

  await page.goBack({ waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(foundationReportsUrl);
  await expect(page.locator("#reports")).toBeAttached();
});

test("Foundation mobile header exposes Return to Universe without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(foundationReportsUrl, { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("link", { name: "Return to Universe" })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
