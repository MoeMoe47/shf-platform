export const clamp = (v, min = 0, max = 100) =>
  Math.min(max, Math.max(min, Number(v) || 0));

export const toPercent = (v) =>
  `${Math.round((Number(v) || 0))}%`;

export const safeArray = (v) => (Array.isArray(v) ? v : []);
