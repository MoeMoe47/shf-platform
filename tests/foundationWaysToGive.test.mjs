import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
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
      "export {default} from './src/foundation/components/FoundationWaysToGive.jsx'",
    resolveDir: root,
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
  external: ["react"],
});
const mod = new Module(`${root}/.ways-test.cjs`);
mod.filename = `${root}/.ways-test.cjs`;
mod.paths = require.resolve.paths("react");
mod._compile(compiled.outputFiles[0].text, mod.filename);
const Ways = mod.exports.default;
function find(node, predicate) {
  const result = [];
  function visit(value) {
    for (const child of React.Children.toArray(value)) {
      if (!React.isValidElement(child)) continue;
      if (predicate(child)) result.push(child);
      visit(child.props.children);
    }
  }
  visit(node);
  return result;
}
const calls = [];
const tree = Ways({ onPreview: (content) => calls.push(content) });
const articles = find(tree, (node) => node.type === "article");
const titles = [
  "One-Time Gift",
  "Monthly Giving",
  "Corporate Support",
  "Grants & Foundations",
  "Employer Partnerships",
  "Planned Giving",
];
const slugs = [
  "one-time-gift",
  "monthly-giving",
  "corporate-support",
  "grants-foundations",
  "employer-partnerships",
  "planned-giving",
];
const descriptions = [
  "Make an immediate difference.",
  "Provide ongoing support.",
  "Partner with us to expand opportunity.",
  "Support larger initiatives.",
  "Invest in workforce development.",
  "Leave a lasting legacy.",
];
function action(article) {
  return find(article, (n) => n.type === "button" || n.type === "a")[0];
}

test("six semantic cards retain exact copy/order, labelled native actions and six approved images", () => {
  assert.equal(articles.length, 6);
  const manifest = JSON.parse(
    readFileSync(
      "docs/ui/foundation-donation/approved-image-manifest.json",
      "utf8",
    ),
  );
  for (const [index, article] of articles.entries()) {
    const title = find(article, (n) => n.type === "h3")[0];
    const description = find(article, (n) => n.type === "p")[0];
    const control = action(article);
    assert.equal(title.props.children, titles[index]);
    assert.equal(description.props.children, descriptions[index]);
    assert.equal(article.props["aria-labelledby"], title.props.id);
    assert.equal(control.props["aria-labelledby"], title.props.id);
    assert.equal(control.props["aria-describedby"], description.props.id);
    const image = find(article, (n) => n.type === "img")[0];
    const path = `/assets/foundation/donation/donation-${slugs[index]}.webp`;
    assert.equal(image.props.src, path);
    assert.ok(image.props.alt.length > 15);
    const data = readFileSync(`public${path}`);
    assert.equal(
      createHash("sha256").update(data).digest("hex"),
      manifest.find((row) => row.installed === path).installed_sha256,
    );
    assert.equal(
      find(control, (n) => n.props.className === "shf-giving-arrow")[0].props[
        "aria-hidden"
      ],
      "true",
    );
  }
  const html = renderToStaticMarkup(
    React.createElement(Ways, { onPreview: () => {} }),
  );
  assert.match(html, /aria-labelledby="ways-title"/);
  assert.match(html, /More Ways to Make an Impact\./);
  assert.match(
    html,
    /There are many ways to support the mission of Silicon Heartland Foundation\./,
  );
});

test("three information actions invoke truthful existing previews and partnership actions use canonical route", () => {
  calls.length = 0;
  for (const index of [1, 3, 5]) action(articles[index]).props.onClick();
  assert.deepEqual(
    calls.map((c) => c.title),
    ["Monthly Giving", "Grants & Foundations", "Planned Giving"],
  );
  assert.match(calls[0].description, /Recurring giving is not available yet/);
  assert.match(calls[0].description, /approved provider/);
  assert.match(calls[1].description, /not yet published/);
  assert.match(
    calls[2].description,
    /No legal, tax or gift-acceptance guidance/,
  );
  for (const index of [2, 4]) {
    assert.equal(action(articles[index]).type, "a");
    assert.equal(action(articles[index]).props.href, "#/partners");
  }
  assert.match(
    readFileSync("src/foundation/pages/PublicInfoPage.jsx", "utf8"),
    /partners:\s*\{/,
  );
});

test("One-Time Gift focuses existing input and scrolls with sticky clearance and reduced-motion preference", () => {
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;
  try {
    for (const reduced of [false, true]) {
      const events = [];
      globalThis.document = {
        getElementById: (id) =>
          id === "make-a-gift"
            ? { getBoundingClientRect: () => ({ top: 500 }) }
            : id === "shf-custom-amount"
              ? { focus: (options) => events.push(["focus", options]) }
              : null,
        querySelector: () => ({
          getBoundingClientRect: () => ({ height: 144 }),
        }),
      };
      globalThis.window = {
        scrollY: 300,
        matchMedia: () => ({ matches: reduced }),
        scrollTo: (options) => events.push(["scroll", options]),
      };
      action(articles[0]).props.onClick();
      assert.deepEqual(events, [
        ["focus", { preventScroll: true }],
        ["scroll", { top: 640, behavior: reduced ? "instant" : "smooth" }],
      ]);
    }
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test("responsive source uses 3/2/1 columns, consistent large images and a 44px arrow hit area", () => {
  const css = postcss.parse(
    readFileSync("src/foundation/styles/foundation-donation.css", "utf8"),
  );
  function styles(selector, width) {
    const result = {};
    css.walkRules((rule) => {
      if (rule.selector !== selector) return;
      for (let p = rule.parent; p; p = p.parent) {
        if (p.type === "atrule" && p.name === "media") {
          const max = p.params.match(/max-width:\s*(\d+)px/);
          if (max && width > Number(max[1])) return;
        }
      }
      rule.walkDecls((d) => (result[d.prop] = d.value));
    });
    return result;
  }
  for (const [width, columns] of [
    [1440, "repeat(3, minmax(0, 1fr))"],
    [1280, "repeat(3, minmax(0, 1fr))"],
    [768, "repeat(2, minmax(0, 1fr))"],
    [390, "1fr"],
  ]) {
    assert.equal(
      styles(".shf-giving-cards", width)["grid-template-columns"],
      columns,
    );
    assert.equal(
      styles(".shf-giving-card > .shf-giving-card__image", width).height,
      "220px",
    );
    assert.equal(
      styles(".shf-giving-card > .shf-giving-card__image", width)["object-fit"],
      "cover",
    );
    assert.equal(styles(".shf-giving-action", width).width, "44px");
    assert.equal(styles(".shf-giving-action", width).height, "44px");
  }
});
