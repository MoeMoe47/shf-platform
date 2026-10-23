import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Module, { createRequire } from "node:module";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import postcss from "postcss";
const require = createRequire(import.meta.url);
const root = process.cwd();
const compiled = await build({
  stdin: {
    contents:
      "export {default} from './src/foundation/components/FoundationDonationNav.jsx'",
    resolveDir: root,
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
  external: ["react"],
});
const mod = new Module(`${root}/.donation-nav-test.cjs`);
mod.filename = `${root}/.donation-nav-test.cjs`;
mod.paths = require.resolve.paths("react");
mod._compile(compiled.outputFiles[0].text, mod.filename);
const html = renderToStaticMarkup(React.createElement(mod.exports.default));
const source = readFileSync(
  "src/foundation/components/FoundationDonationNav.jsx",
  "utf8",
);
const css = postcss.parse(
  readFileSync("src/foundation/styles/foundation-donation.css", "utf8"),
);

test("exact five semantic navigation controls, default current item and hidden decorative icons", () => {
  assert.match(html, /<nav[^>]*aria-label="Donation page sections"/);
  const controls = [
    ...html.matchAll(/<(button|a)\b([^>]*)>([\s\S]*?)<\/(?:button|a)>/g),
  ];
  assert.deepEqual(
    controls.map((m) => [m[1], m[3].replace(/<[^>]+>/g, "")]),
    [
      ["button", "Make a Gift"],
      ["button", "Ways to Give"],
      ["button", "Where It Goes"],
      ["a", "Impact Stories"],
      ["a", "Partner With Us"],
    ],
  );
  assert.match(controls[0][2], /aria-current="location"/);
  assert.equal((html.match(/aria-current=/g) || []).length, 1);
  assert.equal((html.match(/<svg\b/g) || []).length, 5);
  assert.equal((html.match(/aria-hidden="true"/g) || []).length, 5);
  assert.equal((html.match(/type="button"/g) || []).length, 3);
  assert.match(controls[3][2], /href="#impact"/);
  assert.match(controls[4][2], /href="#\/partners"/);
});

test("scroll targets are existing unique focusable sections; route destinations are canonical", () => {
  for (const [id, path] of [
    ["make-a-gift", "src/foundation/pages/Donation.jsx"],
    ["ways-to-give", "src/foundation/components/FoundationWaysToGive.jsx"],
    ["where-it-goes", "src/foundation/components/FoundationGiftImpact.jsx"],
  ]) {
    const target = readFileSync(path, "utf8");
    assert.equal(target.split(`id="${id}"`).length - 1, 1);
    assert.match(target, /tabIndex=\{-1\}/);
    assert.ok(source.includes(`"${id}"`));
  }
  assert.match(
    readFileSync("src/foundation/pages/Home.jsx", "utf8"),
    /id="impact"/,
  );
  assert.match(
    readFileSync("src/foundation/pages/PublicInfoPage.jsx", "utf8"),
    /partners:\s*\{/,
  );
  assert.match(
    readFileSync("src/foundation/App.jsx", "utf8"),
    /\["programs", "partners", "reports"\].includes\(route\)/,
  );
  const page = readFileSync("src/foundation/pages/Donation.jsx", "utf8");
  assert.match(
    page,
    /<FoundationDonationHero\s*\/>\s*<FoundationDonationNav\s*\/>\s*<section/,
  );
});

test("scroll source guards missing targets, measures sticky header, retains focus and reduced motion", () => {
  assert.match(source, /if \(!target\) return;/);
  assert.match(source, /querySelector\("\.shf-institutional-header"\)/);
  assert.match(source, /target.focus\(\{ preventScroll: true \}\)/);
  assert.match(source, /window.scrollTo/);
  assert.match(source, /-\s*headerHeight\s*-\s*16/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /\? "instant"\s*: "smooth"/);
  assert.doesNotMatch(source, /IntersectionObserver|location\.hash\s*=/);
});

test("strip has ivory surface, restrained dividers, accessible focus and local horizontal scrolling", () => {
  function declarations(selector) {
    const result = {};
    css.walkRules((rule) => {
      if (rule.parent.type === "root" && rule.selector === selector)
        rule.walkDecls((d) => (result[d.prop] = d.value));
    });
    return result;
  }
  const strip = declarations(".shf-donation-nav");
  assert.equal(strip.display, "flex");
  assert.equal(strip["overflow-x"], "auto");
  assert.equal(strip.background, "#fffdf8");
  const items = declarations(".shf-donation-nav > :is(button, a)");
  assert.ok(parseInt(items["min-height"]) >= 44);
  assert.ok(parseInt(items["font-size"]) >= 14);
  assert.equal(items["white-space"], "nowrap");
  assert.equal(
    declarations(".shf-donation-nav > [aria-current]")["border-bottom-color"],
    "var(--shf-orange)",
  );
  assert.equal(
    declarations(".shf-donation-nav > :is(button, a):not(:last-child)::after")
      .width,
    "1px",
  );
  assert.equal(
    declarations(".shf-donation-nav > :is(button, a):focus-visible")[
      "outline-offset"
    ],
    "-5px",
  );
  assert.equal(
    declarations(".shf-donation-nav svg").color,
    "var(--shf-orange)",
  );
});
