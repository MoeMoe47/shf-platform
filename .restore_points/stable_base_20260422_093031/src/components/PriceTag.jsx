// src/components/PriceTag.jsx
import React from "react";
// Use a RELATIVE import to avoid any alias/path issues.
import { priceFor, PRICES } from "../utils/pricing.js";

const fmtUSD0 = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

// Allow callers to pass price directly (cents or dollars)
function coerceCentsFromProps(props = {}) {
  const direct =
    props.cents ??
    props.priceCents ??
    props.amountCents ??
    (Number.isFinite(+props.price) ? Math.round(+props.price * 100) : undefined) ??
    (Number.isFinite(+props.amount) ? Math.round(+props.amount * 100) : undefined);

  return Number.isFinite(+direct) ? +direct : null;
}

export default function PriceTag({
  sku,                 // e.g. "pro", "starter"
  period = "monthly",  // "monthly" | "yearly"
  className = "",
  per = period,
  ...rest
}) {
  // 1) Prefer explicit price passed via props
  let cents = coerceCentsFromProps(rest);

  // 2) Ask the pricing helper
  if (!Number.isFinite(cents) && typeof priceFor === "function") {
    const v = priceFor(String(sku || "").toLowerCase(), period);
    if (Number.isFinite(+v)) cents = +v;
  }

  // 3) Fallback to PRICES map if needed
  if (!Number.isFinite(cents) && PRICES) {
    const row = PRICES[sku] ?? PRICES[String(sku || "").toLowerCase()];
    if (row) {
      const raw =
        period === "yearly"
          ? row.yearly_cents ?? row.yearlyCents ?? row.year
          : row.monthly_cents ?? row.monthlyCents ?? row.month;
      if (Number.isFinite(+raw)) cents = +raw;
    }
  }

  // If still unknown, render a harmless placeholder (don’t crash the app)
  if (!Number.isFinite(cents)) {
    return (
      <span className={`price-tag ${className}`} title="Price unavailable">
        —
        <style>{`
          .price-tag{font-weight:800}
          .price-tag .per{opacity:.7;font-weight:600;margin-left:2px}
        `}</style>
      </span>
    );
  }

  // Heuristic: if cents is big enough, treat as cents; otherwise assume dollars passed
  const dollars = cents >= 50 ? cents / 100 : cents;

  return (
    <span className={`price-tag ${className}`}>
      {fmtUSD0.format(dollars)}
      <span className="per"> / {per === "yearly" ? "yr" : "mo"}</span>
      <style>{`
        .price-tag{font-weight:800}
        .price-tag .per{opacity:.7;font-weight:600;margin-left:2px}
      `}</style>
    </span>
  );
}
