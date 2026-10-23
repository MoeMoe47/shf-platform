import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
test.setTimeout(120_000);

const origin = process.env.SHF_FOUNDATION_BASE_URL || "http://127.0.0.1:5191";
const route = `${origin}/foundation.html#/get-involved`;
const imageNames = [
  "hero",
  "impact-support",
  "one-time-gift",
  "monthly-giving",
  "corporate-support",
  "grants-foundations",
  "employer-partnerships",
  "planned-giving",
  "impact-banner",
];
for (const width of [1440, 1280, 768, 390]) {
  test(`final Donation readiness at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route);
    await expect(page.locator(".shf-institutional-header")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator(".shf-final-cta")).toHaveCount(1);
    await expect(page.locator("footer")).toHaveCount(1);
    const photos = page.locator(".shf-donation-page img");
    await expect(photos).toHaveCount(9);
    for (const [index, name] of imageNames.entries()) {
      const image = photos.nth(index);
      await expect(image).toHaveAttribute(
        "src",
        `/assets/foundation/donation/donation-${name}.webp`,
      );
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() => image.evaluate((n) => n.complete && n.naturalWidth > 0))
        .toBe(true);
    }
    const nav = page.getByRole("navigation", {
      name: "Donation page sections",
    });
    for (const [label, id] of [
      ["Make a Gift", "make-a-gift"],
      ["Ways to Give", "ways-to-give"],
      ["Where It Goes", "where-it-goes"],
    ]) {
      const action = nav.getByRole("button", { name: label, exact: true });
      await action.press("Enter");
      await expect(page.locator(`#${id}`)).toBeFocused();
      await expect(action).toHaveAttribute("aria-current", "location");
      const header = await page
        .locator(".shf-institutional-header")
        .boundingBox();
      expect(
        await page
          .locator(`#${id}`)
          .evaluate((n) => n.getBoundingClientRect().top),
      ).toBeGreaterThanOrEqual(header.height + 15);
    }
    const form = page.locator(".shf-gift-selector");
    const input = page.getByLabel("Custom Amount");
    const give = form.getByRole("button", { name: "Give Now", exact: true });
    for (const [index, amount] of [25, 50, 100, 250].entries()) {
      const button = form.locator(".shf-gift-presets button").nth(index);
      await button.press(index % 2 ? "Space" : "Enter");
      await expect(input).toHaveValue(String(amount));
      await expect(form.locator('[aria-pressed="true"]')).toHaveCount(1);
    }
    for (const invalid of ["", "0", "-1", "invalid", "1.234"]) {
      await input.fill(invalid);
      await give.click();
      await expect(form.getByRole("alert")).toContainText(
        "positive USD amount",
      );
      await expect(input).toHaveValue(invalid);
      await expect(input).toBeFocused();
    }
    const nonGet = [];
    const track = (request) => {
      if (request.method() !== "GET") nonGet.push(request.url());
    };
    page.on("request", track);
    for (const [amount, label] of [
      ["42.37", "$42.37"],
      ["90071992547409.91", "$90,071,992,547,409.91"],
    ]) {
      await input.fill(amount);
      await expect(form.locator('[aria-pressed="true"]')).toHaveCount(0);
      await input.press("Enter");
      const dialog = page.getByRole("dialog");
      await expect(dialog).toContainText(label);
      await expect(dialog).toContainText("No payment has been taken");
      await expect(dialog.getByRole("button")).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(give).toBeFocused();
    }
    await give.press("Enter");
    await page.getByRole("dialog").getByRole("button").click();
    await expect(give).toBeFocused();
    expect(nonGet).toEqual([]);
    page.off("request", track);
    const ways = page.getByRole("region", {
      name: "More Ways to Make an Impact.",
    });
    await expect(ways.getByRole("article")).toHaveCount(6);
    expect(
      await ways
        .locator(".shf-giving-cards")
        .evaluate(
          (n) => getComputedStyle(n).gridTemplateColumns.split(" ").length,
        ),
    ).toBe(width > 1100 ? 3 : width > 600 ? 2 : 1);
    await ways
      .getByRole("button", { name: "One-Time Gift", exact: true })
      .press("Enter");
    await expect(input).toBeFocused();
    for (const title of [
      "Monthly Giving",
      "Grants & Foundations",
      "Planned Giving",
    ]) {
      const action = ways.getByRole("button", { name: title, exact: true });
      await action.press("Enter");
      await expect(page.getByRole("dialog").getByRole("heading")).toHaveText(
        title,
      );
      await page.getByRole("dialog").getByRole("button").click();
      await expect(action).toBeFocused();
    }
    const trust = page.getByRole("region", {
      name: "Your Support. Our Responsibility.",
    });
    for (const title of ["Financial Reports", "Governance Overview"]) {
      const action = trust.getByRole("button", { name: title, exact: true });
      await action.press("Enter");
      await expect(page.getByRole("dialog").getByRole("heading")).toHaveText(
        title,
      );
      await page.keyboard.press("Escape");
      await expect(action).toBeFocused();
    }
    const closing = page.getByRole("region", {
      name: "Support the Silicon Heartland Foundation",
    });
    await closing
      .getByRole("link", { name: "Support SHF", exact: true })
      .press("Enter");
    await expect(page.locator("#make-a-gift")).toBeFocused();
    for (const locate of [
      () => nav.getByRole("link", { name: "Partner With Us", exact: true }),
      () => ways.getByRole("link", { name: "Corporate Support", exact: true }),
      () =>
        ways.getByRole("link", { name: "Employer Partnerships", exact: true }),
      () => closing.getByRole("link", { name: "Partner With Us", exact: true }),
    ]) {
      await locate().press("Enter");
      await expect(page).toHaveURL(/#\/partners$/);
      await page.goto(route);
    }
    for (const locate of [
      () => nav.getByRole("link", { name: "Impact Stories", exact: true }),
      () =>
        page
          .locator("#where-it-goes")
          .getByRole("link", { name: "Our Impact", exact: true }),
    ]) {
      await locate().press("Enter");
      await expect(page).toHaveURL(/#impact$/);
      await expect(page.locator("#impact")).toBeVisible();
      await page.goto(route);
    }
    await trust
      .getByRole("link", { name: "Impact Reporting", exact: true })
      .press("Enter");
    await expect(page).toHaveURL(/#\/reports$/);
    await page.goto(route);
    const footer = page.getByRole("contentinfo");
    const footerNav = footer.getByRole("navigation", {
      name: "Foundation footer",
    });
    for (const [name, hash] of [
      ["About", "#/about"],
      ["Programs", "#/programs"],
      ["Impact", "#impact"],
      ["Partners", "#/partners"],
      ["Resources", "#/reports"],
      ["News", "#/reports"],
      ["Data Center Community Impact", "#/data-center-community-impact"],
      ["Contact", "#/get-involved"],
    ]) {
      await footerNav.getByRole("link", { name, exact: true }).press("Enter");
      await expect(page).toHaveURL(
        new RegExp(hash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"),
      );
      await page.goto(route);
    }
    for (const image of await photos.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() => image.evaluate((n) => n.complete && n.naturalWidth > 0))
        .toBe(true);
    }
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.evaluate(() => window.scrollTo(0, 0));
    await mkdir("docs/ui/foundation-donation/screenshots/final", {
      recursive: true,
    });
    await page.screenshot({
      path: `docs/ui/foundation-donation/screenshots/final/donation-final-${width}.png`,
      fullPage: true,
    });
  });
}
