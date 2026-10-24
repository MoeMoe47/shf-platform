import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Module, { createRequire } from "node:module";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const root = process.cwd();
const require = createRequire(import.meta.url);
const compiled = await build({
  stdin: {
    contents:
      "export {default as Layout} from './src/foundation/layout/FoundationLayout.jsx'; export {default as Donation} from './src/foundation/pages/Donation.jsx'",
    resolveDir: root,
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
  external: ["react"],
  loader: { ".css": "empty", ".webp": "dataurl" },
  alias: { "@": `${root}/src` },
  define: { "import.meta.env": "{}" },
});
const mod = new Module(`${root}/.donation-final-test.cjs`);
mod.filename = `${root}/.donation-final-test.cjs`;
mod.paths = require.resolve.paths("react");
mod._compile(compiled.outputFiles[0].text, mod.filename);
const previous = globalThis.window;
let html;
try {
  globalThis.window = { location: { hash: "#/get-involved" } };
  html = renderToStaticMarkup(
    React.createElement(
      mod.exports.Layout,
      null,
      React.createElement(mod.exports.Donation),
    ),
  );
} finally {
  if (previous === undefined) delete globalThis.window;
  else globalThis.window = previous;
}

test("assembled page has exactly the nine approved regions in order with one shared shell", () => {
  const markers = [
    'class="shf-institutional-header"',
    'class="shf-donation-hero"',
    'class="shf-donation-nav shf-donation-shell"',
    'id="make-a-gift"',
    'id="ways-to-give"',
    'id="where-it-goes"',
    'class="shf-donation-transparency shf-donation-shell"',
    'class="shf-final-cta"',
    '<footer class="shf-footer"',
  ];
  const positions = markers.map((marker) => {
    assert.equal(html.split(marker).length - 1, 1, marker);
    return html.indexOf(marker);
  });
  assert.deepEqual(
    [...positions].sort((a, b) => a - b),
    positions,
  );
  assert.equal((html.match(/<header\b/g) || []).length, 1);
  assert.equal((html.match(/<main\b/g) || []).length, 1);
  assert.equal((html.match(/<footer\b/g) || []).length, 1);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /<\/main><section[^>]*class="shf-final-cta"/);
  assert.ok(html.endsWith("</footer></div>"));
  assert.equal((html.match(/<dialog\b/g) || []).length, 1);
  assert.doesNotMatch(html, /<dialog[^>]*\sopen(?:[=>\s])/);
});

test("assembled IDs, input labels and ARIA references resolve uniquely; icons and images are accessible", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const m of html.matchAll(
    /(?:aria-labelledby|aria-describedby|aria-controls|\bfor)="([^"]+)"/g,
  ))
    for (const id of m[1].split(" "))
      assert.ok(ids.includes(id), `Unresolved ${id}`);
  const images = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  assert.equal(images.length, 11);
  for (const image of images) assert.match(image, /alt="[^"<]+"/);
  for (const svg of html.matchAll(/<svg\b[^>]*>/g))
    assert.match(svg[0], /aria-hidden="true"/);
  assert.match(html, /shf-institutional-header__support" aria-current="page"/);
});

test("only the custom USD input/form and safe unconfigured handoff exist, with no collection fields or fake receipts", () => {
  const inputs = [...html.matchAll(/<input\b[^>]*>/g)].map((m) => m[0]);
  assert.equal(inputs.length, 1);
  assert.match(inputs[0], /id="shf-custom-amount"/);
  assert.match(inputs[0], /inputMode="decimal"/);
  assert.equal((html.match(/<form\b/g) || []).length, 1);
  assert.doesNotMatch(
    html,
    /card number|bank account|routing number|donation completed|payment successful|transaction ID|receipt number/i,
  );
  for (const path of [
    "src/foundation/components/FoundationGiftSelector.jsx",
    "src/foundation/adapters/donationHandoff.js",
  ])
    assert.doesNotMatch(
      readFileSync(path, "utf8"),
      /fetch\(|localStorage|sessionStorage|XMLHttpRequest|sendBeacon|https:\/\/.*checkout/,
    );
  assert.match(html, /Online payments are not yet available/);
});

test("rendered links stay inside implemented canonical Foundation destinations with no placeholders", () => {
  const known = new Set([
    "/foundation.html",
    "#/about",
    "#/programs",
    "#impact",
    "#/partners",
    "#/reports",
    "#/get-involved",
  ]);
  for (const match of html.matchAll(/<a\b[^>]*href="([^"]+)"/g))
    assert.ok(known.has(match[1]), match[1]);
  const app = readFileSync("src/foundation/App.jsx", "utf8");
  assert.match(app, /route === "get-involved"\) page = <Donation/);
  assert.match(app, /<FoundationLayout>\{page\}<\/FoundationLayout>/);
  assert.doesNotMatch(app, /DataCenterCommunityImpact|data-center-community-impact/);
  assert.doesNotMatch(html, /href="#"|href="javascript:/i);
});

test("all nine approved images appear once in their specified order and approved major copy is intact", () => {
  const expected = [
    "donation-hero.webp",
    "donation-impact-support.webp",
    "donation-one-time-gift.webp",
    "donation-monthly-giving.webp",
    "donation-corporate-support.webp",
    "donation-grants-foundations.webp",
    "donation-employer-partnerships.webp",
    "donation-planned-giving.webp",
    "donation-impact-banner.webp",
  ];
  assert.deepEqual(
    [...html.matchAll(/src="\/assets\/foundation\/donation\/([^"]+)"/g)].map(
      (m) => m[1],
    ),
    expected,
  );
  for (const text of [
    "SUPPORT SHF",
    "Invest in People.",
    "Build Brighter",
    "Tomorrows.",
    "OPPORTUNITY",
    "CHANGES",
    "LIVES.",
    "MAKE A DIFFERENCE",
    "Choose Your Impact.",
    "WAYS TO GIVE",
    "More Ways to Make an Impact.",
    "WHERE YOUR GIFT GOES",
    "Focused on Lasting Impact.",
    "TRUST &amp; TRANSPARENCY",
    "Your Support. Our Responsibility.",
    "Strengthen Communities.",
  ])
    assert.ok(html.includes(text), text);
});
