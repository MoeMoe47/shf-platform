// src/utils/wash.js
export const wash = {
    good: "wash wash--good",
    warn: "wash wash--warn",
    bad:  "wash wash--bad",
    info: "wash wash--info",
  };
  
  export function washLowerIsBetter(value, bands = { good: 10, warn: 30 }) {
    if (value < bands.good) return wash.good;
    if (value < bands.warn) return wash.warn;
    return wash.bad;
  }
  
  export function washHigherIsBetter(value, bands = { good: 99, warn: 95 }) {
    if (value >= bands.good) return wash.good;
    if (value >= bands.warn) return wash.warn;
    return wash.bad;
  }
  
  export function washScore(score, bands = { good: 740, warn: 670 }) {
    if (score >= bands.good) return wash.good;
    if (score >= bands.warn) return wash.warn;
    return wash.bad;
  }
  