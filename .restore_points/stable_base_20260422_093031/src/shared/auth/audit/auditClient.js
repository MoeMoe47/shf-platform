// src/shared/audit/auditClient.js

/** ------------------------------------------------------------------
 *  SHF Audit Client (safe, buffered, beacon-enabled)
 *  - Backward compatible with your original object API:
 *      audit.recordAction(type, payload)
 *      audit.getAll(), audit.clear()
 *  - Also supports the function call style:
 *      audit("page:view", { app:"treasury", page:"dashboard" })
 * ------------------------------------------------------------------ */

const KEY = "shf:audit:events";
const SID_KEY = "shf:audit:sid";
const MAX_BUFFER = 500;        // keep the last 500 events locally
const BATCH_SIZE = 50;         // send up to 50 per flush
const DEV_LOG = !!(import.meta?.env?.DEV);
const ENDPOINT =
  (typeof window !== "undefined" && window.__AUDIT_ENDPOINT) ||
  (import.meta?.env?.VITE_AUDIT_ENDPOINT) ||
  "/api/audit";

/* ----------------------- storage helpers ----------------------- */
function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}
function save(arr) {
  try { localStorage.setItem(KEY, JSON.stringify(arr)); }
  catch {}
}
function sid() {
  try {
    let id = localStorage.getItem(SID_KEY);
    if (!id) {
      id = (crypto?.randomUUID?.() || (`sid-${Date.now()}-${Math.random().toString(16).slice(2)}`));
      localStorage.setItem(SID_KEY, id);
    }
    return id;
  } catch {
    return `sid-${Date.now()}`;
  }
}

/* ----------------------- enqueue & trim ------------------------ */
function enqueue(type, payload = {}) {
  const events = load();
  events.push({
    id: crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ts: new Date().toISOString(),
    sid: sid(),
    type,
    payload,
  });
  // Trim to max buffer
  if (events.length > MAX_BUFFER) {
    events.splice(0, events.length - MAX_BUFFER);
  }
  save(events);
  if (DEV_LOG) console.info("[audit]", type, payload);
}

/* ----------------------- flushing logic ------------------------ */
let flushTimer = null;
const DEBOUNCE_MS = 1200;

async function _sendBatch(batch) {
  if (!batch?.length) return true;
  try {
    // Prefer Beacon when available (best effort)
    if (navigator?.sendBeacon) {
      const ok = navigator.sendBeacon(
        ENDPOINT,
        new Blob([JSON.stringify({ events: batch })], { type: "application/json" })
      );
      if (ok) return true;
      // If beacon refused (e.g., blocked), fall through to fetch
    }
  } catch { /* fallthrough */ }

  // Fallback: POST with fetch (keepalive for page unloads)
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function flushNow() {
  const events = load();
  if (!events.length) return true;

  // Take the last BATCH_SIZE events (most recent first)
  const batch = events.slice(-BATCH_SIZE);
  const remaining = events.slice(0, Math.max(0, events.length - BATCH_SIZE));

  const ok = await _sendBatch(batch);
  if (ok) {
    // Remove what we sent
    save(remaining);
  }
  return ok;
}

function flushSoon() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushNow().catch(() => {});
  }, DEBOUNCE_MS);
}

/* ----------------------- public API ---------------------------- */
/**
 * Callable function API:
 *   audit("event:type", { ...payload })
 */
function audit(type, payload = {}) {
  try {
    enqueue(type, payload);
    flushSoon();
  } catch { /* no-op */ }
}

/* Attach object-style methods for backward compatibility */
audit.recordAction = function recordAction(type, payload = {}) {
  audit(type, payload);
};
audit.getAll = function getAll() { return load(); };
audit.clear = function clear() { save([]); };
audit.flush = function flush() { return flushNow(); };
audit.endpoint = ENDPOINT; // exposed for debugging

/* ----------------------- lifecycle hooks ----------------------- */
(function wireLifecycle() {
  if (typeof window === "undefined") return;
  try {
    // Flush when tab goes hidden or user navigates away
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        // Try immediate send (beacon/fetch keepalive)
        flushNow().catch(() => {});
      }
    });
    window.addEventListener("beforeunload", () => {
      // Best-effort flush
      if (load().length) {
        // Fire & forget; sendBeacon path preferred inside flushNow()
        navigator?.sendBeacon && _sendBatch(load().slice(-BATCH_SIZE));
      }
    });
  } catch { /* no-op */ }
})();

export { audit };          // named export (function with methods)
export default audit;      // optional default export for convenience
