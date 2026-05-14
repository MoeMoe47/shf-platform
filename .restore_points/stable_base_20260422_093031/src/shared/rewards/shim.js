// src/shared/rewards/shim.js
import { appScope as _appScope } from "@/shared/appScope.js";
import {
  getBadges as __getBadges,
  getBadge as __getBadge,
  isUnlocked as __isUnlocked,
  award as __award,
  getHistory as __getHistory
} from "./engine.js";

/* Convenience: current app, computed on each call */
const cur = () => _appScope();

/* Legacy names kept for compatibility with existing imports */
export const getBadges  = (app = cur()) => __getBadges(app);
export const listBadges = (app = cur()) => __getBadges(app); // alias
export const getBadge   = (id, app = cur()) => __getBadge(id, app);
export const isUnlocked = (id, history, app = cur()) =>
  __isUnlocked(id, history, app);
export const award      = (event, app = cur()) => __award(event, app);

/* New helper for Civic: keep the old name but route to engine.award */
export function awardBadge(event, app = cur()) {
  return __award(event, app);
}

/* Minimal progress helper for UIs expecting it. */
export function getBadgeProgress(
  badgeOrId,
  history = __getHistory(cur()),
  app = cur()
) {
  const id = typeof badgeOrId === "string" ? badgeOrId : badgeOrId?.id;
  if (!id) return 0;
  return __isUnlocked(id, history, app) ? 100 : 0;
}

/* Safe no-op for old migrations. */
export function migrateBadgesInPlace() {
  return false;
}
