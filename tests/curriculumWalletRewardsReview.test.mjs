import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const dashboard = fs.readFileSync(new URL("../src/pages/curriculum/CurriculumDashboard.jsx", import.meta.url), "utf8");
const card = fs.readFileSync(new URL("../src/pages/curriculum/sections/WalletRewardsCard.jsx", import.meta.url), "utf8");
const provider = fs.readFileSync(new URL("../src/shared/credit/CreditProvider.jsx", import.meta.url), "utf8");

test("Wallet & Rewards is mounted on the curriculum dashboard", () => {
  assert.match(dashboard, /WalletRewardsCard/);
  assert.match(card, /Wallet &amp; Rewards/);
});

test("the dashboard displays isolated fallback balances", () => {
  assert.match(card, /FALLBACK_WALLET = \{ shf: 240, corn: 120, wheat: 75 \}/);
  assert.match(card, /SHF credits/);
  assert.match(card, />Corn</);
  assert.match(card, />Wheat</);
  assert.doesNotMatch(card, /curriculum\.lesson\.completion_count\.v1/);
});

test("the dashboard has no authoritative wallet persistence or financial ledger", () => {
  assert.match(card, /useCreditCtx/);
  assert.doesNotMatch(card, /convert\(/);
  assert.match(provider, /shf:credit:events/);
  assert.match(provider, /localStorage\.setItem/);
  assert.match(provider, /fetch\("\/api\/credit\/events"/);
  assert.doesNotMatch(provider, /balances:/);
});

test("wallet values remain separate from institutional reporting", () => {
  assert.doesNotMatch(card, /fetch\(/);
  assert.doesNotMatch(card, /reduce\(/);
  assert.doesNotMatch(card, /metric|Truth|Evidence|Reporting Service/);
});
