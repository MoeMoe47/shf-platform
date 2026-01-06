// src/utils/scoreBands.us.js
// Publicly known U.S. credit band ranges (FICO-like). UI-only; not a FICO score.
export const US_CREDIT_BANDS = [
    { min: 800, max: 850, label: "Excellent", tier: "excellent", wash: "wash wash--excellent" },
    { min: 740, max: 799, label: "Very Good", tier: "very-good", wash: "wash wash--good" },
    { min: 670, max: 739, label: "Good",      tier: "good",      wash: "wash wash--info" },
    { min: 580, max: 669, label: "Fair",      tier: "fair",      wash: "wash wash--warn" },
    { min: 300, max: 579, label: "Poor",      tier: "poor",      wash: "wash wash--bad" },
  ];
  
  export function classifyScore(score) {
    const n = Number(score ?? 0);
    const band = US_CREDIT_BANDS.find(b => n >= b.min && n <= b.max) ?? US_CREDIT_BANDS[US_CREDIT_BANDS.length - 1];
    return { ...band, score: n };
  }
  