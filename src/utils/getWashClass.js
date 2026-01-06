// src/utils/getWashClass.js

/** Snap any intensity to supported steps */
function clampIntensity(i = 10) {
    return i >= 15 ? 15 : i >= 10 ? 10 : 5;
  }
  
  /**
   * Generic wash chooser.
   * @param {number} value
   * @param {{
   *   breakpoints?: { danger?: number, warn?: number, ok?: number, celebrate?: number },
   *   direction?: 'higherIsBetter'|'lowerIsBetter',
   *   intensity?: 5|10|15,
   *   defaultClass?: string
   * }} options
   */
  export function getWashClass(
    value,
    {
      breakpoints = {},
      direction = "higherIsBetter",
      intensity = 10,
      defaultClass = "wash--brand-5",
    } = {}
  ) {
    const v = Number(value);
    if (!Number.isFinite(v)) return defaultClass;
  
    const suf = String(clampIntensity(intensity));
    const { danger, warn, ok, celebrate } = breakpoints;
  
    if (direction === "higherIsBetter") {
      if (celebrate != null && v >= celebrate) return `wash--celebrate-${suf}`;
      if (ok != null && v >= ok)               return `wash--ok-${suf}`;
      if (danger != null && v <= danger)       return `wash--danger-${suf}`;
      if (warn != null && v <= warn)           return `wash--warn-${suf}`;
      return defaultClass;
    }
  
    // lowerIsBetter
    if (celebrate != null && v <= celebrate) return `wash--celebrate-${suf}`;
    if (ok != null && v <= ok)               return `wash--ok-${suf}`;
    if (danger != null && v >= danger)       return `wash--danger-${suf}`;
    if (warn != null && v >= warn)           return `wash--warn-${suf}`;
    return defaultClass;
  }
  
  /* ---------------- Convenience presets ---------------- */
  
  /**
   * Credit-like score (higher is better).
   * @param {number} score
   * @param {{ poor?: number, good?: number }} thresholds
   * @param {{ intensity?: 5|10|15, neutral?: string }} opts
   */
  export function getScoreWash(
    score,
    { poor = 580, good = 670 } = {},
    { intensity = 10, neutral = "wash--brand-5" } = {}
  ) {
    return getWashClass(score, {
      direction: "higherIsBetter",
      intensity,
      defaultClass: neutral,
      breakpoints: {
        danger: poor - 40,
        warn: poor,
        ok: good,
        celebrate: good + 50,
      },
    });
  }
  
  /**
   * Percent complete (higher is better).
   * @param {number} pct
   * @param {{ intensity?: 5|10|15, neutral?: string }} opts
   */
  export function getPercentWash(pct, { intensity = 10, neutral = "wash--brand-5" } = {}) {
    return getWashClass(pct, {
      direction: "higherIsBetter",
      intensity,
      defaultClass: neutral,
      breakpoints: { danger: 60, warn: 75, ok: 90, celebrate: 98 },
    });
  }
  
  /**
   * Metrics where lower is better (e.g., days-late, debt-to-income).
   * @param {number} v
   * @param {{ intensity?: 5|10|15, neutral?: string }} opts
   */
  export function getLowerIsBetterWash(v, { intensity = 10, neutral = "wash--brand-5" } = {}) {
    return getWashClass(v, {
      direction: "lowerIsBetter",
      intensity,
      defaultClass: neutral,
      breakpoints: { celebrate: 10, ok: 20, warn: 35, danger: 50 },
    });
  }
  