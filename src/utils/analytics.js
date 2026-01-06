// src/utils/analytics.js
// Lightweight analytics bus with pluggable sinks.
// - Students: silent capture; they don't see analytics UI.
// - Admin/demo: overlay, admin pages, console stream.
// - Later: plug Mixpanel / GA / Polygon relayer with the same API.

const RING_MAX = 1000;            // hard cap in-memory
const PERSIST_KEY = "analytics:ring";
const DEV = typeof import.meta !== "undefined"
  ? (import.meta.env?.MODE !== "production")
  : true;

// -------- Internal state --------
let ring = [];
let user = { id: null, role: "student" }; // basic persona only
let context = { curriculum: null, appVersion: null };
let superProps = {}; // optional global properties

// Bootstrap from localStorage (demo persistence)
try {
  const saved = JSON.parse(localStorage.getItem(PERSIST_KEY) || "[]");
  if (Array.isArray(saved) && saved.length) ring = saved.slice(-RING_MAX);
} catch {}

// -------- Utilities --------
function pushToRing(evt) {
  ring.push(evt);
  if (ring.length > RING_MAX) ring = ring.slice(-RING_MAX);
}

function persist() {
  try { localStorage.setItem(PERSIST_KEY, JSON.stringify(ring.slice(-200))); } catch {}
}

function safeAddress(a) {
  if (!a || typeof a !== "string") return a;
  return a.startsWith("0x") && a.length > 10 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

// Minimal PII policy: drop raw emails; shorten wallet addresses.
function sanitize(obj) {
  const out = {};
  for (const k of Object.keys(obj || {})) {
    const v = obj[k];
    if (/email/i.test(k)) continue; // strip emails entirely
    if (/address/i.test(k) && typeof v === "string") {
      out[k] = safeAddress(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function nowTs() { return Date.now(); }

// -------- Public API --------
export function track(event, props = {}, opts = {}) {
  const payload = {
    t: nowTs(),
    event,
    props: {
      ...superProps,
      ...context,
      ...sanitize(props),
      role: user.role || "student",
      uid: user.id || undefined,
    },
  };

  // 1) Local ring + (optional) persistence for demos
  pushToRing(payload);
  persist();

  // 2) Dev console (quiet if opts.silent === true)
  if (DEV && !opts.silent) {
    // eslint-disable-next-line no-console
    console.log("[ANALYTICS]", payload.event, payload.props);
  }

  // 3) Future sinks (turn on when ready)
  // if (window.mixpanel) window.mixpanel.track(payload.event, payload.props);
  // if (window.gtag) window.gtag("event", payload.event, payload.props);
  // if (window.__relayer) window.__relayer.send(payload);

  // 4) Broadcast for admin pages/overlays (two channels for back-compat)
  const detail = payload;
  window.dispatchEvent(new CustomEvent("analytics:event", { detail }));
  // Legacy bus used elsewhere:
  window.dispatchEvent(new CustomEvent("sh:bus", { detail: { channel: "analytics", payload } }));

  return payload;
}

// Page view helper (captures route + doc title)
export function trackView(pathname, extra = {}) {
  return track("$pageview", { path: pathname, title: document?.title, ...extra }, { silent: true });
}

// Setters (student/admin persona & ambient context)
export function setUser({ id = null, role = "student" } = {}) {
  user = { id, role };
}

export function setContext({ curriculum = null, appVersion = null } = {}) {
  context = { curriculum, appVersion };
}

// Optional super properties (appended to every event)
export function setSuperProps(props = {}) {
  superProps = { ...superProps, ...sanitize(props) };
}

// Timers: analyticsTimer("load_dashboard").end({ ok:true })
export function analyticsTimer(name, baseProps = {}) {
  const start = nowTs();
  return {
    end(endProps = {}) {
      const durMs = nowTs() - start;
      return track("$timing", { name, durMs, ...baseProps, ...endProps });
    },
  };
}

// Subscribe to live events (no prop drilling needed)
export function subscribe(handler) {
  const onNew = (e) => handler(e.detail);
  window.addEventListener("analytics:event", onNew);
  return () => window.removeEventListener("analytics:event", onNew);
}

// Ring helpers
export function getEventRing() {
  return ring.slice().reverse(); // newest first
}

export function clearRing() {
  ring = [];
  try { localStorage.removeItem(PERSIST_KEY); } catch {}
}

// Export a CSV string of the current ring (for quick demos/downloads)
export function exportRingCSV(max = 500) {
  const rows = [["t", "event", "props"]];
  for (const evt of getEventRing().slice(0, max)) {
    rows.push([evt.t, evt.event, JSON.stringify(evt.props || {})]);
  }
  return rows.map(r => r.map(csvEscape).join(",")).join("\r\n");
}

function csvEscape(v) {
  const s = String(v ?? "");
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// -------- Dev convenience (optional) --------
if (DEV) {
  // expose a tiny console API for quick tests
  window.__analytics = {
    track,
    trackView,
    setUser,
    setContext,
    setSuperProps,
    analyticsTimer,
    getEventRing,
    clearRing,
    exportRingCSV,
  };
}

// -------- React no-op provider (for compatibility with main.jsx) --------
export function AnalyticsProvider({ children }) {
  // Keep this trivial; if you later need React context, wire it here.
  return children;
}
