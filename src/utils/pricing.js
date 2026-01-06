// src/utils/pricing.js

// Canonical price table (values in CENTS)
export const PRICES = {
  free:       { monthly_cents: 0,    yearly_cents: 0 },
  starter:    { monthly_cents: 990,  yearly_cents: 9900 },   // $9.90 / $99.00
  pro:        { monthly_cents: 1990, yearly_cents: 15900 },  // $19.90 / $159.00
  team:       { monthly_cents: 4990, yearly_cents: 45900 },  // $49.90 / $459.00
  enterprise: { monthly_cents: 0,    yearly_cents: 0, contact: true },
};

// Optional coupon % discounts (0.10 = 10% off)
export const COUPONS = {
  // welcome10: 0.10,
};

// Return price in CENTS for a given sku/period.
// Supports per-seat pricing with opts.qty and simple coupons (opts.coupon).
export function priceFor(sku, period = "monthly", opts = {}) {
  if (!sku) return null;
  const id = String(sku).toLowerCase();
  const row = PRICES[id];
  if (!row) return null;

  const centsRaw =
    period === "yearly"
      ? row.yearly_cents ?? row.yearlyCents ?? row.year
      : row.monthly_cents ?? row.monthlyCents ?? row.month;

  if (!Number.isFinite(+centsRaw)) return null;
  let cents = +centsRaw;

  // per-seat
  const qty = Math.max(1, Number.isFinite(+opts.qty) ? +opts.qty : 1);
  cents *= qty;

  // coupon
  const code = (opts.coupon || opts.code || "").toLowerCase();
  if (code && COUPONS[code]) {
    cents = Math.max(0, Math.round(cents * (1 - COUPONS[code])));
  }

  return cents;
}

// Convenience formatter (USD)
export function formatUSD(cents, maxFrac = 0) {
  if (!Number.isFinite(+cents)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: maxFrac,
  }).format(cents / 100);
}

// Helpful globals for components that look on window.* (optional)
if (typeof window !== "undefined") {
  window.PRICES = PRICES;
  window.priceFor = priceFor;
}

// default export so either `import { priceFor }` or `import * as Pricing` works
export default { PRICES, COUPONS, priceFor, formatUSD };
