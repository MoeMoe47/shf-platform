const KEY = "shf.appOverrides.v1";
const WIN_KEY = "__APP_OVERRIDES__";

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function safeGetWindowOverrides() {
  if (typeof window === "undefined") return {};
  const obj = window[WIN_KEY];
  return obj && typeof obj === "object" ? obj : {};
}

function safeSetWindowOverrides(next) {
  if (typeof window === "undefined") return;
  try {
    Object.defineProperty(window, WIN_KEY, {
      value: next,
      writable: true,
      configurable: true
    });
  } catch {
    // Fallback if defineProperty is blocked for some reason
    window[WIN_KEY] = next;
  }
}

function safeSetStorage(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage unavailable (private mode, quota, policy)
  }
}

export function getAppOverrides() {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(KEY);
  const parsed = safeParse(raw);
  return parsed && typeof parsed === "object" ? parsed : {};
}

export function setAppOverride(appId, patch) {
  if (typeof window === "undefined") return;

  const cur = getAppOverrides();
  const next = {
    ...cur,
    [appId]: { ...(cur[appId] || {}), ...(patch || {}) }
  };

  safeSetStorage(KEY, JSON.stringify(next));
  return next;
}

export function clearAppOverride(appId) {
  if (typeof window === "undefined") return;

  const cur = getAppOverrides();
  if (!(appId in cur)) return cur;

  const next = { ...cur };
  delete next[appId];

  safeSetStorage(KEY, JSON.stringify(next));
  return next;
}

/**
 * MEMORY-ONLY OVERRIDES (session / live demo)
 * Stored on window.__APP_OVERRIDES__ and never written to disk.
 */
export function getWindowOverrides() {
  return safeGetWindowOverrides();
}

export function setWindowOverride(appId, patch) {
  if (typeof window === "undefined") return;

  const cur = safeGetWindowOverrides();
  const next = {
    ...cur,
    [appId]: { ...(cur[appId] || {}), ...(patch || {}) }
  };

  safeSetWindowOverrides(next);
  return next;
}

export function clearWindowOverride(appId) {
  if (typeof window === "undefined") return;

  const cur = safeGetWindowOverrides();
  if (!(appId in cur)) return cur;

  const next = { ...cur };
  delete next[appId];

  safeSetWindowOverrides(next);
  return next;
}

/**
 * Resolve enabled: window override wins, then localStorage override,
 * then manifest.enabled, default true.
 */
export function resolveAppEnabled(appId, manifest) {
  const w = safeGetWindowOverrides();
  const wo = w?.[appId];
  if (wo && typeof wo.enabled === "boolean") return wo.enabled;

  const ov = getAppOverrides();
  const o = ov?.[appId];
  if (o && typeof o.enabled === "boolean") return o.enabled;

  if (manifest && typeof manifest.enabled === "boolean") return manifest.enabled;

  return true;
}
