import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const origin = process.env.SHF_FOUNDATION_BASE_URL || "http://127.0.0.1:5191";
const destinations = [
  ["About", /#\/about$/],
  ["Programs", /#\/programs$/],
  ["Impact", /#impact$/],
  ["Partners", /#\/partners$/],
  ["Resources", /#\/reports$/],
  ["News", /#\/reports$/],
  ["Contact", /#\/get-involved$/],
];
for (const width of [1440, 1280, 768, 390]) {
  test(`Donation canonical footer at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${origin}/foundation.html#/get-involved`);
    const footer = page.getByRole("contentinfo");
    await expect(footer).toHaveCount(1);
    await footer.scrollIntoViewIfNeeded();
    await expect(
      footer.getByRole("img", {
        name: "Silicon Heartland Foundation",
        exact: true,
      }),
    ).toBeVisible();
    await expect
      .poll(() =>
        footer
          .locator("img")
          .evaluate((n) => n.complete && n.naturalWidth === 1834),
      )
      .toBe(true);
    await expect(footer).toContainText(
      "A stronger region. A brighter tomorrow.",
    );
    await expect(footer).toContainText(
      "© 2026 Silicon Heartland Foundation. All rights reserved.",
    );
    await expect(footer.locator(".shf-footer__social")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(footer.locator(".shf-footer__social a")).toHaveCount(0);
    expect(
      await footer.evaluate((n) =>
        n.previousElementSibling.classList.contains("shf-final-cta"),
      ),
    ).toBe(true);
    expect(await footer.evaluate((n) => n.nextElementSibling === null)).toBe(
      true,
    );
    const nav = footer.getByRole("navigation", { name: "Foundation footer" });
    await expect(nav.getByRole("link")).toHaveCount(7);
    for (const action of await nav.getByRole("link").all()) {
      await action.focus();
      await expect(action).toBeFocused();
      expect(
        await action.evaluate((n) => getComputedStyle(n).outlineStyle),
      ).not.toBe("none");
      const box = await action.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.evaluate(() => document.fonts.ready);
    await mkdir("docs/ui/foundation-donation/screenshots/section-09", {
      recursive: true,
    });
    await footer.screenshot({
      path: `docs/ui/foundation-donation/screenshots/section-09/footer-${width}.png`,
    });
    for (const [label, url] of destinations) {
      await nav.getByRole("link", { name: label, exact: true }).press("Enter");
      await expect(page).toHaveURL(url);
      if (label === "Impact")
        await expect(page.locator("#impact")).toBeVisible();
      else await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await page.goto(`${origin}/foundation.html#/get-involved`);
    }
  });
}
