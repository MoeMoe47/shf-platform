// src/utils/mergedApi.js

/** ---------- Legacy helpers (kept for compatibility) ---------- */
/** Convert any lesson-ish value to a slug string */
export const toSlug = (x) => (typeof x === "string" ? x : x?.slug || null);

/** Normalize slugs from { slugs:[] } | { lessons:[{slug}]} | string[] */
export const normalizeSlugs = (j) => {
  if (Array.isArray(j)) return j.map(toSlug).filter(Boolean);
  if (Array.isArray(j?.slugs))   return j.slugs.map(toSlug).filter(Boolean);
  if (Array.isArray(j?.lessons)) return j.lessons.map(toSlug).filter(Boolean);
  return [];
};

/** ---------- Core fetch helper ---------- */
async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, { headers: { Accept: "application/json" }, ...opts });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET ${url} → ${res.status} ${res.statusText} ${text || ""}`.trim());
  }
  return res.json();
}

/** ---------- New cached APIs (requested) ---------- */

// Simple in-memory cache so repeated lesson loads are instant
const _cache = new Map();

/**
 * getLesson(curriculum, slug)
 * - Works with your dev mock endpoints from vite config:
 *   /api/merged/:curriculum/:slug  (e.g., /api/merged/chapter1/ch1)
 */
export async function getLesson(curriculum, slug, { signal } = {}) {
  if (!curriculum || !slug) throw new Error("getLesson requires curriculum and slug");
  const url = `/api/merged/${encodeURIComponent(curriculum)}/${encodeURIComponent(slug)}`;
  if (_cache.has(url)) return _cache.get(url);
  const data = await fetchJSON(url, { signal });
  _cache.set(url, data);
  return data;
}

/**
 * getMergedIndex()
 * - Admin/merged index that enumerates lessons across curricula.
 * - Backs the lessons list (uses your dev mock / builder).
 */
export async function getMergedIndex({ signal } = {}) {
  const url = `/api/merged/admin/index`;
  if (_cache.has(url)) return _cache.get(url);
  const data = await fetchJSON(url, { signal });
  _cache.set(url, data);
  return data;
}

/** Optional helper to clear caches (e.g., on logout or hard refresh) */
export function clearMergedCache() {
  _cache.clear();
}

/** ---------- Legacy endpoints (still exported to avoid breakage) ---------- */

/** Get the lesson index for a curriculum (canonical endpoint) */
export async function fetchIndex(curriculum, signal) {
  const j = await fetchJSON(`/api/merged/${curriculum}/index`, { signal });
  return normalizeSlugs(j);
}

/** (Optional) Fetch available curricula for guards/menus */
export async function fetchCurricula(signal) {
  const j = await fetchJSON(`/api/curricula`, { signal });
  return Array.isArray(j) ? j : (j?.curricula || []);
}

/** ---------- Default export (both styles supported) ---------- */
export default {
  // new
  getLesson,
  getMergedIndex,
  clearMergedCache,
  // legacy
  toSlug,
  normalizeSlugs,
  fetchIndex,
  fetchCurricula,
};
