import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Module, { createRequire } from "node:module";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import postcss from "postcss";

const root = process.cwd();
const require = createRequire(import.meta.url);
const compiled = await build({
  stdin: {
    contents: `export {default as Layout} from './src/foundation/layout/FoundationLayout.jsx';
      export {default as Donation} from './src/foundation/pages/Donation.jsx';`,
    resolveDir: root,
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
  loader: { ".css": "empty", ".webp": "dataurl" },
  alias: { "@": `${root}/src` },
  external: ["react"],
  define: { "import.meta.env": "{}" },
});
const mod = new Module(`${root}/.foundation-donation-header-test.cjs`);
mod.filename = `${root}/.foundation-donation-header-test.cjs`;
mod.paths = require.resolve.paths("react");
mod._compile(compiled.outputFiles[0].text, mod.filename);
function render(hash) {
  const previous = globalThis.window;
  try {
    globalThis.window = { location: { hash } };
    return renderToStaticMarkup(
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
}
const donation = render("#/get-involved");
const header = (html) =>
  html.match(/<header class="shf-institutional-header"[\s\S]*?<\/header>/)?.[0];

test("Donation uses exactly the shared homepage header with only Support current state", () => {
  const app = readFileSync("src/foundation/App.jsx", "utf8");
  assert.match(app, /route === "get-involved"\) page = <Donation \/>/);
  assert.match(app, /<FoundationLayout>\{page\}<\/FoundationLayout>/);
  assert.equal(
    (donation.match(/class="shf-institutional-header"/g) || []).length,
    1,
  );
  assert.equal(
    header(donation).replace(' aria-current="page"', ""),
    header(render("#/top")),
  );
  assert.match(
    header(donation),
    /class="shf-institutional-header__support" aria-current="page" href="#\/get-involved"/,
  );
  assert.equal(
    (header(donation).match(/aria-current="page"/g) || []).length,
    1,
  );
});

test("Donation retains official desktop wordmark, canonical compact mark and public destinations", () => {
  const html = header(donation);
  assert.match(
    html,
    /src="\/assets\/brand\/shf-official-logo.webp" alt="Silicon Heartland Foundation" width="1834" height="371"/,
  );
  assert.match(
    html,
    /media="\(max-width: 680px\)" srcSet="\/assets\/brand\/shf-official-heart.png"/,
  );
  for (const asset of ["shf-official-logo.webp", "shf-official-heart.png"])
    assert.ok(readFileSync(`public/assets/brand/${asset}`).length > 0);
  const nav = html.match(
    /<nav[^>]*aria-label="Foundation navigation"[^>]*>([\s\S]*?)<\/nav>/,
  )[1];
  assert.deepEqual(
    [...nav.matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map((m) => [
      m[2],
      m[1],
    ]),
    [
      ["About", "#/about"],
      ["Our Work", "#/programs"],
      ["Programs", "#/programs"],
      ["Our Impact", "#impact"],
      ["Partners", "#/partners"],
      ["Resources", "#/reports"],
    ],
  );
  assert.equal(
    (html.match(/href="#\/reports" aria-label="Search SHF resources"/g) || [])
      .length,
    2,
  );
  assert.match(
    html,
    /aria-label="Open Foundation menu" aria-expanded="false" aria-controls="shf-header-navigation"/,
  );
});

test("Donation defines no page-specific header markup or header style overrides", () => {
  assert.doesNotMatch(
    readFileSync("src/foundation/pages/Donation.jsx", "utf8"),
    /FoundationHeader|<header|SHFLogo/,
  );
  const css = postcss.parse(
    readFileSync("src/foundation/styles/foundation-donation.css", "utf8"),
  );
  css.walkRules((rule) =>
    assert.doesNotMatch(
      rule.selector,
      /institutional-header|official-logo|shf-site|shf-home-mock|^header\b/,
    ),
  );
});

test("canonical solid text/background colors satisfy WCAG AA normal-text contrast", () => {
  function luminance(hex) {
    const channels = hex
      .match(/\w\w/g)
      .map((s) => parseInt(s, 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  }
  const css = postcss.parse(
    readFileSync("src/foundation/styles/foundation-header.css", "utf8"),
  );
  for (const selector of [
    ".shf-institutional-header",
    ".shf-institutional-header a.shf-institutional-header__support",
  ]) {
    const colors = {};
    css.walkRules((rule) => {
      if (rule.parent.type === "root" && rule.selector === selector) {
        rule.walkDecls((decl) => {
          colors[decl.prop] = decl.value;
        });
      }
    });
    const background = colors.background.replace("#", "");
    const foreground = colors.color.replace("#", "");
    const ratio =
      (luminance(background) + 0.05) / (luminance(foreground) + 0.05);
    assert.ok(ratio >= 4.5, `${selector}: ${ratio}`);
  }
});
