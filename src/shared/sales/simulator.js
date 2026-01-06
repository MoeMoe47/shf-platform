import { loadGoals, mergeGoals, defaultGoals } from "./goals.js";
export function simulateRevenue(opts = {}) {
  const g = mergeGoals(defaultGoals(), loadGoals());
  const m = { ...g, ...opts };
  // expected deals to hit target: target / avgDeal
  const dealsNeeded = Math.ceil(m.monthTarget / Math.max(1, m.avgDeal));
  const winsNeeded  = Math.ceil(dealsNeeded * m.winRate);
  const expectedRev = Math.round(winsNeeded * m.avgDeal);
  return { ...m, dealsNeeded, winsNeeded, expectedRev };
}
