import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const origin = process.env.SHF_FOUNDATION_BASE_URL || "http://127.0.0.1:5191";
const folder = "docs/ui/foundation-donation/screenshots/section-01";
for (const width of [1440, 1280, 768, 390]) {
  test(`Donation canonical header at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${origin}/foundation.html#/get-involved`);
    const header = page.locator(".shf-institutional-header");
    await expect(header).toHaveCount(1);
    const support = header.getByRole("link", {
      name: "Support SHF",
      exact: true,
    });
    await expect(support).toBeVisible();
    await expect(support).toHaveAttribute("href", "#/get-involved");
    await expect(support).toHaveAttribute("aria-current", "page");
    const logo = header.getByRole("img", {
      name: "Silicon Heartland Foundation",
      exact: true,
    });
    await expect(logo).toBeVisible();
    await expect
      .poll(() => logo.evaluate((img) => img.complete && img.naturalWidth > 0))
      .toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await mkdir(folder, { recursive: true });
    await header.screenshot({ path: `${folder}/header-${width}.png` });
    const nav = header.getByRole("navigation", {
      name: "Foundation navigation",
    });
    const menu = header.getByRole("button", { name: "Open Foundation menu" });
    if (width <= 1024) {
      await expect(nav).toBeHidden();
      await menu.focus();
      await page.keyboard.press("Enter");
      await expect(nav).toBeVisible();
      await expect(
        header.getByRole("button", { name: "Close Foundation menu" }),
      ).toHaveAttribute("aria-expanded", "true");
      await header.screenshot({ path: `${folder}/header-${width}-open.png` });
      await page.keyboard.press("Escape");
      await expect(nav).toBeHidden();
      await expect(menu).toBeFocused();
      await menu.press("Enter");
    } else {
      await expect(menu).toBeHidden();
      const tops = await nav
        .locator("a")
        .evaluateAll((nodes) =>
          nodes.map((n) => n.getBoundingClientRect().top),
        );
      expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(1);
    }
    for (const action of await header
      .locator("a:visible,button:visible")
      .all()) {
      const box = await action.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
      expect(box.height).toBeGreaterThanOrEqual(44);
      await action.focus();
      await expect(action).toBeFocused();
      expect(
        await action.evaluate((n) => getComputedStyle(n).outlineStyle),
      ).not.toBe("none");
    }
    expect(await header.evaluate((n) => n.scrollWidth <= n.clientWidth)).toBe(
      true,
    );
    await header
      .getByRole("link", { name: "Search SHF resources", exact: true })
      .press("Enter");
    await expect(page).toHaveURL(/#\/reports$/);
    if (width <= 1024) await expect(nav).toBeHidden();
    await support.press("Enter");
    await expect(page).toHaveURL(/#\/get-involved$/);
    await expect(support).toHaveAttribute("aria-current", "page");
    const donationHeader = await header.evaluate((n) =>
      n.outerHTML.replace(' aria-current="page"', ""),
    );
    await page.goto(`${origin}/foundation.html`);
    await expect(header).toHaveCount(1);
    expect(await header.evaluate((n) => n.outerHTML)).toBe(donationHeader);
  });
}
