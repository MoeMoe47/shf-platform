/* eslint-disable no-console */

// Lightweight fetch interceptor for local dev.
// Import once from your app entry (dev-only).
// Example:
//   if (import.meta.env.DEV) { import("@/dev/mockApi.js"); }

if (typeof window !== "undefined" && import.meta.env.DEV) {
    installMockApi();
  }
  
  function installMockApi() {
    if (window.__mockApiInstalled) return;
    window.__mockApiInstalled = true;
  
    console.info("[mockApi] DEV fetch shim installed.");
  
    const realFetch = window.fetch.bind(window);
  
    window.fetch = async (input, init = {}) => {
      const req = normalizeRequest(input, init);
  
      // Only intercept our API namespace
      if (!req.url.startsWith("/api/")) {
        return realFetch(input, init);
      }
  
      try {
        const res = await route(req);
        return res;
      } catch (err) {
        console.error("[mockApi] error:", err);
        return json({ error: String(err?.message || err) }, 500);
      }
    };
  
    console.info("[mockApi] installed fetch interceptor");
    console.info("[mockApi] credit verify routes → GET/POST /api/credit/verify");
    console.info("[mockApi] ledger routes → GET/POST /api/ledger/events, GET /api/ledger/rollup");
  }
  
  /* -------------------------- Router -------------------------- */
  
  async function route(req) {
    const { url, method } = req;
  
    // CREDIT VERIFY
    if (url === "/api/credit/verify" && method === "GET") {
      await delay(200);
      const state = getCreditState();
      return json({
        status: "ok",
        lastPostedNetwork: "Polygon",
        credit: state.credit,
        updatedAt: state.updatedAt,
      });
    }
  
    if (url === "/api/credit/verify" && method === "POST") {
      const body = await readJson(req);
      const amount = Number(body?.amount ?? 0);
      const state = setCreditState(Math.max(0, amount));
      await delay(250);
      return json({
        status: "ok",
        message: "credit verified",
        credit: state.credit,
        updatedAt: state.updatedAt,
      });
    }
  
    // LEDGER
    if (url.startsWith("/api/ledger/events") && method === "GET") {
      const query = parseQuery(url);
      // Expect shape: { from?, to?, filters?, sort?, limit?, cursor? }
      const { page, total, nextCursor, prevCursor } = queryLedgerPaged(query);
      await delay(120);
      return json({
        events: page,
        count: page.length,
        total,
        nextCursor,
        prevCursor,
      });
    }
  
    if (url.startsWith("/api/ledger/events") && method === "POST") {
      const ev = await readJson(req);
      const saved = appendEvent(ev);
      await delay(80);
      return json(saved, 201);
    }
  
    if (url.startsWith("/api/ledger/rollup") && method === "GET") {
      await delay(80);
      return json(rollup());
    }
  
    return json({ error: "Not found" }, 404);
  }
  
  /* ------------------------ Ledger store ------------------------ */
  
  const KEY = "ledger:events:v1";
  
  function readAll() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  function saveAll(all) {
    try {
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch {}
  }
  
  /** Keep shape consistent with your client: { from?, to?, filters?, sort? } */
  function queryLedger(query = {}) {
    const all = readAll();
    const { from, to, filters, sort } = query;
  
    // date range
    const inRange = (ev) => {
      if (!from && !to) return true;
      const ts = new Date(ev.ts || ev.date || ev.createdAt || 0).toISOString();
      if (from && ts < new Date(from).toISOString()) return false;
      if (to && ts > new Date(to).toISOString()) return false;
      return true;
    };
  
    // filters (exact match; arrays must include)
    const passesFilters = (ev) => {
      if (!filters || typeof filters !== "object") return true;
      for (const [k, v] of Object.entries(filters)) {
        if (v == null) continue;
  
        // Ignore derived keys from UI
        if (k === "_from" || k === "_to") continue;
  
        if (Array.isArray(v)) {
          if (!Array.isArray(ev[k])) return false;
          for (const item of v) if (!ev[k]?.includes(item)) return false;
        } else {
          if (ev[k] !== v) return false;
        }
      }
      return true;
    };
  
    let out = all.filter((ev) => inRange(ev) && passesFilters(ev));
  
    // sort: { key, dir: 'asc'|'desc' }
    if (sort && sort.key) {
      const dir = sort.dir === "asc" ? 1 : -1;
      const key = sort.key;
      out = [...out].sort((a, b) => {
        const va = a[key];
        const vb = b[key];
        // numeric/string/date-friendly compare
        if (va == null && vb == null) return 0;
        if (va == null) return -1 * dir;
        if (vb == null) return 1 * dir;
  
        // try date compare if key is ts/date-like
        if (key === "ts" || key === "date" || /date/i.test(key)) {
          const da = new Date(va).getTime();
          const db = new Date(vb).getTime();
          return (da - db) * dir;
        }
  
        if (typeof va === "number" && typeof vb === "number") {
          return (va - vb) * dir;
        }
        return String(va).localeCompare(String(vb)) * dir;
      });
    }
  
    return out;
  }
  
  /* ---------- Pagination (cursor) on top of queryLedger ---------- */
  
  function queryLedgerPaged(query = {}) {
    const DEF_LIMIT = 25;
    const MAX_LIMIT = 200;
  
    const all = queryLedger(query); // already filtered/sorted
    const total = all.length;
  
    const limitRaw =
      query.limit != null ? Number(query.limit) : DEF_LIMIT;
    const limit = Math.max(1, Math.min(MAX_LIMIT, isNaN(limitRaw) ? DEF_LIMIT : limitRaw));
  
    // cursor is an opaque base64 of { o: offset }
    const start = Math.max(0, decodeCursor(query.cursor)?.o ?? 0);
    const end = Math.min(total, start + limit);
  
    const page = all.slice(start, end);
  
    const nextCursor = end < total ? encodeCursor({ o: end }) : null;
    const prevCursor = start > 0 ? encodeCursor({ o: Math.max(0, start - limit) }) : null;
  
    return { page, total, nextCursor, prevCursor };
  }
  
  function encodeCursor(obj) {
    try {
      return btoa(JSON.stringify(obj));
    } catch {
      return null;
    }
  }
  function decodeCursor(cur) {
    if (!cur || typeof cur !== "string") return null;
    try {
      return JSON.parse(atob(cur));
    } catch {
      return null;
    }
  }
  
  function appendEvent(ev) {
    const now = new Date().toISOString();
    const withDefaults = {
      id: ev?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: ev?.ts || now,
      tags: Array.isArray(ev?.tags) ? ev.tags : [],
      meta: ev?.meta || {},
      proof: ev?.proof || { batchId: null, rootHash: null },
      impact_tag: ev?.impact_tag ?? null,
      actorId: ev?.actorId ?? "",
      app: ev?.app ?? "",
      type: ev?.type ?? "",
      amount: typeof ev?.amount === "number" ? ev.amount : 0,
      ...ev,
    };
  
    const all = readAll();
    if (!all.find((e) => e.id === withDefaults.id)) {
      all.push(withDefaults);
      saveAll(all);
    }
    return withDefaults;
  }
  
  function rollup() {
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
  
  /* ------------------------ Credit store ------------------------ */
  
  const CREDIT_KEY = "mock:credit";
  function getCreditState() {
    try {
      const raw = localStorage.getItem(CREDIT_KEY);
      return raw ? JSON.parse(raw) : { credit: 0, updatedAt: null };
    } catch {
      return { credit: 0, updatedAt: null };
    }
  }
  function setCreditState(credit) {
    const state = { credit, updatedAt: new Date().toISOString() };
    try {
      localStorage.setItem(CREDIT_KEY, JSON.stringify(state));
    } catch {}
    return state;
  }
  
  /* -------------------------- Utils -------------------------- */
  
  function normalizeRequest(input, init) {
    if (typeof input === "string") {
      return {
        url: input,
        method: (init?.method || "GET").toUpperCase(),
        headers: init?.headers,
        body: init?.body,
      };
    }
    // Request object
    return {
      url: input.url,
      method: (input.method || "GET").toUpperCase(),
      headers: input.headers,
      body: input.body,
    };
  }
  
  /**
   * Supports:
   *  - ?from=&to=
   *  - ?filters=<JSON>&sort=<JSON>
   *  - ?query=<JSON> (full object { from,to,filters,sort,limit,cursor })
   *  - ?limit=25
   *  - ?cursor=<opaque>
   */
  function parseQuery(url) {
    const u = new URL(url, location.origin);
    const q = u.searchParams.get("q"); // optional single-string query (not used in mock, but preserved)
    const from = u.searchParams.get("from") || undefined;
    const to = u.searchParams.get("to") || undefined;
    const limit = u.searchParams.get("limit");
  
    let filters, sort;
    const f = u.searchParams.get("filters");
    const s = u.searchParams.get("sort");
    try { if (f) filters = JSON.parse(f); } catch {}
    try { if (s) sort = JSON.parse(s); } catch {}
  
    let queryObj;
    const queryParam = u.searchParams.get("query");
    if (queryParam) {
      try { queryObj = JSON.parse(queryParam); } catch {}
    }
  
    // cursor is opaque; pass it through
    const cursor = u.searchParams.get("cursor") || undefined;
  
    // precedence: full query > discrete params
    return queryObj || { from, to, filters, sort, q, limit, cursor };
  }
  
  async function readJson(req) {
    if (!req.body) return {};
    try {
      if (typeof req.body === "string") {
        return JSON.parse(req.body || "{}");
      }
      const text = await req.body?.text?.();
      return text ? JSON.parse(text) : {};
    } catch {
      return {};
    }
  }
  
  function json(data, status = 200, headers = {}) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", ...headers },
    });
  }
  
  function delay(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
  