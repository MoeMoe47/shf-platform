// src/shared/rewards/badges.js

/* ----------------------------------------------------
   Storage + tiny utils
---------------------------------------------------- */
const K_BADGES = "rewards:badges";
const K_STREAK = "eng:streak:count"; // kept in engagement/streaks.js too

const read = (k, d) => {
  try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); } catch { return d; }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
    // ping storage listeners so dashboards refresh
    window.dispatchEvent(new StorageEvent("storage", { key:k, newValue: "updated" }));
  } catch {}
};
const now = () => Date.now();

/* ----------------------------------------------------
   Badge catalog (id → definition)
   - Keep ids stable; UIs and deep links rely on them.
---------------------------------------------------- */
export const BADGE_DEFS = {
  // streaks
  streak_3: {
    id: "streak_3",
    label: "3-Day Streak",
    desc: "Log learning activity 3 days in a row.",
    icon: "🔥",
    kind: "streak",
    target: 3,
  },
  streak_7: {
    id: "streak_7",
    label: "7-Day Streak",
    desc: "Keep the streak going for a full week.",
    icon: "⚡",
    kind: "streak",
    target: 7,
  },

  // lesson actions
  first_reflection: {
    id: "first_reflection",
    label: "Thoughtful Starter",
    desc: "Earned your first +2 for a 120+ character reflection.",
    icon: "📝",
    kind: "once",
  },
  five_lessons: {
    id: "five_lessons",
    label: "Lesson Finisher",
    desc: "Mark 5 lessons complete.",
    icon: "✅",
    kind: "counter",
    target: 5,
  },

  // optional KPI-driven examples (safe if unused)
  micro_5: {
    id: "micro_5",
    label: "Micro-Lesson Sprinter",
    desc: "Complete 5 micro-lessons.",
    icon: "🏁",
    kind: "kpi",
    kpiKey: "civic:kpi:microDone",
    target: 5,
  },
  micro_20: {
    id: "micro_20",
    label: "Micro-Lesson Marathon",
    desc: "Complete 20 micro-lessons.",
    icon: "🏆",
    kind: "kpi",
    kpiKey: "civic:kpi:microDone",
    target: 20,
  },
};

/* ----------------------------------------------------
   State shape
   badgesState = {
     [id]: { unlockedAt: number, meta?: any }
   }
---------------------------------------------------- */
function readState() { return read(K_BADGES, {}); }
function writeState(s) { write(K_BADGES, s); }

/* ----------------------------------------------------
   Live progress readers (don’t store — derive from app)
---------------------------------------------------- */
function readStreakCount() {
  try { return Number(localStorage.getItem(K_STREAK) || "0"); } catch { return 0; }
}

function countCompletedLessons() {
  // Count localStorage keys like civic:lesson:ID:complete === "1"
  try {
    let n = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.endsWith(":complete") && k.startsWith("civic:lesson:")) {
        if (localStorage.getItem(k) === "1") n++;
      }
    }
    return n;
  } catch { return 0; }
}

function readKpi(key) {
  try { return Number(localStorage.getItem(key) || "0"); } catch { return 0; }
}

/* ----------------------------------------------------
   Public: getBadgeProgress(id)
   - Returns a UI-ready progress object
---------------------------------------------------- */
export function getBadgeProgress(id) {
  const def = BADGE_DEFS[id];
  if (!def) return { id, label: id, desc: "", icon: "🏅", unlocked: false, progress: 0, target: 0, percent: 0 };

  const state = readState();
  const unlocked = Boolean(state[id]?.unlockedAt);

  let progress = 0;
  let target = def.target || 0;

  switch (def.kind) {
    case "streak":
      progress = readStreakCount();
      break;
    case "counter":
      // five_lessons → count lesson completes
      progress = id === "five_lessons" ? countCompletedLessons() : 0;
      break;
    case "kpi":
      progress = readKpi(def.kpiKey || "");
      break;
    case "once":
    default:
      progress = unlocked ? 1 : 0;
      target = 1;
      break;
  }

  const percent = target > 0 ? Math.max(0, Math.min(100, Math.round((progress / target) * 100))) : (unlocked ? 100 : 0);

  return {
    id: def.id,
    label: def.label,
    desc: def.desc,
    icon: def.icon || "🏅",
    unlocked,
    unlockedAt: state[id]?.unlockedAt || null,
    progress,
    target,
    percent,
    kind: def.kind,
  };
}

/* ----------------------------------------------------
   Public: getBadges() — full list with progress
---------------------------------------------------- */
export function getBadges() {
  return Object.keys(BADGE_DEFS).map(getBadgeProgress);
}

/* ----------------------------------------------------
   Public: award(id, meta?) — idempotent unlock + celebration
---------------------------------------------------- */
export function award(id, meta = {}) {
  const def = BADGE_DEFS[id];
  if (!def) return false;
  const s = readState();
  if (s[id]?.unlockedAt) return false; // already unlocked

  s[id] = { unlockedAt: now(), meta };
  writeState(s);

  // fire global events other layers listen to (CelebrationLayer, AchievementsBar, wallet, etc.)
  try {
    window.dispatchEvent(new CustomEvent("rewards:badge:unlocked", { detail: { id, def, meta, ts: s[id].unlockedAt } }));
    window.dispatchEvent(new Event("rewards:pulse"));
    window.dispatchEvent(new Event("rewards:update"));
    // optional: analytics fan-out
    window.dispatchEvent(new CustomEvent("analytics:ping", { detail: { name: "rewards.badge.unlocked", badge: id } }));
  } catch {}

  return true;
}

/* ----------------------------------------------------
   Public: migrateBadgesInPlace(mapRewards?) — legacy cleanup
   - Accepts a function that returns current rewards context,
     but it’s optional; we only normalize ids/state.
---------------------------------------------------- */
export function migrateBadgesInPlace(/* getRewards */) {
  const s = readState();
  let changed = false;

  // Example: migrate older ids → new ones (add your real mappings here)
  const MIGRATIONS = {
    // "streak3": "streak_3",
    // "streak7": "streak_7",
  };

  Object.entries(MIGRATIONS).forEach(([oldId, newId]) => {
    if (s[oldId] && !s[newId]) {
      s[newId] = s[oldId];
      delete s[oldId];
      changed = true;
    }
  });

  // Drop unknown ids that aren’t in catalog (keeps storage tidy)
  Object.keys(s).forEach((id) => {
    if (!BADGE_DEFS[id]) { delete s[id]; changed = true; }
  });

  if (changed) writeState(s);
  return changed;
}

/* ----------------------------------------------------
   Optional helpers used by UIs
---------------------------------------------------- */
export function isUnlocked(id) {
  const s = readState();
  return Boolean(s[id]?.unlockedAt);
}

export function lockAllBadgesForDev() {
  writeState({});
  try { window.dispatchEvent(new StorageEvent("storage", { key: K_BADGES, newValue: "updated" })); } catch {}
}

/* ----------------------------------------------------
   Convenience aliases for callers who used old names
---------------------------------------------------- */
export const unlock = award;       // alias
export const listBadges = getBadges;
// --- Compatibility shim: allow legacy `awardBadge(...)` calls ---
export function awardBadge(input, note) {
  try {
    // Support both signatures:
    // 1) awardBadge("badge_id")
    // 2) awardBadge({ id: "badge_id", note: "..." })
    const id =
      (typeof input === "string" && input) ||
      (input && typeof input === "object" && (input.id || input.name || input.badge || input.key)) ||
      null;

    if (!id) return;

    // If you want to keep `note` for logging, you can emit an analytics event here.
    return award(id);
  } catch {}
}
// --- Compat shims (non-breaking) ---
export function getBadge(id) {
  try {
    const list = typeof getBadges === "function" ? getBadges() : [];
    return list.find(b => b.id === id) || null;
  } catch {
    return null;
  }
}

export function getBadgeProgress(id, history = []) {
  try { return isUnlocked(id, history) ? 1 : 0; } catch { return 0; }
}

export function isUnlocked(id, history = []) {
  try {
    const b = getBadge(id);
    if (!b) return false;
    if (typeof b.rule === "function") return !!b.rule({ history, badge: b });
    return !!b.unlocked || false;
  } catch {
    return false;
  }
}
// --- end compat shims ---
