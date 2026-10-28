import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";
import { expect } from "@playwright/test";

const root = resolve(process.env.OAS_WEBSITE_BUILD_DIR || "dist-oas-website");
const routes = ["/oas.html", "/oas-1.html", "/oas-control-domains.html", "/oas-purpose-boundaries.html", "/oas-risk-classification.html"];
const labels = ["Overview", "OAS-1", "Control Domains", "Purpose & Boundaries", "Risk Classification"];
const publication = "9fc98273119dd1ccb43078b56abb1de02071214f";
let browser, server, origin, axeSource;
const evidence = [];
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".md": "text/markdown", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp" };
before(async () => {
  await stat(resolve(root, "oas.html"));
  // No skipped accessibility gate: install axe-core or supply an approved local copy.
  const axePath = process.env.OAS_AXE_PATH || import.meta.resolve("axe-core/axe.min.js");
  axeSource = await readFile(axePath.startsWith("file:") ? new URL(axePath) : axePath, "utf8");
  server = createServer(async (req, res) => {
    try {
      const path = resolve(root, "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname));
      if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
      const bytes = await readFile(path);
      res.writeHead(200, { "content-type": mime[extname(path)] || "application/octet-stream" }).end(bytes);
    } catch { res.writeHead(404).end("Not found"); }
  });
  await new Promise(done => server.listen(0, "127.0.0.1", done));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
});
after(async () => {
  await browser?.close();
  if (server) await new Promise(done => server.close(done));
  if (process.env.OAS_WEBSITE_EVIDENCE_DIR) {
    const { writeFile } = await import("node:fs/promises");
    await mkdir(process.env.OAS_WEBSITE_EVIDENCE_DIR, { recursive: true });
    await writeFile(resolve(process.env.OAS_WEBSITE_EVIDENCE_DIR, "browser-results.json"), JSON.stringify(evidence, null, 2) + "\n");
  }
});
async function pageFor(route, width = 1440) {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  assert.equal((await page.goto(origin + route, { waitUntil: "networkidle" })).status(), 200);
  assert.deepEqual(errors, [], "No runtime/asset failures");
  return page;
}
for (const route of routes) {
  test(`${route}: renders pinned release and consistent reachable navigation`, async () => {
    const page = await pageFor(route);
    try {
      assert.equal(await page.locator("h1").count(), 1);
      assert.match(await page.locator("footer").innerText(), /OAS-1@1\.0\.0/);
      const text = await page.locator("body").innerText();
      assert.doesNotMatch(text, /working draft|public review|draft release|provisional/i);
      assert.match(text, /14 requirements across 8 domains/);
      assert.match(text, /NOT_EVALUATED/);
      const nav = page.getByRole("navigation", { name: "Primary", exact: true });
      assert.deepEqual(await nav.locator("a").allTextContents(), labels);
      assert.deepEqual(await nav.locator("a").evaluateAll(a => a.map(x => x.getAttribute("href"))), routes);
      assert.equal(await nav.locator('[aria-current="page"]').getAttribute("href"), route);
      for (const target of routes) {
        await page.goto(origin + route);
        await page.getByRole("navigation", { name: "Primary", exact: true }).locator(`a[href="${target}"]`).click();
        await page.waitForURL(origin + target);
        assert.equal(await page.locator("h1").count(), 1);
      }
    } finally { await page.close(); }
  });
  test(`${route}: 320/375/768/1440px reflow, keyboard menu and focus`, async () => {
    const page = await pageFor(route, 320);
    try {
      for (const width of [320, 375, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
        assert.ok(dimensions.scroll <= width, JSON.stringify(dimensions));
        evidence.push({ route, ...dimensions });
      }
      await page.setViewportSize({ width: 320, height: 900 });
      const toggle = page.getByRole("button", { name: "Toggle navigation menu" });
      await toggle.focus(); await page.keyboard.press("Enter");
      assert.equal(await toggle.getAttribute("aria-expanded"), "true");
      for (const link of await page.locator("header nav a").all()) assert.ok(await link.isVisible());
      await page.keyboard.press("Tab");
      // Media-query/style recalculation completes at the next browser frame after resizing.
      // Use the browser assertion's normal retry, rather than sampling before paint.
      await expect(page.locator("header nav a").first()).toBeFocused();
      await expect(page.locator("header nav a").first()).toHaveCSS("outline-width", /^(?:[2-9]|[1-9]\d+)(?:\.\d+)?px$/);
      await page.keyboard.press("Escape");
      assert.equal(await toggle.getAttribute("aria-expanded"), "false");
      assert.ok(await toggle.evaluate(e => e === document.activeElement));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
    } finally { await page.close(); }
  });
  test(`${route}: WCAG A/AA automated accessibility, desktop and mobile`, async () => {
    const page = await pageFor(route);
    try {
      await page.addScriptTag({ content: axeSource });
      for (const width of [1440, 320]) {
        await page.setViewportSize({ width, height: 1000 });
        const result = await page.evaluate(async () => {
          const result = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
          return { violations: result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })), incomplete: result.incomplete.map(v => ({ id: v.id, count: v.nodes.length })) };
        });
        evidence.push({ route, width, accessibility: result });
        if (process.env.OAS_WEBSITE_EVIDENCE_DIR) {
          await mkdir(process.env.OAS_WEBSITE_EVIDENCE_DIR, { recursive: true });
          await page.screenshot({ path: resolve(process.env.OAS_WEBSITE_EVIDENCE_DIR, `${route.slice(1, -5)}-${width}.png`), fullPage: true });
        }
        assert.deepEqual(result.violations, [], JSON.stringify(result.violations));
      }
    } finally { await page.close(); }
  });
}
const resources = [
  ["/oas/catalogs/OAS-1@1.0.0.json", "public/oas/catalogs/OAS-1@1.0.0.json", "application/json"],
  ["/oas/OAS-1@1.0.0.md", "public/oas/OAS-1@1.0.0.md", "text/markdown"],
  ["/oas/currentness.json", "public/oas/currentness.json", "application/json"],
  ["/oas/declaration.schema.json", "schemas/oas/closure/declaration.schema.json", "application/json"],
];
for (const [url, source, type] of resources) test(`${url}: built response is the exact frozen file`, async () => {
  const response = await fetch(origin + url, { redirect: "error" });
  assert.equal(response.status, 200); assert.equal(response.headers.get("content-type"), type);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.deepEqual(bytes, execFileSync("git", ["show", `${publication}:${source}`]));
  assert.doesNotMatch(bytes.toString(), /^\s*<!doctype html/i);
  if (url.endsWith(".json")) JSON.parse(bytes.toString());
  if (url.includes("catalogs")) assert.equal(createHash("sha256").update(bytes).digest("hex"), "9ca2b2b9cc17acd419e9961387e65d0ca3de33fde557d5440f96856dc186892e");
});
test("every reachable page link, fragment and release CTA has a real destination", async () => {
  const links = new Map();
  for (const route of routes) {
    const page = await pageFor(route);
    for (const href of await page.locator("a").evaluateAll(a => a.map(x => x.href))) links.set(href, route);
    if (route === "/oas-1.html") {
      for (const [url] of resources) assert.ok(await page.locator(`a[href="${url}"]`).count(), `Resource access missing: ${url}`);
      assert.match(await page.locator(".oas1-release-summary").innerText(), /Declaration contract 1\.1\.0/);
    }
    await page.close();
  }
  for (const [href, source] of links) {
    const url = new URL(href);
    assert.equal(url.origin, origin, `Unexpected external destination from ${source}`);
    const response = await fetch(href, { redirect: "error" }); assert.equal(response.status, 200, href);
    if (url.hash) {
      const page = await pageFor(url.pathname);
      assert.equal(await page.locator(`[id="${decodeURIComponent(url.hash.slice(1))}"]`).count(), 1, href);
      await page.close();
    }
  }
  evidence.push({ checkedLinks: links.size, brokenLinks: 0 });
});
test("reduced motion disables nonessential canvas and CSS animation", async () => {
  for (const route of routes) {
    const page = await pageFor(route);
    assert.equal(await page.locator("canvas").count(), 0, route);
    assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.playState === "running").length), 0, route);
    await page.close();
  }
});

test("mobile risk comparison is keyboard focusable and scrollable", async () => {
  const page = await pageFor("/oas-risk-classification.html", 320);
  try {
    const region = page.getByRole("region", { name: "Informative risk comparison — scroll horizontally" });
    await region.focus(); await expect(region).toBeFocused();
    const before = await region.evaluate(e => e.scrollLeft);
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => region.evaluate(e => e.scrollLeft)).toBeGreaterThan(before);
  } finally { await page.close(); }
});

test("OAS-1 presents exactly 14 canonical requirements across 8 canonical domains", async () => {
  const page = await pageFor("/oas-1.html");

  try {
    const requirementCards = page.locator(".oas1-requirement");
    const domainSections = page.locator(".oas1-requirement-domain");

    assert.equal(await requirementCards.count(), 14);
    assert.equal(await domainSections.count(), 8);

    const requirementIds = await page
      .locator(".oas1-requirement__id")
      .allTextContents();

    assert.deepEqual(requirementIds, [
      "OAS-1-REQ-0001",
      "OAS-1-REQ-0002",
      "OAS-1-REQ-0003",
      "OAS-1-REQ-0004",
      "OAS-1-REQ-0005",
      "OAS-1-REQ-0006",
      "OAS-1-REQ-0007",
      "OAS-1-REQ-0008",
      "OAS-1-REQ-0009",
      "OAS-1-REQ-0010",
      "OAS-1-REQ-0012",
      "OAS-1-REQ-0014",
      "OAS-1-REQ-0016",
      "OAS-1-REQ-0017",
    ]);
  } finally {
    await page.close();
  }
});

test("OAS-1 requirement-to-domain mapping matches the frozen release", async () => {
  const page = await pageFor("/oas-1.html");

  try {
    const expected = {
      "OAS-1-D01": ["OAS-1-REQ-0001", "OAS-1-REQ-0002"],
      "OAS-1-D02": ["OAS-1-REQ-0003", "OAS-1-REQ-0004", "OAS-1-REQ-0005"],
      "OAS-1-D03": ["OAS-1-REQ-0006", "OAS-1-REQ-0007"],
      "OAS-1-D04": ["OAS-1-REQ-0008", "OAS-1-REQ-0009"],
      "OAS-1-D05": ["OAS-1-REQ-0010"],
      "OAS-1-D06": ["OAS-1-REQ-0012"],
      "OAS-1-D07": ["OAS-1-REQ-0014"],
      "OAS-1-D08": ["OAS-1-REQ-0016", "OAS-1-REQ-0017"],
    };

    for (const [domainId, requirementIds] of Object.entries(expected)) {
      const domain = page.locator(".oas1-requirement-domain").filter({
        has: page.getByText(domainId, { exact: false }),
      });

      assert.equal(await domain.count(), 1);

      const rendered = await domain
        .locator(".oas1-requirement__id")
        .allTextContents();

      assert.deepEqual(rendered, requirementIds);
    }
  } finally {
    await page.close();
  }
});

test("OAS requirement and domain links are stable and reachable", async () => {
  const page = await pageFor("/oas-1.html");

  try {
    for (const id of [
      "OAS-1-REQ-0001",
      "OAS-1-REQ-0002",
      "OAS-1-REQ-0003",
      "OAS-1-REQ-0004",
      "OAS-1-REQ-0005",
      "OAS-1-REQ-0006",
      "OAS-1-REQ-0007",
      "OAS-1-REQ-0008",
      "OAS-1-REQ-0009",
      "OAS-1-REQ-0010",
      "OAS-1-REQ-0012",
      "OAS-1-REQ-0014",
      "OAS-1-REQ-0016",
      "OAS-1-REQ-0017",
    ]) {
      const anchor = `requirement-${id.toLowerCase()}`;
      assert.equal(await page.locator(`#${anchor}`).count(), 1);
    }

    for (const domainId of [
      "OAS-1-D01",
      "OAS-1-D02",
      "OAS-1-D03",
      "OAS-1-D04",
      "OAS-1-D05",
      "OAS-1-D06",
      "OAS-1-D07",
      "OAS-1-D08",
    ]) {
      const href = `/oas-control-domains.html#domain-${domainId.toLowerCase()}`;
      assert.ok(await page.locator(`a[href="${href}"]`).count() >= 1);
    }
  } finally {
    await page.close();
  }
});

test("OAS-1 preserves release identity and NOT_EVALUATED boundary", async () => {
  const page = await pageFor("/oas-1.html");

  try {
    const text = await page.locator("body").innerText();

    assert.match(text, /OAS-1@1\.0\.0/);
    assert.match(text, /14 requirements/);
    assert.match(text, /8 domains/);
    assert.match(text, /NOT_EVALUATED/);

    assert.doesNotMatch(
      text,
      /working draft|public review|draft release|provisional/i
    );

    assert.match(
      text,
      /does not certify, assess, endorse, or behaviorally verify/i
    );
  } finally {
    await page.close();
  }
});
