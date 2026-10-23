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
      "export {default} from './src/foundation/components/FoundationGiftImpact.jsx'",
    resolveDir: root,
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
  external: ["react"],
});
const mod = new Module(`${root}/.gift-impact-test.cjs`);
mod.filename = `${root}/.gift-impact-test.cjs`;
mod.paths = require.resolve.paths("react");
mod._compile(compiled.outputFiles[0].text, mod.filename);
const html = renderToStaticMarkup(React.createElement(mod.exports.default));
const css = postcss.parse(
  readFileSync("src/foundation/styles/foundation-donation.css", "utf8"),
);
function styles(selector, width = 1440) {
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

test("semantic section retains exact approved copy and six broad support categories", () => {
  assert.match(
    html,
    /<section id="where-it-goes"[^>]*aria-labelledby="gift-impact-title"/,
  );
  assert.equal((html.match(/<h2\b/g) || []).length, 1);
  assert.doesNotMatch(html, /<h1\b/);
  assert.match(html, /WHERE YOUR GIFT GOES/);
  assert.match(html, /Focused on Lasting Impact\./);
  assert.match(
    html,
    /Your support helps fund programs, resources, and community initiatives that create real education and workforce opportunities\./,
  );
  assert.match(html, /aria-label="Impact and support categories"/);
  assert.deepEqual(
    [...html.matchAll(/<li>(.*?)<\/li>/g)].map((m) =>
      m[1].replaceAll("&amp;", "&"),
    ),
    [
      "Education & Youth Programs",
      "Workforce Development",
      "Technology & Innovation",
      "Inclusive Learning",
      "Community Initiatives",
      "Program Support & Operations",
    ],
  );
  assert.doesNotMatch(
    html,
    /%|restricted fund|earmarked|guaranteed|allocation ratio/i,
  );
});

test("approved banner is unchanged with alt containing slogans and no visible duplicate overlay", () => {
  assert.equal((html.match(/<img\b/g) || []).length, 1);
  assert.match(
    html,
    /src="\/assets\/foundation\/donation\/donation-impact-banner.webp"/,
  );
  assert.match(
    html,
    /alt="Four young people overlooking a sunset city skyline. Real skills. Real people. Real impact. Opportunity changes lives."/,
  );
  assert.match(html, /class="shf-donation-sr-only">REAL/);
  assert.doesNotMatch(html, /class="shf-donation-handwritten"/);
  const hidden = styles(".shf-donation-sr-only");
  assert.equal(hidden.position, "absolute");
  assert.equal(hidden.width, "1px");
  assert.equal(hidden.height, "1px");
  assert.equal(hidden["clip-path"], "inset(50%)");
  assert.equal(hidden.overflow, "hidden");
  const manifest = JSON.parse(
    readFileSync(
      "docs/ui/foundation-donation/approved-image-manifest.json",
      "utf8",
    ),
  ).find((r) => r.slot === "gift-impact");
  assert.deepEqual(manifest.dimensions, [2007, 783]);
  assert.equal(
    createHash("sha256")
      .update(
        readFileSync(
          "public/assets/foundation/donation/donation-impact-banner.webp",
        ),
      )
      .digest("hex"),
    manifest.installed_sha256,
  );
});

test("Our Impact is the existing homepage impact destination and boundaries stay adjacent", () => {
  assert.match(
    html,
    /<a class="shf-donation-outline" href="#impact">Our Impact/,
  );
  assert.match(
    readFileSync("src/foundation/pages/Home.jsx", "utf8"),
    /id="impact"/,
  );
  assert.match(readFileSync("src/foundation/App.jsx", "utf8"), /return "top"/);
  assert.match(
    readFileSync("src/foundation/layout/FoundationFooter.jsx", "utf8"),
    /getElementById\("impact"\)\?\.scrollIntoView/,
  );
  assert.match(
    readFileSync("src/foundation/pages/Donation.jsx", "utf8"),
    /<FoundationWaysToGive[^>]*\/>\s*<FoundationGiftImpact\s*\/>\s*<FoundationTransparency/,
  );
  const cta = styles(".shf-gift-impact .shf-donation-outline");
  assert.ok(parseInt(cta["min-height"]) >= 44);
  assert.ok(
    styles(
      ".shf-gift-impact .shf-donation-outline:focus-visible",
    ).outline.includes("3px"),
  );
});

test("responsive navy band preserves source aspect ratio with desktop thirds, tablet wrap and mobile order", () => {
  for (const width of [1440, 1280, 768, 390]) {
    const band = styles(".shf-gift-impact", width);
    assert.equal(band.display, "grid");
    assert.equal(band.background, "#031a26");
    assert.equal(band.color, "white");
    assert.equal(
      styles(".shf-gift-impact__visual", width)["aspect-ratio"],
      "2007 / 783",
    );
    assert.equal(
      styles(".shf-gift-impact__visual .shf-gift-impact__image", width)[
        "object-fit"
      ],
      "cover",
    );
    assert.equal(
      styles(".shf-gift-impact__visual .shf-gift-impact__image", width).filter,
      "none",
    );
    if (width > 1100)
      assert.equal(
        band["grid-template-columns"],
        "minmax(0, 38fr) minmax(0, 38fr) minmax(0, 24fr)",
      );
    else if (width > 600) {
      assert.equal(
        band["grid-template-columns"],
        "minmax(0, 1fr) minmax(0, 1fr)",
      );
      assert.equal(
        styles(".shf-gift-impact__visual", width)["grid-column"],
        "1 / -1",
      );
    } else assert.equal(band["grid-template-columns"], "1fr");
  }
});
