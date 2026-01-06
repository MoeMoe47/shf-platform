// src/shared/ledger/ledgerClient.js

const KEY = "ledger:events:v1";

/**
 * Query events with a normalized shape:
 *   queryEvents({
 *     from?: "YYYY-MM-DD" | Date,
 *     to?:   "YYYY-MM-DD" | Date,
 *     filters?: {
 *       program?: string,        // exact match
 *       vendor?: string,         // exact match
 *       grant?: string,          // exact match
 *       funding?: string,        // exact match
 *       tags?: string | string[] | "Any", // includes (ANY). "Any" = ignore
 *       q?: string,              // free text: memo, program, vendor, tags
 *       min?: number,            // amount >= min
 *       max?: number             // amount <= max
 *     },
 *     sort?: { key?: "ts"|"date"|"amount"|"memo"|"program", dir?: "asc"|"desc" }
 *   })
 */
export function queryEvents(input = {}) {
  const { fromMs, toMs, filters, sort } = normalizeQuery(input);
  const all = readAll();

  const results = all.filter(ev => {
    // --- time window (inclusive) ---
    const evMs = eventTimeMs(ev);
    if (fromMs != null && evMs < fromMs) return false;
    if (toMs   != null && evMs > toMs)   return false;

    // --- amount range ---
    const amt = Number(ev.amount) || 0;
    if (filters.min != null && amt < filters.min) return false;
    if (filters.max != null && amt > filters.max) return false;

    // --- exacts (program, vendor, grant, funding) ---
    if (filters.program && ev.program !== filters.program) return false;
    if (filters.vendor  && ev.vendor  !== filters.vendor)  return false;
    if (filters.grant   && ev.grant   !== filters.grant)   return false;
    if (filters.funding && ev.funding !== filters.funding) return false;

    // --- tags ---
    if (filters.tags && filters.tags !== "Any") {
      const evTags = (ev.tags || []).map(String);
      const wanted = Array.isArray(filters.tags) ? filters.tags : [filters.tags];
      // ANY logic: at least one wanted tag appears in ev.tags
      const any = wanted.some(t => evTags.includes(String(t)));
      if (!any) return false;
    }

    // --- free text search (memo, program, vendor, tags) ---
    if (filters.q) {
      const needle = String(filters.q).toLowerCase();
      const hay = [
        ev.memo,
        ev.program,
        ev.vendor,
        ...(ev.tags || [])
      ].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(needle)) return false;
    }

    // if we got here, the event matches
    return true;
  });

  // --- sorting ---
  const dir = sort.dir === "asc" ? 1 : -1;
  results.sort((a, b) => {
    let av, bv;
    switch (sort.key) {
      case "date":
      case "ts":
        av = eventTimeMs(a);
        bv = eventTimeMs(b);
        break;
      case "amount":
        av = Number(a.amount) || 0;
        bv = Number(b.amount) || 0;
        break;
      case "memo":
        av = (a.memo || "").toLowerCase();
        bv = (b.memo || "").toLowerCase();
        break;
      case "program":
        av = (a.program || "").toLowerCase();
        bv = (b.program || "").toLowerCase();
        break;
      default:
        av = eventTimeMs(a);
        bv = eventTimeMs(b);
    }
    if (av < bv) return -1 * dir;
    if (av > bv) return  1 * dir;
    return 0;
  });

  return results;
}

// write
export function appendEvent(ev) {
  const now = new Date().toISOString();
  const withDefaults = {
    id: ev.id || `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    ts: ev.ts || now,
    tags: ev.tags || [],
    meta: ev.meta || {},
    proof: ev.proof || { batchId: null, rootHash: null },
    impact_tag: ev.impact_tag ?? null,
    ...ev,
  };
  const all = readAll();
  if (!all.find(e => e.id === withDefaults.id)) {
    all.push(withDefaults);
    saveAll(all);
  }
  return withDefaults;
}

// rollups for dashboards
export function rollup() {
  const all = readAll();
  const byApp = {};
  const byTag = {};
  let total = 0;

  for (const ev of all) {
    if (typeof ev.amount === "number") total += ev.amount;
    byApp[ev.app] = (byApp[ev.app] || 0) + (ev.amount || 0);
    for (const t of ev.tags || []) {
      byTag[t] = (byTag[t] || 0) + (ev.amount || 0);
    }
  }
  return { total, byApp, byTag, count: all.length };
}

/* ---------------- internal helpers ---------------- */

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveAll(all) {
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
}

function eventTimeMs(ev) {
  // Prefer explicit ev.ts (ISO). Fallback to ev.date if present.
  const iso = ev.ts || ev.date;
  const ms = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(ms) ? 0 : ms;
}

function normalizeQuery(input) {
  const { from, to, filters = {}, sort = {} } = input || {};

  const fromMs = from == null ? null : toMs(from, "start");
  const toMs   = to   == null ? null : toMsFn(to, "end");

  return {
    fromMs,
    toMs,
    filters: {
      program: filters.program || null,
      vendor:  filters.vendor  || null,
      grant:   filters.grant   || null,
      funding: filters.funding || null,
      tags:    filters.tags ?? "Any",
      q:       filters.q || "",
      min:     isFiniteNum(filters.min) ? Number(filters.min) : null,
      max:     isFiniteNum(filters.max) ? Number(filters.max) : null,
    },
    sort: {
      key: ["ts","date","amount","memo","program"].includes(sort.key) ? sort.key : "ts",
      dir: sort.dir === "asc" ? "asc" : "desc",
    }
  };
}

function toMs(val, which) {
  // accepts Date or "YYYY-MM-DD" (or ISO)
  const d = val instanceof Date ? val : new Date(String(val));
  if (Number.isNaN(d.getTime())) return null;
  if (which === "start") {
    d.setHours(0,0,0,0);
  } else if (which === "end") {
    d.setHours(23,59,59,999);
  }
  return d.getTime();
}

// keep names distinct to avoid shadowing
const toMsFn = toMs;

function isFiniteNum(n) {
  return n !== null && n !== undefined && Number.isFinite(Number(n));
}
