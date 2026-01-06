// src/router/dashboardViewState.js

// Single param name used for shareable dashboard state
export const VIEW_PARAM = "view";

/** Base64-encode JSON safely (unicode-safe) */
export function encodeViewState(obj) {
  try {
    return btoa(encodeURIComponent(JSON.stringify(obj)));
  } catch {
    return "";
  }
}

/** Decode string created by encodeViewState */
export function decodeViewState(str) {
  try {
    return JSON.parse(decodeURIComponent(atob(str)));
  } catch {
    return null;
  }
}

/**
 * Read dashboard state from the current URL.
 * Works with both ?view=<b64> and #view=<b64>.
 * Pass react-router's `location` or fallback to `window.location`.
 */
export function readDashboardStateFromURL(locationLike) {
  const loc = locationLike || window.location;
  const u = new URL(loc.href || loc, window.location.origin);

  // 1) Search param takes precedence
  const fromSearch = u.searchParams.get(VIEW_PARAM);
  if (fromSearch) {
    const dec = decodeViewState(fromSearch);
    if (dec) return sanitizeView(dec);
  }

  // 2) Fallback to hash (#view=...)
  if (u.hash?.startsWith(`#${VIEW_PARAM}=`)) {
    const raw = u.hash.slice(VIEW_PARAM.length + 2); // strip '#view='
    const dec = decodeViewState(raw);
    if (dec) return sanitizeView(dec);
  }

  return null;
}

/**
 * Write dashboard state to both ?view= and #view=
 * Use react-router's navigate+location for SPA-friendly updates.
 */
export function writeDashboardStateToURL(navigate, locationLike, state, replace = true) {
  const loc = locationLike || window.location;
  const u = new URL(loc.href || loc, window.location.origin);
  const encoded = encodeViewState(sanitizeView(state));
  if (!encoded) return;

  u.searchParams.set(VIEW_PARAM, encoded);
  u.hash = `${VIEW_PARAM}=${encoded}`;

  const next = u.pathname + u.search + u.hash;

  // If navigate provided (react-router), prefer it to avoid full reload
  if (typeof navigate === "function") {
    navigate(next, { replace });
  } else {
    // fallback for non-router usage
    if (replace) history.replaceState(null, "", next);
    else history.pushState(null, "", next);
  }
}

/**
 * Merge defaults with anything found in the URL.
 * - defaults: { dateRange, filters, sort }
 * Returns a new object of the same shape.
 */
export function mergeDashboardState(defaults, fromUrl) {
  if (!fromUrl) return cloneView(defaults);
  return sanitizeView({
    dateRange: { ...(defaults.dateRange || {}), ...(fromUrl.dateRange || {}) },
    filters:   { ...(defaults.filters   || {}), ...(fromUrl.filters   || {}) },
    sort:      { ...(defaults.sort      || {}), ...(fromUrl.sort      || {}) },
  });
}

/* ---------------- Internal helpers ---------------- */

function cloneView(v) {
  return JSON.parse(JSON.stringify(v || {}));
}

/** Ensure the view only contains the expected fields to avoid noise */
function sanitizeView(v) {
  const out = { dateRange: {}, filters: {}, sort: {} };

  if (v?.dateRange) {
    const { from, to } = v.dateRange;
    if (from) out.dateRange.from = String(from);
    if (to)   out.dateRange.to   = String(to);
  }
  if (v?.filters && typeof v.filters === "object") {
    out.filters = { ...v.filters };
    // strip derived fields we don’t want serialized
    delete out.filters._from;
    delete out.filters._to;
  }
  if (v?.sort) {
    const key = v.sort.key || "date";
    const dir = v.sort.dir === "asc" ? "asc" : "desc";
    out.sort = { key, dir };
  }
  return out;
}
