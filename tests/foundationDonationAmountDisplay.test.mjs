import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  formatDonationAmount,
  parseDonationAmount,
  prepareDonationHandoff,
} from "../src/foundation/adapters/donationHandoff.js";

test("safe handoff display preserves exact cents across the full accepted currency range", () => {
  for (const [input, expected] of [
    ["25", "$25.00"],
    ["50", "$50.00"],
    ["100", "$100.00"],
    ["250", "$250.00"],
    ["0.01", "$0.01"],
    ["42.37", "$42.37"],
    ["90071992547409.91", "$90,071,992,547,409.91"],
    ["90071992547409.90", "$90,071,992,547,409.90"],
    ["90071992547409.89", "$90,071,992,547,409.89"],
  ]) {
    const gift = prepareDonationHandoff({
      amountMinor: parseDonationAmount(input),
      currency: "USD",
      frequency: "one-time",
    });
    assert.equal(gift.status, "provider-unavailable");
    assert.equal(formatDonationAmount(gift.amountMinor), expected, input);
  }
});

test("invalid amounts cannot be formatted as a valid gift", () => {
  for (const amount of [0, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])
    assert.throws(() => formatDonationAmount(amount));
});

test("Give Now uses the exact-cent formatter for its selected amount message", () => {
  const source = readFileSync(
    "src/foundation/components/FoundationGiftSelector.jsx",
    "utf8",
  );
  assert.match(source, /formatDonationAmount\(handoff.amountMinor\)/);
  assert.doesNotMatch(source, /handoff.amountMinor\s*\/\s*100/);
});
