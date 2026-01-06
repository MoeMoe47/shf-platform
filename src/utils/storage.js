import { appScope } from "@/shared/appScope.js";

/**
 * nsKey("rewards:history")  -> "rewards:<app>:history"
 * If key already contains ":", we still prefix with app unless it already looks app-scoped.
 */
function nsKey(key, app = appScope()) {
  if (typeof key !== "string") key = String(key);
  // If it already looks app-scoped e.g. "rewards:civic:history", leave it.
  if (/^[^:]+:[a-z]+:/.test(key)) return key;
  // If key includes a namespace but not app, insert app as the middle segment
  if (/^[^:]+:/.test(key)) {
    const [h, ...rest] = key.split(":");
    return [h, app, ...rest].join(":");
  }
  // Plain key -> prefix with app
  return `${app}:${key}`;
}

/** get/set/remove with dual-read (legacy then ns) and write-ns */
export const nsStorage = {
  get(key, app) {
    try {
      const k = nsKey(key, app);
      const v = localStorage.getItem(k);
      if (v != null) return JSON.parse(v);
      // legacy fallback (un-namespaced)
      const legacy = localStorage.getItem(key);
      return legacy != null ? JSON.parse(legacy) : null;
    } catch { return null; }
  },
  set(key, value, app) {
    try {
      const k = nsKey(key, app);
      localStorage.setItem(k, JSON.stringify(value));
      return true;
    } catch { return false; }
  },
  remove(key, app) {
    try {
      localStorage.removeItem(nsKey(key, app));
      // do NOT remove legacy by default
      return true;
    } catch { return false; }
  },
  /** migrate legacy -> ns (idempotent) */
  migrate(key, app) {
    try {
      const legacy = localStorage.getItem(key);
      if (legacy == null) return false;
      localStorage.setItem(nsKey(key, app), legacy);
      // keep legacy copy for safety
      return true;
    } catch { return false; }
  }
};

/* ---- shim: readJSON (non-throwing) ---- */
export function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/* ---- shim: safeSet (non-throwing) ---- */
export function safeSet(key, value) {
  try {
    const raw = typeof value === "string" ? value : JSON.stringify(value);
    localStorage.setItem(key, raw);
    return true;
  } catch {
    return false;
  }
}

/* ---- shim: minimal storage alias ---- */
export const storage = {
  get(key, fallback = null) { return readJSON(key, fallback); },
  set(key, value) { return safeSet(key, value); }
};
