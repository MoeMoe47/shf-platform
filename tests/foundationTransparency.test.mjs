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
      "export {default as Transparency} from './src/foundation/components/FoundationTransparency.jsx'; export {default as Donation} from './src/foundation/pages/Donation.jsx'; export {default as Layout} from './src/foundation/layout/FoundationLayout.jsx'",
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
const mod = new Module(`${root}/.transparency-test.cjs`);
mod.filename = `${root}/.transparency-test.cjs`;
mod.paths = require.resolve.paths("react");
mod._compile(compiled.outputFiles[0].text, mod.filename);
const Transparency = mod.exports.Transparency;
const html = renderToStaticMarkup(
  React.createElement(Transparency, { onPreview: () => {} }),
);
function find(node, predicate) {
  const result = [];
  function visit(children) {
    for (const child of React.Children.toArray(children)) {
      if (!React.isValidElement(child)) continue;
      if (predicate(child)) result.push(child);
      visit(child.props.children);
    }
  }
  visit(node);
  return result;
}
const css = postcss.parse(
  readFileSync("src/foundation/styles/foundation-donation.css", "utf8"),
);
function style(selector, width) {
  const result = {};
  css.walkRules((rule) => {
    if (rule.selector !== selector) return;
    for (let p = rule.parent; p; p = p.parent)
      if (p.type === "atrule" && p.name === "media") {
        const max = p.params.match(/max-width:\s*(\d+)px/);
        if (max && width > Number(max[1])) return;
      }
    rule.walkDecls((d) => (result[d.prop] = d.value));
  });
  return result;
}

test("approved commitment copy, H2 and three labelled native actions render without fabricated resources", () => {
  assert.match(html, /aria-labelledby="transparency-title"/);
  assert.equal((html.match(/<h2\b/g) || []).length, 1);
  assert.doesNotMatch(html, /<h1\b/);
  assert.match(html, /TRUST &amp; TRANSPARENCY/);
  assert.match(html, /Your Support. Our Responsibility\./);
  assert.match(
    html,
    /We are committed to transparent reporting and responsible stewardship of every contribution\./,
  );
  assert.equal((html.match(/<button\b/g) || []).length, 2);
  assert.equal((html.match(/<a\b/g) || []).length, 1);
  assert.equal((html.match(/aria-haspopup="dialog"/g) || []).length, 2);
  assert.equal((html.match(/aria-hidden="true"/g) || []).length, 3);
  for (const title of [
    "Financial Reports",
    "Governance Overview",
    "Impact Reporting",
  ])
    assert.ok(html.includes(title));
  assert.match(
    html,
    /role="group" aria-label="Foundation transparency information"/,
  );
  assert.doesNotMatch(
    html,
    /href="#"|\.pdf|download=|Charity Navigator|GuideStar|Candid|audited|Form 990|\d+%/i,
  );
});

test("financial and governance handlers invoke truthful informational states without document fabrication", () => {
  const previews = [];
  const tree = Transparency({ onPreview: (content) => previews.push(content) });
  const buttons = find(tree, (n) => n.type === "button");
  for (const button of buttons) button.props.onClick();
  assert.deepEqual(
    previews.map((p) => p.title),
    ["Financial Reports", "Governance Overview"],
  );
  assert.match(previews[0].description, /not currently published/);
  assert.match(
    previews[0].description,
    /No financial statements or allocation percentages/,
  );
  assert.match(previews[1].description, /not yet available/);
  assert.match(
    previews[1].description,
    /does not substitute for approved governance documents/,
  );
  assert.doesNotMatch(
    JSON.stringify(previews),
    /\.pdf|Form 990|board member|certified|rated/i,
  );
});

test("Impact Reporting uses existing public reports page rather than a new reporting system", () => {
  assert.match(html, /href="#\/reports"/);
  const publicPage = readFileSync(
    "src/foundation/pages/PublicInfoPage.jsx",
    "utf8",
  );
  assert.match(publicPage, /reports:\s*\{/);
  assert.match(
    publicPage,
    /Public information should be clear about what it knows\./,
  );
  assert.match(
    readFileSync("src/foundation/App.jsx", "utf8"),
    /\["programs", "partners", "reports"\].includes\(route\)/,
  );
});

test("desktop/tablet retain three information blocks; mobile stacks readable full-width controls", () => {
  for (const width of [1440, 1280, 768, 390]) {
    assert.equal(
      style(".shf-donation-transparency", width).background,
      "#fffdf8",
    );
    assert.equal(
      style(".shf-transparency-actions", width)["grid-template-columns"],
      width > 600 ? "repeat(3, minmax(0, 1fr))" : "1fr",
    );
    const action = style(".shf-transparency-actions > :is(button, a)", width);
    assert.ok(parseInt(action["min-height"]) >= 44);
    assert.ok(parseInt(action["font-size"]) >= 14);
    assert.ok(
      style(
        ".shf-transparency-actions > :is(button, a):focus-visible",
        width,
      ).outline.includes("3px"),
    );
    if (width === 390) {
      assert.equal(action["flex-direction"], "row");
      assert.equal(action["border-left"], "0");
    }
  }
});

test("canonical main ending still supplies exactly one closing CTA followed by the unchanged footer", () => {
  const full = renderToStaticMarkup(
    React.createElement(
      mod.exports.Layout,
      null,
      React.createElement(mod.exports.Donation),
    ),
  );
  assert.equal(
    (full.match(/class="shf-donation-transparency shf-donation-shell"/g) || [])
      .length,
    1,
  );
  assert.equal((full.match(/class="shf-final-cta"/g) || []).length, 1);
  assert.equal((full.match(/<footer class="shf-footer"/g) || []).length, 1);
  assert.match(full, /<\/main><section[^>]*class="shf-final-cta"/);
  assert.match(full, /<\/section><footer class="shf-footer"/);
  assert.match(full, /Invest in People\./);
  assert.match(full, /Strengthen Communities\./);
});
