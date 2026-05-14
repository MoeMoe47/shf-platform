const GKEY = "sales:goals";
export function loadGoals() {
  try { return JSON.parse(localStorage.getItem(GKEY) || "{}"); } catch { return {}; }
}
export function saveGoals(g) {
  try { localStorage.setItem(GKEY, JSON.stringify(g)); } catch {}
}
export function defaultGoals() {
  return {
    monthTarget: 50000,
    quarterTarget: 150000,
    winRate: 0.28,     // 28%
    avgDeal: 12000,
    cycleDays: 21,
  };
}
export function mergeGoals(a, b) {
  return { ...a, ...b };
}
