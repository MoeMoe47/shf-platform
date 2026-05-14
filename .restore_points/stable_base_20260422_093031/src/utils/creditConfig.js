// src/utils/creditConfig.js
export const CREDIT_CONFIG = {
  tokens: ["HEART", "CORN", "WHEAT", "ROCKET"],
  exchangeRates: { HEART: 10, CORN: 5, WHEAT: 5, ROCKET: 50 }, // → SHFc
  currency: { code: "SHFc", symbol: "" },
  decay: { halfLifeDays: 30 },
  tiers: [
    { id: "Bronze", min: 0 },
    { id: "Silver", min: 200 },
    { id: "Gold", min: 400 },
    { id: "Platinum", min: 650 },
    { id: "Rocket", min: 800 }
  ],
  market: {
    shfcPerUSD: 100, // 100 SHFc = $1
    tierDiscounts: { Bronze: 0, Silver: 0.05, Gold: 0.1, Platinum: 0.15, Rocket: 0.25 }
  },
  weights: {} // you can override per-action later
};
