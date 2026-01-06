// src/shared/engagement/streaks.js

/**
 * Streak engine (localStorage)
 * - One "touch" per LOCAL day (no dup within the day)
 * - Emits events so AchievementsBar / Rewards screens refresh live
 * - Backward compatible shims for legacy helpers
 */

import { award } from "@/shared/rewards/shim.js";

/* ---------------- storage keys (new canonical) ---------------- */
const K_COUNT  = "eng:streak:count";   // number
const K_LASTAT = "eng:streak:lastAt";  // ms epoch

/* ---------------- tiny utils ---------------- */
const readNum = (k, d = 0) => {
  try { return Number(localStorage.getItem(k) ?? d); } catch { return d; }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, String(v));
    // notify any storage listeners
    window.dispatchEvent(new StorageEvent("storage", { key: k, newValue: String(v) }));
  } catch {}
};

function startOfLocalDay(t) {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
function isSameLocalDay(a, b) {
  return startOfLocalDay(a) === startOfLocalDay(b);
}
function ymdFromMs(t) {
  if (!t) return "";
  const d = new Date(t);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function todayKey() { return ymdFromMs(Date.now()); }
function ping(name, data) {
  try { window.dispatchEvent(new CustomEvent("analytics:ping", { detail: { name, ...data } })); } catch {}
}

/* ---------------- core API ---------------- */

/**
 * touchStreak({ autoAward=true })
 * - Call once on a meaningful activity (lesson view, reflection, complete, quiz)
 * - Increments streak if last touch was yesterday; keeps if today; resets if gap
 * - Returns current streak count
 */
export function touchStreak({ autoAward = true } = {}) {
  const now = Date.now();
  const lastAt = readNum(K_LASTAT, 0);
  const current = readNum(K_COUNT, 0);

  // Already touched today → noop
  if (lastAt && isSameLocalDay(lastAt, now)) {
    ping("streak.touch.duplicate", { count: current, day: todayKey() });
    return current;
  }

  let next = 1;
  if (lastAt) {
    const diffDays = Math.round((startOfLocalDay(now) - startOfLocalDay(lastAt)) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) next = Math.max(1, current + 1); // continue streak
    else next = 1;                                       // gap → reset
  }

  write(K_LASTAT, now);
  write(K_COUNT, next);

  // update UI + analytics
  try {
    window.dispatchEvent(new Event("rewards:update"));
    window.dispatchEvent(new CustomEvent("streak:update", { detail: { count: next, last: ymdFromMs(now) } }));
  } catch {}
  ping("streak.touch", { count: next, day: todayKey() });

  // optional auto-awards (idempotent in badges.js)
  if (autoAward) {
    if (next === 3) award("streak_3");
    if (next === 7) award("streak_7");
  }

  return next;
}

/** Read the current streak count (no mutation). */
export function getStreakCount() {
  return readNum(K_COUNT, 0);
}

/** Read the last touch timestamp (ms since epoch) or 0 if none. */
export function getLastTouchedAt() {
  return readNum(K_LASTAT, 0);
}

/** Reset streak (dev/tools). */
export function resetStreak() {
  write(K_COUNT, 0);
  write(K_LASTAT, 0);
  try {
    window.dispatchEvent(new Event("rewards:update"));
    window.dispatchEvent(new CustomEvent("streak:update", { detail: { count: 0, last: "" } }));
  } catch {}
  ping("streak.reset");
}

/* ---------------- backward-compat helpers ---------------- */

/** Legacy alias: current streak as a number. */
export function getStreak() { return getStreakCount(); }

/** Legacy alias: last date as YYYY-MM-DD (or ""). */
export function getStreakLastDate() { return ymdFromMs(getLastTouchedAt()); }

/** Next milestone helper (for tooltips/progress hints). */
export function nextStreakMilestone(current) {
  const M = [3, 7, 14, 30, 60, 100, 200, 365];
  for (const m of M) if (current < m) return m;
  return current || 0;
}

/** Pretty tooltip text for streak UI. */
export function streakTooltip(count, lastYMD) {
  if (!count) return "No current streak yet";
  return `Streak ${count} day${count === 1 ? "" : "s"} • Last activity ${lastYMD || "—"}`;
}

/* ---------------- optional (compat) catalog ---------------- */
/* Kept here for callers that imported this constant from streaks.js.
   Your canonical badge data should live in rewards/badges.js. */
export const ACHIEVEMENT_CATALOG = {
  streak_3:         { id: "streak_3",         label: "3-Day Streak",        emoji: "🔥", color: "#ef4444" },
  streak_7:         { id: "streak_7",         label: "7-Day Streak",        emoji: "⚡", color: "#f59e0b" },
  streak_14:        { id: "streak_14",        label: "14-Day Streak",       emoji: "🌟", color: "#22c55e" },
  first_reflection: { id: "first_reflection", label: "First Reflection",    emoji: "📝", color: "#0ea5e9" },
  five_lessons:     { id: "five_lessons",     label: "Five Lessons",        emoji: "🎯", color: "#8b5cf6" },
  first_portfolio:  { id: "first_portfolio",  label: "First Portfolio",     emoji: "📁", color: "#14b8a6" },
};
