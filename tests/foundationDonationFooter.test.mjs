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
    contents:
      "export {default as Footer} from './src/foundation/layout/FoundationFooter.jsx'; export {default as Layout} from './src/foundation/layout/FoundationLayout.jsx'; export {default as Donation} from './src/foundation/pages/Donation.jsx'",
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
const mod = new Module(`${root}/.donation-footer-test.cjs`);
mod.filename = `${root}/.donation-footer-test.cjs`;
mod.paths = require.resolve.paths("react");
mod._compile(compiled.outputFiles[0].text, mod.filename);
const Footer = mod.exports.Footer;
const footer = renderToStaticMarkup(React.createElement(Footer));
const links = [
  ["About", "#/about"],
  ["Programs", "#/programs"],
  ["Impact", "#impact"],
  ["Partners", "#/partners"],
  ["Resources", "#/reports"],
  ["News", "#/reports"],
  [
    "Data Center Community Impact",
    "/foundation.html#/data-center-community-impact",
  ],
  ["Contact", "#/get-involved"],
];

test("Donation ends with exactly the shared canonical footer after one shared closing CTA", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      mod.exports.Layout,
      null,
      React.createElement(mod.exports.Donation),
    ),
  );
  assert.equal((html.match(/<footer\b/g) || []).length, 1);
  assert.equal((html.match(/class="shf-final-cta"/g) || []).length, 1);
  assert.match(html, /<\/section><footer class="shf-footer"/);
  assert.ok(html.endsWith("</footer></div>"));
  const footerHtml = html.match(/<footer\b[\s\S]*<\/footer>/)[0];
  assert.equal(footerHtml, footer);
  assert.doesNotMatch(
    readFileSync("src/foundation/pages/Donation.jsx", "utf8"),
    /FoundationFooter|<footer/,
  );
});

test("official wordmark, exact tagline/copyright and decorative social placeholders are preserved", () => {
  assert.match(footer, /aria-label="Silicon Heartland Foundation home"/);
  assert.match(
    footer,
    /src="\/assets\/brand\/shf-official-logo.webp" alt="Silicon Heartland Foundation" width="1834" height="371"/,
  );
  assert.ok(
    readFileSync("public/assets/brand/shf-official-logo.webp").length > 0,
  );
  assert.match(footer, /A stronger region. A brighter tomorrow\./);
  assert.match(
    footer,
    /© 2026 Silicon Heartland Foundation. All rights reserved\./,
  );
  const social = footer.match(
    /<div class="shf-footer__social"([^>]*)>([\s\S]*?)<\/div>/,
  );
  assert.match(social[1], /aria-hidden="true"/);
  assert.deepEqual(
    [...social[2].matchAll(/<span>(.*?)<\/span>/g)].map((m) => m[1]),
    ["in", "yt", "x", "ig"],
  );
  assert.doesNotMatch(social[2], /<a\b/);
});

test("all eight navigation destinations remain valid canonical routes with documented aliases", () => {
  const nav = footer.match(
    /<nav class="shf-footer__links"[^>]*>([\s\S]*?)<\/nav>/,
  )[1];
  assert.deepEqual(
    [...nav.matchAll(/<a href="([^"]+)">([\s\S]*?)<\/a>/g)].map((m) => [
      m[2].trim(),
      m[1],
    ]),
    links,
  );
  assert.doesNotMatch(nav, /href="#"|https?:\/\//);
  const app = readFileSync("src/foundation/App.jsx", "utf8");
  const info = readFileSync("src/foundation/pages/PublicInfoPage.jsx", "utf8");
  for (const route of ["about", "programs", "partners", "reports"]) {
    assert.ok(app.includes(`"${route}"`));
    assert.match(info, new RegExp(`${route}:\\s*\\{`));
  }
  assert.match(app, /route === "get-involved"\) page = <Donation/);
  assert.match(app, /route === "data-center-community-impact"/);
  assert.match(
    readFileSync("src/foundation/pages/Home.jsx", "utf8"),
    /id="impact"/,
  );
  assert.ok(
    readFileSync("src/foundation/pages/DataCenterCommunityImpact.jsx").length >
      0,
  );
});

test("prefixed shared consumers preserve all canonical destinations without duplicate paths", () => {
  const html = renderToStaticMarkup(
    React.createElement(Footer, { baseHref: "/foundation.html" }),
  );
  for (const [, href] of links) {
    const expected = href.startsWith("#") ? `/foundation.html${href}` : href;
    assert.ok(html.includes(`href="${expected}"`));
  }
  assert.doesNotMatch(html, /foundation.html\/foundation.html/);
});

test("footer-only styles provide comfortable targets and visible focus without changing logo or app-wide styles", () => {
  const css = postcss.parse(
    readFileSync("src/foundation/styles/foundation-footer.css", "utf8"),
  );
  const declarations = (selector) => {
    const result = {};
    css.walkRules((rule) => {
      if (rule.selector === selector)
        rule.walkDecls((d) => (result[d.prop] = d.value));
    });
    return result;
  };
  const nav = declarations(".shf-site.shf-home-mock .shf-footer__links a");
  assert.equal(nav["min-height"], "44px");
  assert.equal(nav["min-width"], "44px");
  assert.equal(nav.display, "inline-flex");
  assert.equal(
    declarations(".shf-site.shf-home-mock .shf-footer a:focus-visible").outline,
    "3px solid #061a30",
  );
  const base = readFileSync("src/foundation/styles/foundation.css", "utf8");
  const responsive = readFileSync(
    "src/foundation/styles/shf-home-mock.css",
    "utf8",
  );
  assert.match(base, /\.shf-footer__links\s*\{[^}]*flex-wrap: wrap/);
  assert.match(
    responsive,
    /\.shf-footer__inner,\s*\.shf-final-cta__inner\s*\{[^}]*flex-direction: column/,
  );
  assert.match(
    responsive,
    /\.shf-footer__links,\s*\.shf-footer__social,\s*\.shf-footer__bottom\s*\{[^}]*flex-wrap: wrap/,
  );
});

test("canonical footer foreground and focus colors pass source-based normal-text contrast", () => {
  const palette = readFileSync(
    "src/foundation/styles/shf-home-mock.css",
    "utf8",
  );
  const ink = palette.match(/--shf-ink:\s*(#[0-9a-f]{6})/i)[1];
  const muted = palette.match(/--shf-muted:\s*(#[0-9a-f]{6})/i)[1];
  function luminance(hex) {
    const [r, g, b] = hex
      .slice(1)
      .match(/../g)
      .map((s) => parseInt(s, 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  for (const foreground of [ink, muted, "#061a30"])
    assert.ok(
      (luminance("#fffdf8") + 0.05) / (luminance(foreground) + 0.05) >= 4.5,
    );
});
