// src/utils/creditMath.js
// One canonical compatibility module used across the app.
// Exports: usd, rateTable, toSHF, computeScore, tierForScore, marketBreakdown

import { CREDIT_CONFIG as CFG } from "@/utils/creditConfig.js";

/* ---------- Currency helpers ---------- */
const usdFmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
export const usd = (n = 0) => usdFmt.format(Number(n) || 0);

// Ecosystem currency: SHFc ↔ USD (prefer config; fallback to $0.01 / SHFc)
const USD_PER_SHFC = Number((CFG && (CFG.usdPerSHFc || CFG.usd_per_shfc)) ?? 0.01);

// Token → SHFc exchange (fallbacks if config missing)
const TOKEN_TO_SHFC =
  (CFG && (CFG.exchangeRates || CFG.tokenExchange || CFG.tokens)) || {
    HEART: 50,
    CORN: 5,
    WHEAT: 5,
    ROCKET: 200,
  };

export const rateTable = {
  usdPerSHFc: USD_PER_SHFC,
  shfcPerUSD: USD_PER_SHFC > 0 ? 1 / USD_PER_SHFC : 0,
  tokens: TOKEN_TO_SHFC,
};

export function toSHF(usdAmount = 0) {
  const u = Number(usdAmount) || 0;
  return Math.max(0, Math.ceil(u / (rateTable.usdPerSHFc || 0.01)));
}

/* ---------- Tier mapping ---------- */
export function tierForScore(score = 300) {
  if (score >= 780) return { name: "Platinum", band: "A+" };
  if (score >= 740) return { name: "Gold",     band: "A"  };
  if (score >= 700) return { name: "Silver",   band: "B"  };
  if (score >= 660) return { name: "Bronze",   band: "C"  };
  return { name: "Foundation", band: "D" };
}

/* ---------- Score math ---------- */
// Map arbitrary "points" → 300–850 using a smooth S-curve.
function pointsToScore(points = 0) {
  const min = 300, max = 850;
  const k = 0.0045; // growth rate for diminishing returns
  const s = 1 / (1 + Math.exp(-k * (points - 400)));
  return Math.round(min + (max - min) * s);
}

/**
 * computeScore(events)
 * Accepts an array of ledger-like entries (credits | scoreDelta)
 * Returns { score, points }
 */
export function computeScore(events = []) {
  let points = 0;
  for (const e of events) {
    if (!e) continue;
    if (Number.isFinite(e.credits))        points += Number(e.credits);
    else if (Number.isFinite(e.scoreDelta)) points += Number(e.scoreDelta);
  }
  const score = pointsToScore(points);
  return { score, points };
}

/* ---------- Pricing helper ---------- */
/**
 * marketBreakdown({ usd, shfcBalance, tier })
 * Returns suggested split between tier discount and SHFc.
 */
export function marketBreakdown({ usd = 0, shfcBalance = 0, tier = { band: "D" } }) {
  const DISCOUNT = { "A+": 0.20, "A": 0.15, "B": 0.08, "C": 0.03, "D": 0.00 };
  const discRate = DISCOUNT[tier?.band] ?? 0;
  const tierDiscountUSD = +(usd * discRate).toFixed(2);

  const remainingUSD = Math.max(0, usd - tierDiscountUSD);
  const per = rateTable.usdPerSHFc || 0.01;

  const maxCoverableUSD = shfcBalance * per;
  const spendUSD = Math.min(remainingUSD, maxCoverableUSD);
  const spendSHFc = Math.floor(spendUSD / per);

  const neededSHFc = Math.ceil(remainingUSD / per);

  return { tierDiscountUSD, spendSHFc, neededSHFc, per };
}
