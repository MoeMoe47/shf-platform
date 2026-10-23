import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  parseDonationAmount,
  prepareDonationHandoff,
} from "../src/foundation/adapters/donationHandoff.js";

const require = createRequire(import.meta.url);
const compiled = await build({
  stdin: {
    contents: "export {default} from './src/foundation/pages/Donation.jsx';",
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
  loader: { ".css": "empty" },
  external: ["react"],
});
const module = new Module(`${process.cwd()}/.foundation-donation-render.cjs`);
module.filename = `${process.cwd()}/.foundation-donation-render.cjs`;
module.paths = require.resolve.paths("react");
module._compile(compiled.outputFiles[0].text, module.filename);
const html = renderToStaticMarkup(React.createElement(module.exports.default));

test("donation content renders with one H1, six giving cards and no duplicated shell", () => {
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /Invest in People\./);
  assert.match(html, /Build Brighter/);
  assert.match(html, /Tomorrows\./);
  assert.match(html, /Choose Your Impact\./);
  assert.equal((html.match(/class="shf-giving-card"/g) || []).length, 6);
  assert.doesNotMatch(
    html,
    /<footer|shf-institutional-header|shf-final-cta|type="password"|card.number/i,
  );
  assert.match(html, /href="#impact"[^>]*>Our Impact/);
  assert.match(html, /Financial Reports/);
  assert.match(html, /Governance Overview/);
});

test("USD parsing rejects invalid gifts and preserves exact cents", () => {
  for (const invalid of [
    "",
    "0",
    "0.00",
    "-1",
    "NaN",
    "Infinity",
    "1e3",
    "1.001",
    "12abc",
    "1,000",
    "9007199254740992",
    ".",
    "  ",
  ])
    assert.equal(parseDonationAmount(invalid), null, invalid);
  for (const [amount, cents] of [
    ["25", 2500],
    ["50", 5000],
    ["100", 10000],
    ["250", 25000],
    ["0.01", 1],
    ["37.42", 3742],
    ["1.1", 110],
  ])
    assert.equal(parseDonationAmount(amount), cents);
});

test("handoff explicitly remains unavailable and never creates payment success", () => {
  assert.deepEqual(
    prepareDonationHandoff({
      amountMinor: 2500,
      currency: "USD",
      frequency: "one-time",
    }),
    {
      status: "provider-unavailable",
      amountMinor: 2500,
      currency: "USD",
      frequency: "one-time",
    },
  );
  for (const amountMinor of [0, -1, 1.1, NaN, Infinity])
    assert.throws(() =>
      prepareDonationHandoff({
        amountMinor,
        currency: "USD",
        frequency: "one-time",
      }),
    );
  assert.throws(() =>
    prepareDonationHandoff({
      amountMinor: 100,
      currency: "EUR",
      frequency: "one-time",
    }),
  );
  assert.throws(() =>
    prepareDonationHandoff({
      amountMinor: 100,
      currency: "USD",
      frequency: "monthly",
    }),
  );
});

test("all nine slots use the exact approved WebP assets and meaningful alternatives", () => {
  const filenames = [
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
  const images = [...html.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]);
  assert.equal(images.length, 9);
  assert.equal(
    (html.match(/data-photo-status="owner-approved"/g) || []).length,
    9,
  );
  assert.doesNotMatch(
    html,
    /awaiting-approved-asset|Downloads|building-futures-by-the-river|data-center-community-impact/,
  );
  const manifest = JSON.parse(
    readFileSync(
      "docs/ui/foundation-donation/approved-image-manifest.json",
      "utf8",
    ),
  );
  assert.equal(manifest.length, 9);
  for (const [index, filename] of filenames.entries()) {
    const path = `/assets/foundation/donation/${filename}`;
    assert.ok(images[index].includes(`src="${path}"`), filename);
    assert.match(images[index], /alt="[^" ]+[^"<]+"/);
    const data = readFileSync(`public${path}`);
    assert.equal(data.toString("ascii", 0, 4), "RIFF");
    assert.equal(data.toString("ascii", 8, 12), "WEBP");
    assert.equal(manifest[index].installed, path);
    assert.equal(
      createHash("sha256").update(data).digest("hex"),
      manifest[index].installed_sha256,
    );
  }
  assert.match(html, /class="shf-donation-sr-only">REAL/);
  const css = readFileSync(
    "src/foundation/styles/foundation-donation.css",
    "utf8",
  );
  assert.doesNotMatch(
    css,
    /url\s*\(/i,
    "No unapproved fallback background photography",
  );
});
