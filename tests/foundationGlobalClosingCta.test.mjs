import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const root = process.cwd();
const compiled = await build({
  stdin: {
    contents:
      "export {default} from './src/foundation/layout/FoundationLayout.jsx';",
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
const module = new Module(`${root}/.foundation-global-cta-render.cjs`);
module.filename = `${root}/.foundation-global-cta-render.cjs`;
module.paths = require.resolve.paths("react");
module._compile(compiled.outputFiles[0].text, module.filename);
const html = renderToStaticMarkup(
  React.createElement(
    module.exports.default,
    null,
    React.createElement("h1", null, "Preserved page body"),
  ),
);

test("every shared Foundation shell ends with one canonical CTA and one footer", () => {
  assert.equal((html.match(/class="shf-final-cta"/g) || []).length, 1);
  assert.equal((html.match(/<footer class="shf-footer"/g) || []).length, 1);
  assert.match(
    html,
    /<main class="shf-main"><h1>Preserved page body<\/h1><\/main><section[^>]*class="shf-final-cta"/,
  );
  assert.match(html, /<\/section><footer class="shf-footer"/);
  assert.match(html, /Invest in People\./);
  assert.match(html, /Strengthen Communities\./);
  assert.match(html, /href="#\/get-involved"[^>]*>Support SHF/);
  assert.match(html, /href="#\/partners"[^>]*>Partner With Us/);
  assert.match(html, /shf-official-logo.webp/);
});

test("pages do not duplicate the shared closing component and its artwork is retained", () => {
  for (const page of [
    "Home",
    "PublicInfoPage",
    "CountyDetail",
  ]) {
    assert.doesNotMatch(
      readFileSync(`src/foundation/pages/${page}.jsx`, "utf8"),
      /<FoundationClosingCta/,
    );
  }
  const cta = readFileSync(
    "src/foundation/components/FoundationClosingCta.jsx",
    "utf8",
  );
  assert.match(cta, /@\/assets\/brand\/shf-footer-landscape-light.webp/);
  assert.match(cta, /<SHFSlogan/);
  assert.match(cta, /tone="light"/);
  assert.match(cta, /variant="editorial"/);
});
