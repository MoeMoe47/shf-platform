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
      "export {default as Closing} from './src/foundation/components/FoundationClosingCta.jsx'; export {default as Layout} from './src/foundation/layout/FoundationLayout.jsx'; export {default as Donation} from './src/foundation/pages/Donation.jsx'",
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
const mod = new Module(`${root}/.donation-closing-test.cjs`);
mod.filename = `${root}/.donation-closing-test.cjs`;
mod.paths = require.resolve.paths("react");
mod._compile(compiled.outputFiles[0].text, mod.filename);
const Closing = mod.exports.Closing;
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
const support = (baseHref = "") =>
  find(
    Closing({ baseHref }),
    (node) => typeof node.props.onClick === "function",
  )[0];

test("Donation uses exactly one shared canonical ending immediately before the shared footer", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      mod.exports.Layout,
      null,
      React.createElement(mod.exports.Donation),
    ),
  );
  assert.equal((html.match(/class="shf-final-cta"/g) || []).length, 1);
  assert.equal((html.match(/<footer class="shf-footer"/g) || []).length, 1);
  assert.match(html, /<\/main><section[^>]*class="shf-final-cta"/);
  assert.match(html, /<\/section><footer class="shf-footer"/);
  assert.doesNotMatch(
    readFileSync("src/foundation/pages/Donation.jsx", "utf8"),
    /FoundationClosingCta|shf-final-cta/,
  );
});

test("canonical heading/copy/artwork and both native destinations are preserved", () => {
  const html = renderToStaticMarkup(React.createElement(Closing));
  assert.match(html, /aria-label="Support the Silicon Heartland Foundation"/);
  assert.match(html, /<h2[^>]*shf-slogan/);
  assert.match(html, /Invest in People\./);
  assert.match(html, /Strengthen Communities\./);
  assert.match(
    html,
    /Support education, opportunity and community development across the Midwest. Together, we can create lasting impact\./,
  );
  assert.match(html, /href="#\/get-involved"[^>]*>Support SHF/);
  assert.match(html, /href="#\/partners"[^>]*>Partner With Us/);
  assert.match(html, /--shf-footer-image:/);
  assert.doesNotMatch(html, /<img\b/);
  assert.ok(
    readFileSync("src/assets/brand/shf-footer-landscape-light.webp").length > 0,
  );
  const source = readFileSync(
    "src/foundation/components/FoundationClosingCta.jsx",
    "utf8",
  );
  assert.match(source, /@\/assets\/brand\/shf-footer-landscape-light.webp/);
  const slogans = readFileSync(
    "src/foundation/styles/foundation-slogans.css",
    "utf8",
  );
  assert.match(slogans, /text-transform: uppercase/);
  assert.match(slogans, /stroke: #ff4f00/);
  assert.match(slogans, /SHF Permanent Marker/);
  const css = readFileSync(
    "src/foundation/styles/foundation-closing-cta.css",
    "utf8",
  );
  assert.match(css, /outline: 3px solid #fdfcf8/);
  assert.match(css, /max-width: 768px/);
});

test("Support SHF focuses existing Make a Gift on this route, accounting for header and reduced motion", () => {
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  try {
    for (const reduced of [false, true])
      for (const hash of [
        "#/get-involved",
        "#/get-involved?source=closing",
        "#/get-involved/",
      ]) {
        const calls = [];
        globalThis.window = {
          location: { hash },
          scrollY: 1500,
          matchMedia: () => ({ matches: reduced }),
          scrollTo: (options) => calls.push(["scroll", options]),
        };
        globalThis.document = {
          getElementById: (id) => {
            assert.equal(id, "make-a-gift");
            return {
              focus: (options) => calls.push(["focus", options]),
              getBoundingClientRect: () => ({ top: -900 }),
            };
          },
          querySelector: () => ({
            getBoundingClientRect: () => ({ height: 144 }),
          }),
        };
        support().props.onClick({
          button: 0,
          preventDefault: () => calls.push(["prevent"]),
        });
        assert.deepEqual(calls, [
          ["prevent"],
          ["focus", { preventScroll: true }],
          ["scroll", { top: 440, behavior: reduced ? "instant" : "smooth" }],
        ]);
      }
  } finally {
    if (oldWindow === undefined) delete globalThis.window;
    else globalThis.window = oldWindow;
    if (oldDocument === undefined) delete globalThis.document;
    else globalThis.document = oldDocument;
  }
});

test("other routes, modified clicks, missing targets and prefixed consumers retain canonical native links", () => {
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  const forbidden = () => {
    throw new Error("Native navigation should not be intercepted");
  };
  try {
    globalThis.window = { location: { hash: "#/about" } };
    support().props.onClick({ button: 0, preventDefault: forbidden });
    for (const extra of [
      { button: 1 },
      { metaKey: true },
      { ctrlKey: true },
      { shiftKey: true },
      { altKey: true },
      { defaultPrevented: true },
    ])
      support().props.onClick({
        button: 0,
        preventDefault: forbidden,
        ...extra,
      });
    globalThis.window = { location: { hash: "#/get-involved" } };
    globalThis.document = { getElementById: () => null };
    support().props.onClick({ button: 0, preventDefault: forbidden });
    support("/foundation.html").props.onClick({
      button: 0,
      preventDefault: forbidden,
    });
    const html = renderToStaticMarkup(
      React.createElement(Closing, { baseHref: "/foundation.html" }),
    );
    assert.match(html, /href="\/foundation.html#\/get-involved"/);
    assert.match(html, /href="\/foundation.html#\/partners"/);
    assert.match(
      readFileSync("src/foundation/pages/PublicInfoPage.jsx", "utf8"),
      /partners:\s*\{/,
    );
  } finally {
    if (oldWindow === undefined) delete globalThis.window;
    else globalThis.window = oldWindow;
    if (oldDocument === undefined) delete globalThis.document;
    else globalThis.document = oldDocument;
  }
});
