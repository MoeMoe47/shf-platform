const KEY = "shf.appOverrides.v1";
const SESSION_KEY = "__SHF_APP_OVERRIDES__";

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

function isObj(x) {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

function getSessionStore() {
  if (typeof window === "undefined") return null;
  if (!isObj(window[SESSION_KEY])) window[SESSION_KEY] = {};
  return window[SESSION_KEY];
}

/** Session (in-memory) overrides — best for demos */
export function getSessionOverrides() {
  const store = getSessionStore();
  return store ? store : {};
}

export function setSessionOverride(appId, patch) {
  const store = getSessionStore();
  if (!store) return {};
  const cur = isObj(store[appId]) ? store[appId] : {};
  store[appId] = { ...cur, ...(patch || {}) };
  return store;
}

export function clearSessionOverride(appId) {
  const store = getSessionStore();
  if (!store) return {};
  if (appId in store) delete store[appId];
  return store;
}

/** Persisted overrides — survive refresh */
export function getAppOverrides() {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(KEY);
  const parsed = safeParse(raw);
  return isObj(parsed) ? parsed : {};
}

export function setAppOverride(appId, patch) {
  if (typeof window === "undefined") return {};
  const cur = getAppOverrides();
  const next = { ...cur, [appId]: { ...(cur[appId] || {}), ...(patch || {}) } };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearAppOverride(appId) {
  if (typeof window === "undefined") return {};
  const cur = getAppOverrides();
  if (!(appId in cur)) return cur;
  const next = { ...cur };
  delete next[appId];
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

/**
 * Resolve enabled with source:
 * session override wins, then persisted override, then manifest.enabled, else default true
 */
export function resolveAppEnabledWithSource(appId, manifest) {
  const sess = getSessionOverrides();
  const s = sess?.[appId];
  if (s && typeof s.enabled === "boolean") return { enabled: s.enabled, source: "session" };

  const ov = getAppOverrides();
  const p = ov?.[appId];
  if (p && typeof p.enabled === "boolean") return { enabled: p.enabled, source: "persisted" };

  if (manifest && typeof manifest.enabled === "boolean") {
    return { enabled: manifest.enabled, source: "manifest" };
  }

  return { enabled: true, source: "default" };
}

// Back-compat helper (existing callers)
export function resolveAppEnabled(appId, manifest) {
  return resolveAppEnabledWithSource(appId, manifest).enabled;
}

export function hasAnyOverride() {
  const sess = getSessionOverrides();
  const pers = getAppOverrides();
  return (sess && Object.keys(sess).length > 0) || (pers && Object.keys(pers).length > 0);
}
