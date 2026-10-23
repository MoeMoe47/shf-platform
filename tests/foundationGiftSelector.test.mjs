import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import Module, { createRequire } from "node:module";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  parseDonationAmount,
  prepareDonationHandoff,
} from "../src/foundation/adapters/donationHandoff.js";
const root = process.cwd();
const require = createRequire(import.meta.url);
const compiled = await build({
  stdin: {
    contents:
      "export {default as Gift} from './src/foundation/components/FoundationGiftSelector.jsx'; export {default as Panel} from './src/foundation/components/FoundationSupportImpactPanel.jsx'; export {default as Dialog} from './src/foundation/components/FoundationDonationDialog.jsx'",
    resolveDir: root,
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
  external: ["react"],
});
const mod = new Module(`${root}/.gift-selector-test.cjs`);
mod.filename = `${root}/.gift-selector-test.cjs`;
mod.paths = require.resolve.paths("react");
mod._compile(compiled.outputFiles[0].text, mod.filename);
const gift = renderToStaticMarkup(
  React.createElement(mod.exports.Gift, { onPreview: () => {} }),
);

test("four one-time USD presets render with qualitative descriptions and no preselection", () => {
  const buttons = [
    ...gift.matchAll(/<button[^>]*type="button"[\s\S]*?<\/button>/g),
  ].map((m) => m[0]);
  assert.equal(buttons.length, 4);
  for (const [i, [amount, description]] of [
    [25, "Supports learning resources"],
    [50, "Expands access to program opportunities"],
    [100, "Invests in workforce and career pathways"],
    [250, "Helps grow community and regional initiatives"],
  ].entries()) {
    assert.ok(buttons[i].includes(`$${amount}`));
    assert.ok(buttons[i].includes(description));
    assert.match(buttons[i], /aria-pressed="false"/);
  }
  assert.match(gift, /Choose a one-time gift amount in USD/);
  assert.match(gift, /for="shf-custom-amount">Custom Amount/);
  assert.match(gift, /inputMode="decimal"/);
  assert.match(gift, /aria-describedby="shf-gift-context"/);
  assert.match(gift, /type="submit">Give Now/);
});

test("currency validation accepts positive exact cents and rejects invalid values", () => {
  for (const input of [
    "",
    "0",
    "0.00",
    "-25",
    "abc",
    "12.345",
    "1e2",
    "NaN",
    "Infinity",
    "12 USD",
    "9007199254740992",
  ])
    assert.equal(parseDonationAmount(input), null, input);
  for (const [input, cents] of [
    ["25", 2500],
    ["50", 5000],
    ["100", 10000],
    ["250", 25000],
    ["42.37", 4237],
    ["0.01", 1],
    ["001.20", 120],
  ]) {
    assert.equal(parseDonationAmount(input), cents);
  }
});

test("selector source preserves exclusive preset/custom state, associated validation and Give Now return focus", () => {
  const source = readFileSync(
    "src/foundation/components/FoundationGiftSelector.jsx",
    "utf8",
  );
  assert.match(source, /useState\(""\)/);
  assert.match(source, /useState\(null\)/);
  assert.match(source, /setPreset\(value\);\s*setAmount\(String\(value\)\)/);
  assert.match(source, /setAmount\(event.target.value\);\s*setPreset\(null\)/);
  assert.match(source, /role="alert" id="shf-gift-error"/);
  assert.match(source, /shf-gift-context shf-gift-error/);
  assert.ok(
    source.indexOf("giveNow.current?.focus()") < source.indexOf("onPreview({"),
  );
  assert.match(source, /ref=\{giveNow\}/);
});

test("handoff stays provider-unavailable and shared dialog retains native modal focus lifecycle", () => {
  assert.equal(
    prepareDonationHandoff({
      amountMinor: 4237,
      currency: "USD",
      frequency: "one-time",
    }).status,
    "provider-unavailable",
  );
  const source = readFileSync(
    "src/foundation/components/FoundationGiftSelector.jsx",
    "utf8",
  );
  assert.match(
    source,
    /No payment has been taken and your amount has not been saved/,
  );
  assert.match(source, /approved secure payment provider must be connected/);
  assert.doesNotMatch(source, /fetch\(|localStorage|transactionId|cardNumber/);
  const dialog = renderToStaticMarkup(
    React.createElement(mod.exports.Dialog, {
      content: {
        title: "Your next step: secure giving",
        description: "Selected amount: $42.37",
      },
      onClose: () => {},
    }),
  );
  assert.match(dialog, /<dialog/);
  assert.match(dialog, /aria-labelledby="donation-dialog-title"/);
  assert.match(dialog, /aria-describedby="donation-dialog-description"/);
  assert.match(dialog, /Close and return/);
  const dialogSource = readFileSync(
    "src/foundation/components/FoundationDonationDialog.jsx",
    "utf8",
  );
  assert.match(dialogSource, /dialog.showModal\(\)/);
  assert.match(dialogSource, /onCancel=\{onClose\}/);
  assert.match(dialogSource, /previous.focus\(\)/);
});

test("support panel retains the exact approved photograph and four qualitative impact areas", () => {
  const panel = renderToStaticMarkup(React.createElement(mod.exports.Panel));
  assert.match(panel, /YOUR SUPPORT HELPS/);
  for (const text of [
    "Expand access to education and technology",
    "Create real workforce and career opportunities",
    "Support inclusive programs for all learners",
    "Strengthen Ohio and Midwest communities",
  ])
    assert.ok(panel.includes(text));
  assert.equal((panel.match(/<li>/g) || []).length, 4);
  assert.match(
    panel,
    /src="\/assets\/foundation\/donation\/donation-impact-support.webp"/,
  );
  const manifest = JSON.parse(
    readFileSync(
      "docs/ui/foundation-donation/approved-image-manifest.json",
      "utf8",
    ),
  );
  const image = readFileSync(
    "public/assets/foundation/donation/donation-impact-support.webp",
  );
  assert.equal(
    createHash("sha256").update(image).digest("hex"),
    manifest.find((r) => r.slot === "support-impact").installed_sha256,
  );
});
