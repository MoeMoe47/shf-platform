/** Parse USD exactly in cents; never round an unsupported fractional cent. */
export function parseDonationAmount(value) {
  const input = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(input)) return null;
  const [dollars, fraction = ""] = input.split(".");
  const amountMinor = Number(dollars) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(amountMinor) && amountMinor > 0
    ? amountMinor
    : null;
}

/** Format a validated USD amount for the handoff display. */
export function formatDonationAmount(amountMinor) {
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
    throw new Error("A positive USD amount in cents is required.");
  }
  // Keep the cents integer intact rather than dividing into a floating dollar value.
  const amount = BigInt(amountMinor);
  const fraction = String(amount % 100n).padStart(2, "0");
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
    .formatToParts(amount / 100n)
    .map((part) => (part.type === "fraction" ? fraction : part.value))
    .join("");
}

/**
 * Safe boundary for a future approved hosted-checkout adapter.
 * No network requests, persistence, donor details or payment simulation.
 * @param {{amountMinor: number, currency: "USD", frequency: "one-time"}} gift
 */
export function prepareDonationHandoff(gift) {
  if (
    !Number.isSafeInteger(gift.amountMinor) ||
    gift.amountMinor <= 0 ||
    gift.currency !== "USD" ||
    gift.frequency !== "one-time"
  ) {
    throw new Error("A positive one-time USD gift is required.");
  }
  return { status: "provider-unavailable", ...gift };
}
