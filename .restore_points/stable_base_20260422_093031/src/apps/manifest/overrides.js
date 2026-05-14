const KEY_PERSIST = "shf.appOverrides.v1";
const KEY_SESSION = "shf.appOverrides.session.v1";

const EVT = "shf:app-state";
const MAX_LOG = 25;

let _log = []; // in-memory ring buffer (not persisted)

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

function nowIso() {
  try { return new Date().toISOString(); } catch { return String(Date.now()); }
}

function emit(payload) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(EVT, { detail: payload }));
  } catch {}
}

function pushLog(e) {
  _log = [e, ..._log].slice(0, MAX_LOG);
}

export function getOverrideEvents() {
  return _log.slice();
}

export function isDemoMode() {
  if (typeof window === "undefined") return false;
  // Demo mode = any session overrides present
  const o = getSessionOverrides();
  return !!(o && Object.keys(o).length);
}

/* ---------------------------
   Persisted overrides
--------------------------- */
export function getAppOverrides() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY_PERSIST);
    const parsed = safeParse(raw);
    return (parsed && typeof parsed === "object") ? parsed : {};
  } catch {
    return {};
  }
}

export function setAppOverride(appId, patch) {
  if (typeof window === "undefined") return {};
  const cur = getAppOverrides();
  const next = { ...cur, [appId]: { ...(cur[appId] || {}), ...(patch || {}) } };
  window.localStorage.setItem(KEY_PERSIST, JSON.stringify(next));

  const e = { ts: nowIso(), scope: "persist", appId, patch };
  pushLog(e);
  emit({ type: "override", ...e, persist: next, session: getSessionOverrides() });

  return next;
}

export function clearAppOverride(appId) {
  if (typeof window === "undefined") return {};
  const cur = getAppOverrides();
  if (!(appId in cur)) return cur;
  const next = { ...cur };
  delete next[appId];
  window.localStorage.setItem(KEY_PERSIST, JSON.stringify(next));

  const e = { ts: nowIso(), scope: "persist", appId, patch: null };
  pushLog(e);
  emit({ type: "override", ...e, persist: next, session: getSessionOverrides() });

  return next;
}

/* ---------------------------
   Session overrides (Demo)
--------------------------- */
export function getSessionOverrides() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(KEY_SESSION);
    const parsed = safeParse(raw);
    return (parsed && typeof parsed === "object") ? parsed : {};
  } catch {
    return {};
  }
}

export function setSessionOverride(appId, patch) {
  if (typeof window === "undefined") return {};
  const cur = getSessionOverrides();
  const next = { ...cur, [appId]: { ...(cur[appId] || {}), ...(patch || {}) } };

  try {
    window.sessionStorage.setItem(KEY_SESSION, JSON.stringify(next));
  } catch {}

  const e = { ts: nowIso(), scope: "session", appId, patch };
  pushLog(e);
  emit({ type: "override", ...e, persist: getAppOverrides(), session: next });

  return next;
}

export function clearSessionOverride(appId) {
  if (typeof window === "undefined") return {};
  const cur = getSessionOverrides();
  if (!(appId in cur)) return cur;
  const next = { ...cur };
  delete next[appId];

  try {
    window.sessionStorage.setItem(KEY_SESSION, JSON.stringify(next));
  } catch {}

  const e = { ts: nowIso(), scope: "session", appId, patch: null };
  pushLog(e);
  emit({ type: "override", ...e, persist: getAppOverrides(), session: next });

  return next;
}

/* ---------------------------
   Resolution
--------------------------- */
export function resolveAppEnabled(appId, manifest) {
  // precedence: session override -> persisted override -> manifest -> default true
  const sess = getSessionOverrides();
  const s = sess?.[appId];
  if (s && typeof s.enabled === "boolean") return s.enabled;

  const ov = getAppOverrides();
  const o = ov?.[appId];
  if (o && typeof o.enabled === "boolean") return o.enabled;

  if (manifest && typeof manifest.enabled === "boolean") return manifest.enabled;
  return true;
}

export function countAllOverrides() {
  const p = getAppOverrides();
  const s = getSessionOverrides();
  const pCount = p ? Object.keys(p).length : 0;
  const sCount = s ? Object.keys(s).length : 0;
  return { persisted: pCount, session: sCount, total: pCount + sCount };
}


/* === SHF FIX: exports expected by applyManifest.js ===
   Keep logic minimal + safe. If overrides exist, source="override", else "manifest".
*/
export function hasAnyOverride(appId) {
  try {
    const p = getAppOverrides() || {};
    const se = getSessionOverrides() || {};
    if (!appId) return (Object.keys(p).length + Object.keys(se).length) > 0;
    return !!(p[appId] || se[appId]);
  } catch {
    return false;
  }
}

export function resolveAppEnabledWithSource(appId, manifest) {
  const enabledRaw = (typeof resolveAppEnabled === "function")
    ? resolveAppEnabled(appId, manifest)
    : !!(manifest?.enabled ?? true);

  const shf = (manifest && manifest.meta && manifest.meta.shf) ? manifest.meta.shf : {};
  const mode = (typeof window !== "undefined")
    ? String(window.__SHF_MODE__ || document?.documentElement?.dataset?.shfMode || "PILOT").toUpperCase()
    : "PILOT";

  // Mode gates (hard policy)
  const systemOnly = !!shf.systemOnly;
  const pilotOnly  = !!shf.pilotOnly;

  if (mode === "PILOT" && systemOnly) return { enabled: false, source: "mode" };
  if (mode === "SYSTEM" && pilotOnly) return { enabled: false, source: "mode" };

  const enabled = !!enabledRaw;
  const source = hasAnyOverride(appId) ? "override" : "manifest";
  return { enabled, source };
}

/* === BEGIN SHF FIX ===
   These exports are required by applyManifest.js for:
   - enabled source attribution
   - demo badge (runtime overrides)
   Keep these as top-level named exports.
=== */


// scanner-friendly explicit named exports (harmless if already exported above)

/* === END SHF FIX === */
