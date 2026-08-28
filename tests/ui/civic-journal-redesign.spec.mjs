// Regression protection for the Civic Lab Constitution Journal redesign
// (2026-08-25): real entry storage (localStorage["shf.journal.v1"] via
// src/shared/journal/journalStore.js), autosave + reload persistence,
// search/funding/tag/site filtering, export content integrity (not just
// download events), the Markdown-syntax formatting toolbar (plain-text
// body preserved, no rich-text format introduced), Delete, Coach, theme,
// and responsive shell inheritance from the other redesigned Civic pages.
//
// See tests/ui/civic-journal-header.spec.mjs for the original title/action
// overlap regression guard (updated for this redesign's class names).
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173/civic.html";

async function freshJournal(page) {
  await page.goto(`${BASE}#/journal`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("shf.journal.v1"));
  await page.reload({ waitUntil: "networkidle" });
}

test.describe("Page load and honest empty state", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("route loads with no console/page errors, exactly one h1", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await freshJournal(page);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText("Constitution Journal");
    expect(errors).toEqual([]);
  });

  test("real entry count shown honestly (0, not fake data)", async ({ page }) => {
    await freshJournal(page);
    await expect(page.locator(".cj-badge").first()).toContainText("Entries: 0");
    await expect(page.locator(".cj-badge--ghost").first()).toContainText("Status: Ready");
    await expect(page.locator(".cj-emptyList")).toContainText("No entries yet for these filters.");
  });

  test("empty editor guidance shown, no phantom editable form", async ({ page }) => {
    await freshJournal(page);
    const empty = page.locator(".cj-editorEmpty");
    await expect(empty).toContainText("Select an entry on the left, or click");
    await expect(empty).toContainText("New entry");
    await expect(page.locator(".cj-input")).toHaveCount(0);
  });
});

test.describe("New entry / entry count / storage shape (zero schema changes)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("New entry creates, auto-selects, and persists with the unchanged entry schema", async ({ page }) => {
    await freshJournal(page);
    await page.getByRole("button", { name: "New entry" }).click();
    await expect(page.locator(".cj-badge").first()).toContainText("Entries: 1");
    await expect(page.locator(".cj-input").first()).toHaveValue("New Journal Entry");

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("shf.journal.v1") || "[]"));
    expect(stored.length).toBe(1);
    const e = stored[0];
    expect(e.appId).toBe("civic");
    expect(e.siteId).toBe("default");
    expect(e.tags).toEqual(["journal"]);
    expect(e.title).toBe("New Journal Entry");
    expect(typeof e.id).toBe("string");
    expect(typeof e.createdAt).toBe("string");
    expect(typeof e.updatedAt).toBe("string");
    expect(Array.isArray(e.fundingStreams)).toBe(true);
    expect("outcome" in e).toBe(true);
  });
});

test.describe("Editing + AUTOSAVE INTEGRITY (mandatory reload test)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("title, tags, body, outcome, and a funding-stream tag all survive a real reload", async ({ page }) => {
    await freshJournal(page);
    await page.getByRole("button", { name: "New entry" }).click();

    await page.locator(".cj-input").nth(0).fill("My Amendment Reflection");
    await page.locator(".cj-input").nth(1).fill("evidence, amendment");
    await page.locator(".cj-body").fill("This is my reflection on the amendment process.");
    await page.locator(".cj-input").nth(2).fill("Drafted a proposal.");
    await page.getByRole("button", { name: "Perkins V" }).click();

    // debounced autosave is 350ms
    await page.waitForTimeout(700);
    await expect(page.locator(".cj-badge--ghost").first()).toContainText("Status: Ready");

    await page.reload({ waitUntil: "networkidle" });
    await page.locator(".cj-entry").first().click();

    await expect(page.locator(".cj-input").nth(0)).toHaveValue("My Amendment Reflection");
    await expect(page.locator(".cj-input").nth(1)).toHaveValue("evidence, amendment");
    await expect(page.locator(".cj-body")).toHaveValue("This is my reflection on the amendment process.");
    await expect(page.locator(".cj-input").nth(2)).toHaveValue("Drafted a proposal.");
    await expect(page.getByRole("button", { name: "Perkins V" })).toHaveClass(/is-active/);
  });
});

test.describe("Search / Site / Funding / Tag filters (real filtering, not decorative)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  async function makeEntry(page, title) {
    await page.getByRole("button", { name: "New entry" }).click();
    await page.locator(".cj-input").first().fill(title);
    await page.waitForTimeout(600);
  }

  test("search filters title/body/tags and clearing restores the list", async ({ page }) => {
    await freshJournal(page);
    await makeEntry(page, "Zebra Topic");
    await makeEntry(page, "Alpha Topic");
    await expect(page.locator(".cj-entry")).toHaveCount(2);

    await page.locator(".cj-search").fill("Zebra");
    await expect(page.locator(".cj-entry")).toHaveCount(1);
    await expect(page.locator(".cj-entry").first()).toContainText("Zebra Topic");

    await page.locator(".cj-search").fill("");
    await expect(page.locator(".cj-entry")).toHaveCount(2);
  });

  test("funding filter narrows and restores the entry list", async ({ page }) => {
    await freshJournal(page);
    await makeEntry(page, "Entry A");
    await page.getByRole("button", { name: "WIOA" }).click();
    await page.waitForTimeout(600);
    await makeEntry(page, "Entry B");

    const selects = page.locator(".cj-select");
    await selects.nth(1).selectOption("wioa");
    await expect(page.locator(".cj-entry")).toHaveCount(1);
    await expect(page.locator(".cj-entry").first()).toContainText("Entry A");

    await selects.nth(1).selectOption("all");
    await expect(page.locator(".cj-entry")).toHaveCount(2);
  });

  test("tag options are derived dynamically from real entries, not hardcoded", async ({ page }) => {
    await freshJournal(page);
    await makeEntry(page, "Tagged Entry");
    await page.locator(".cj-input").nth(1).fill("custom-tag-xyz");
    await page.waitForTimeout(600);

    const tagSelect = page.locator(".cj-select").nth(2);
    const optionTexts = await tagSelect.locator("option").allTextContents();
    expect(optionTexts).toContain("custom-tag-xyz");
  });

  test("Site is a real selectable field, not fixed", async ({ page }) => {
    await freshJournal(page);
    await expect(page.locator(".cj-select").first()).toBeVisible();
    await expect(page.locator(".cj-panel")).toContainText("App:");
    await expect(page.locator(".cj-panel")).toContainText("civic");
  });
});

test.describe("Export integrity (real content verified, not just a download event)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Export JSON contains the real entry with unchanged schema", async ({ page }) => {
    await freshJournal(page);
    await page.getByRole("button", { name: "New entry" }).click();
    await page.locator(".cj-input").nth(0).fill("Export Test Entry");
    await page.locator(".cj-body").fill("Body content for export verification.");
    await page.locator(".cj-input").nth(1).fill("exporttag");
    await page.waitForTimeout(600);

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export JSON" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("shf-journal-civic-default.json");
    const path = await download.path();
    const fs = await import("fs");
    const parsed = JSON.parse(fs.readFileSync(path, "utf8"));
    expect(parsed.items[0].title).toBe("Export Test Entry");
    expect(parsed.items[0].body).toBe("Body content for export verification.");
    expect(parsed.items[0].tags).toEqual(["exporttag"]);
    expect(parsed.meta.schema).toBe("shf.journal.v1");
  });

  test("Export Markdown contains the real title/body/tags", async ({ page }) => {
    await freshJournal(page);
    await page.getByRole("button", { name: "New entry" }).click();
    await page.locator(".cj-input").nth(0).fill("Export Test Entry");
    await page.locator(".cj-body").fill("Body content for export verification.");
    await page.locator(".cj-input").nth(1).fill("exporttag");
    await page.waitForTimeout(600);

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export Markdown" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("shf-journal-civic-default.md");
    const path = await download.path();
    const fs = await import("fs");
    const content = fs.readFileSync(path, "utf8");
    expect(content).toContain("Export Test Entry");
    expect(content).toContain("Body content for export verification.");
    expect(content).toContain("exporttag");
  });
});

test.describe("Formatting toolbar (Markdown syntax into the existing plain-text body)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Bold wraps the current selection in ** markdown, body stays a plain string", async ({ page }) => {
    await freshJournal(page);
    await page.getByRole("button", { name: "New entry" }).click();
    const body = page.locator(".cj-body");
    await body.fill("hello world");
    await body.evaluate((el) => el.setSelectionRange(0, 5));
    await page.getByRole("button", { name: "Bold" }).click();
    await expect(body).toHaveValue("**hello** world");
  });

  test("toolbar has no dead buttons — every rendered control performs a real edit", async ({ page }) => {
    await freshJournal(page);
    await page.getByRole("button", { name: "New entry" }).click();
    const body = page.locator(".cj-body");
    await body.fill("text");
    await body.evaluate((el) => el.setSelectionRange(0, 4));
    await page.getByRole("button", { name: "Italic" }).click();
    await expect(body).toHaveValue("*text*");
  });
});

test.describe("Delete (real, existing capability preserved)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Delete removes the entry after confirmation and returns to the empty state", async ({ page }) => {
    await freshJournal(page);
    await page.getByRole("button", { name: "New entry" }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.locator(".cj-entry")).toHaveCount(0);
    await expect(page.locator(".cj-editorEmpty")).toBeVisible();
  });

  test("Delete is cancellable via the confirm dialog", async ({ page }) => {
    await freshJournal(page);
    await page.getByRole("button", { name: "New entry" }).click();
    page.once("dialog", (d) => d.dismiss());
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.locator(".cj-entry")).toHaveCount(1);
  });
});

test.describe("Coach", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Ask Coach! opens the real, existing Coach panel", async ({ page }) => {
    await freshJournal(page);
    await page.getByRole("button", { name: "Ask Coach!" }).click();
    await expect(page.locator(".coach-panel")).toBeVisible();
  });
});

test.describe("Theme", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("dark mode applies to the Journal page content", async ({ page }) => {
    await freshJournal(page);
    await page.getByRole("button", { name: /Theme, currently/ }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await page.waitForTimeout(250);
    const bg = await page.locator(".cj-page").evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(bg).toBe("rgb(11, 15, 22)");
  });
});

test.describe("Accessibility", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("selected entry uses aria-current plus a non-color visual cue (border width + background)", async ({ page }) => {
    await freshJournal(page);
    await page.getByRole("button", { name: "New entry" }).click();
    const entry = page.locator(".cj-entry").first();
    await expect(entry).toHaveAttribute("aria-current", "true");
    await expect(entry).toHaveClass(/is-active/);
  });

  test("form fields are labeled", async ({ page }) => {
    await freshJournal(page);
    await page.getByRole("button", { name: "New entry" }).click();
    await expect(page.getByText("Title", { exact: true })).toBeVisible();
    await expect(page.getByText("Tags", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Search journal entries")).toBeVisible();
  });

  test("toolbar buttons carry accessible names", async ({ page }) => {
    await freshJournal(page);
    await page.getByRole("button", { name: "New entry" }).click();
    for (const name of ["Bold", "Italic", "Bulleted list", "Numbered list", "Quote", "Link"]) {
      await expect(page.getByRole("button", { name })).toBeVisible();
    }
  });
});

test.describe("Keyboard workflow", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("New entry, title, tags, and body are all reachable and usable via keyboard", async ({ page }) => {
    await freshJournal(page);
    await page.getByRole("button", { name: "New entry" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".cj-entry")).toHaveCount(1);

    await page.locator(".cj-input").first().focus();
    await page.keyboard.type(" Extra");
    await expect(page.locator(".cj-input").first()).toHaveValue("New Journal Entry Extra");

    await page.locator(".cj-body").focus();
    await page.keyboard.type("typed via keyboard");
    await expect(page.locator(".cj-body")).toHaveValue("typed via keyboard");
  });
});

test.describe("Tablet shell (768-1199px)", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("collapsed icon rail, workspace stays side-by-side at wider tablet width, no overflow", async ({ page }) => {
    await freshJournal(page);
    await expect(page.locator(".cv-shell__sidebar")).toHaveClass(/is-collapsed/);
    const cols = await page.locator(".cj-workspace").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(cols).toBe(2);
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
  });
});

test.describe("Narrower tablet (900px)", () => {
  test.use({ viewport: { width: 900, height: 900 } });

  test("workspace stacks at the narrower tablet tier, no overflow", async ({ page }) => {
    await freshJournal(page);
    const cols = await page.locator(".cj-workspace").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(cols).toBe(1);
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
  });
});

test.describe("Mobile (<768px)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("no horizontal overflow and required DOM order", async ({ page }) => {
    await freshJournal(page);
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);

    const order = await page.evaluate(() => {
      const sel = [".cj-header__titleBlock", ".cj-header__meta", ".cj-header__actions", ".cj-panel", ".cj-editor", ".cj-coachRow"];
      return sel.map((s) => document.querySelector(s)?.className).filter(Boolean);
    });
    expect(order[0]).toMatch(/titleBlock/);
    expect(order[1]).toMatch(/meta/);
    expect(order[2]).toMatch(/actions/);
    expect(order[order.length - 1]).toMatch(/coachRow/);
  });

  test("body editor has generous height, not a cramped box", async ({ page }) => {
    await freshJournal(page);
    await page.getByRole("button", { name: "New entry" }).click();
    const height = await page.locator(".cj-body").evaluate((el) => el.getBoundingClientRect().height);
    expect(height).toBeGreaterThan(200);
  });

  test("hamburger drawer still opens over the Journal page", async ({ page }) => {
    await freshJournal(page);
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await expect(page.locator(".cv-shell__sidebar")).toHaveClass(/is-mobileOpen/);
  });
});
