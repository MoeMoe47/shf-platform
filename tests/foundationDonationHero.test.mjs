import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
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
      "export {default} from './src/foundation/components/FoundationDonationHero.jsx'",
    resolveDir: root,
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
  external: ["react"],
});
const mod = new Module(`${root}/.donation-hero-test.cjs`);
mod.filename = `${root}/.donation-hero-test.cjs`;
mod.paths = require.resolve.paths("react");
mod._compile(compiled.outputFiles[0].text, mod.filename);
const html = renderToStaticMarkup(React.createElement(mod.exports.default));
const css = postcss.parse(
  readFileSync("src/foundation/styles/foundation-donation.css", "utf8"),
);
function style(selector, width) {
  const result = {};
  css.walkRules((rule) => {
    if (!rule.selectors.includes(selector)) return;
    let parent = rule.parent;
    while (parent) {
      if (parent.type === "atrule" && parent.name === "media") {
        const min = parent.params.match(/min-width:\s*(\d+)px/);
        const max = parent.params.match(/max-width:\s*(\d+)px/);
        if ((min && width < Number(min[1])) || (max && width > Number(max[1])))
          return;
      }
      parent = parent.parent;
    }
    rule.walkDecls((decl) => {
      result[decl.prop] = decl.value;
    });
  });
  return result;
}

test("Hero keeps approved HTML copy, three headline lines and accessible handwritten text", () => {
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(
    html,
    /<h1 id="donation-title">Invest in People\.<br\/>Build Brighter<br\/>Tomorrows\.<\/h1>/,
  );
  assert.match(html, /SUPPORT SHF/);
  assert.match(
    html,
    /Your support helps expand education, workforce development, technology, and career opportunity for individuals and communities across Ohio and the Midwest\./,
  );
  assert.match(html, /OPPORTUNITY<br\/>CHANGES<br\/>LIVES\./);
  assert.doesNotMatch(html, /aria-hidden|<button|<a\s/);
});

test("Hero loads exactly the approved original image mapping and its immutable asset", () => {
  assert.equal((html.match(/<img\b/g) || []).length, 1);
  assert.match(
    html,
    /src="\/assets\/foundation\/donation\/donation-hero.webp"/,
  );
  assert.match(html, /alt="Student looking toward a city skyline at sunset"/);
  assert.match(html, /fetchPriority="high"/);
  const manifest = JSON.parse(
    readFileSync(
      "docs/ui/foundation-donation/approved-image-manifest.json",
      "utf8",
    ),
  )[0];
  const image = readFileSync(
    "public/assets/foundation/donation/donation-hero.webp",
  );
  assert.equal(
    createHash("sha256").update(image).digest("hex"),
    manifest.installed_sha256,
  );
  assert.deepEqual(manifest.dimensions, [1672, 941]);
});

test("requested responsive widths keep cover, intentional composition and a box-free brush slogan", () => {
  for (const width of [1440, 1280, 768, 390]) {
    assert.equal(
      style(".shf-donation-hero__image", width)["object-fit"],
      "cover",
    );
    assert.equal(
      style(".shf-donation-hero .shf-donation-handwritten", width).background,
      "transparent",
    );
    assert.equal(
      style(".shf-donation-hero .shf-donation-handwritten", width).padding,
      "0",
    );
    assert.ok(style(".shf-donation-handwritten::after", width)["clip-path"]);
    assert.equal(
      style(".shf-donation-page .shf-donation-handwritten", width)[
        "font-family"
      ],
      '"SHF Permanent Marker", cursive',
    );
    const inner = style(".shf-donation-hero__inner", width);
    if (width >= 1280) {
      assert.ok(parseInt(inner["min-height"]) >= 440);
      assert.equal(inner.display, "flex");
      assert.equal(
        style(".shf-donation-hero__image", width)["object-position"],
        "center 18%",
      );
    } else if (width === 768) {
      assert.ok(parseInt(inner["min-height"]) >= 500);
      assert.equal(
        style(".shf-donation-hero .shf-donation-handwritten", width).position,
        "absolute",
      );
    } else {
      assert.equal(inner["flex-direction"], "column");
      assert.equal(style(".shf-donation-hero__image", width).height, "380px");
      assert.ok(
        parseInt(inner["padding-block"]) >=
          parseInt(style(".shf-donation-hero__image", width).height) - 10,
      );
      assert.ok(
        parseInt(
          style(".shf-donation-hero__copy > p:last-child", width)["font-size"],
        ) >= 16,
      );
    }
  }
});

test("Hero transitions immediately to the existing donation navigation and uses the available brush font", () => {
  const page = readFileSync("src/foundation/pages/Donation.jsx", "utf8");
  assert.match(
    page,
    /<FoundationDonationHero\s*\/>\s*<FoundationDonationNav\s*\/>/,
  );
  assert.ok(
    readFileSync(
      "public/assets/fonts/permanent-marker/PermanentMarker-Regular.ttf",
    ).length > 0,
  );
  assert.equal(style(".shf-donation-hero", 1440)["margin-bottom"], undefined);
  assert.equal(
    style(".shf-donation-hero__inner", 1440)["margin-bottom"],
    undefined,
  );
});
