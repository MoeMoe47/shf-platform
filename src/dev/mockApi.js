// --- ensure __mockApi exists before registering routes ---
(function ensureMockApi(){
  if (window.__mockApi?.register) return;

  const routes = [];
  function matchRoute(method, url) {
    const u = new URL(url, location.origin);
    return routes.find(r => r.method === method && r.path === u.pathname);
  }

  window.__mockApi = {
    routes,
    register(method, path, handler) {
      routes.push({ method: method.toUpperCase(), path, handler });
    },
  };

  const _fetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const method = (init?.method || "GET").toUpperCase();
    const url = typeof input === "string" ? input : input.url;
    const hit = matchRoute(method, url);
    if (hit) return hit.handler(new Request(url, init));
    return _fetch(input, init);
  };

  if (!window.__mockApi.__logged__) { if (!window.__mockApi.__logged__) { console.log("[mockApi] minimal router shim installed"); window.__mockApi.__logged__=true; } window.__mockApi.__logged__=true; }
})();

import { pulses, jobClock, aiScore, tickerItems } from './aiCompass.mock.js';
// src/dev/mockApi.js
// -------------------------------------------------------------
// DEV-only fetch shim so the app runs without a backend.
// Loaded by your entries via:
//   if (import.meta.env.DEV) { await import("@/dev/mockApi.js"); }
// -------------------------------------------------------------

if (typeof window !== "undefined" && !window.__DEV_API_SHIM__) {
  window.__DEV_API_SHIM__ = true;

  const realFetch = window.fetch.bind(window);

  const ok = (data, init = {}) =>
    new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
      ...init,
    });

  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input?.url ?? "";

    try {
      // ---------- Common auth/me ----------
      if (url.startsWith("/api/me")) {
        return ok({
          id: "dev-user",
          name: "Dev User",
          email: "dev@example.com",
          plan: "pro",
          roles: ["student"],

          // Make subscription guards pass in dev
          isSubscribed: true,
          subscription: { status: "active", plan: "pro", trial: false },

          // Keep everything unlocked so pages render
          entitlements: {
            curriculum: true,
            assignments: true,
            calendar: true,
            portfolio: true,
            career: true,
            arcade: true,
            debt: true,
            employer: true,
            sales: true,
          },

          // Optional feature flags your UI might read
          features: { aiCoach: true },
        });
      }

      // ---------- Curriculum (ASL) stubs ----------
      if (url.startsWith("/api/merged/asl/index")) {
        return ok({
          catalog: [
            { slug: "asl-1-foundations", title: "ASL 1: Foundations" },
            { slug: "asl-2-conversations", title: "ASL 2: Conversations" },
          ],
        });
      }

      if (url.startsWith("/api/merged/asl/asl-1-foundations")) {
        return ok({
          slug: "asl-1-foundations",
          title: "ASL 1: Foundations",
          units: [
            {
              slug: "u1",
              title: "Unit 1",
              lessons: [
                { slug: "l1", title: "Fingerspelling Basics" },
                { slug: "l2", title: "Greetings" },
              ],
            },
          ],
        });
      }

      if (url.startsWith("/api/merged/asl/student.asl-01")) {
        return ok({
          course: "asl-1-foundations",
          progress: { completed: ["l1"], current: "l2" },
        });
      }

      // Fall through to real network for anything else.
      return realFetch(input, init);
    } catch (err) {
      console.warn("[mockApi] error in mock fetch; falling back to real fetch", err);
      return realFetch(input, init);
    }
  };

  console.info("[mockApi] DEV fetch shim installed.");
}
/* === CREDIT VERIFY MOCKS ================================================
   Append this block to the end of: src/dev/mockApi.js
   If the file doesn't exist, you can use this whole snippet as the file.
   It installs an idempotent fetch interceptor and only handles the routes
   below; everything else passes through to the real network.
======================================================================== */

(() => {
  if (typeof window === "undefined") return;

  const KEY = "__DEV_MOCK_API__";

  // Install (or reuse) a tiny fetch mock harness
  const api =
    window[KEY] ||
    (() => {
      const handlers = [];
      const origFetch = window.fetch.bind(window);

      const matchPath = (matcher, pathname) =>
        typeof matcher === "string"
          ? pathname.startsWith(matcher)
          : matcher instanceof RegExp
            ? matcher.test(pathname)
            : false;

      async function dispatch(req) {
        const url = new URL(req.url, location.origin);
        const method = req.method.toUpperCase();

        for (const h of handlers) {
          if (h.method && h.method !== method) continue;
          if (!matchPath(h.matcher, url.pathname)) continue;

          try {
            const res = await h.handler({ req, url, pathname: url.pathname });
            if (res instanceof Response) return res;
            return json(res);
          } catch (e) {
            console.error("[mockApi] handler error:", e);
            return json({ ok: false, error: e?.message || String(e) }, 500);
          }
        }
        // No handler matched → real network
        return origFetch(req);
      }

      // Replace global fetch (idempotent inside this block)
      window.fetch = (input, init) => dispatch(new Request(input, init));

      function add(method, matcher, handler) {
        handlers.push({ method: method.toUpperCase(), matcher, handler });
      }

      function json(obj, status = 200) {
        return new Response(JSON.stringify(obj), {
          status,
          headers: { "Content-Type": "application/json" },
        });
      }

      const api = { add, json, handlers, origFetch };
      window[KEY] = api;
      console.info("[mockApi] installed fetch interceptor");
      return api;
    })();

  const { add, json } = api;

  /* ---------------- Sample data (mirrors Verifier.jsx) ---------------- */
  const SAMPLE = [
    {
      id: "case-001",
      token: "ver_001_7QX9",
      queryIndex: [
        "mike slate",
        "michael slate",
        "mikeslate@example.com",
        "415-555-9312",
        "last4=1111",
        "acct:FCB-1234",
        "report:EXP-2024-09-18-7782",
      ],
      consumer: {
        firstName: "Mike",
        lastName: "Slate",
        dob: "1989-07-21",
        ssn4: "1111",
      },
      addresses: [
        { line1: "44 Ocean Ave", city: "San Francisco", state: "CA", zip: "94110", status: "current" },
        { line1: "12 3rd St", city: "Oakland", state: "CA", zip: "94607", status: "previous" },
      ],
      bureaus: { experian: true, equifax: true, transunion: true },
      accounts: [
        { furnisher: "First City Bank", account: "FCB-1234", type: "Credit Card", status: "open" },
        { furnisher: "Riverstone Apartments", account: "RS-221", type: "Rental", status: "closed" },
      ],
      confidence: 0.94,
      notes: ["DOB + SSN(4) matched", "Current address matched", "Recent inquiry from FCB (08/2024)"],
    },
    {
      id: "case-002",
      token: "ver_002_3MJU",
      queryIndex: ["alex taylor", "alext@example.com", "206-555-1002", "last4=6677", "acct:SLM-440"],
      consumer: { firstName: "Alex", lastName: "Taylor", dob: "1995-03-12", ssn4: "6677" },
      addresses: [{ line1: "908 Lakeview Dr", city: "Seattle", state: "WA", zip: "98101", status: "current" }],
      bureaus: { experian: true, equifax: false, transunion: true },
      accounts: [{ furnisher: "SkyLink Mobile", account: "SLM-440", type: "Telecom", status: "open" }],
      confidence: 0.81,
      notes: ["DOB matched", "TransUnion present; Equifax missing recent file"],
    },
  ];

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  function normalize(r) {
    // Shape as { ok:true, result:{...} } for Verifier.jsx
    return {
      ok: true,
      result: {
        id: r.id || "case-local",
        token: r.token || "ver_LOCAL",
        queryIndex: r.queryIndex || [],
        consumer: r.consumer || {},
        addresses: r.addresses || [],
        bureaus: r.bureaus || { experian: false, equifax: false, transunion: false },
        accounts: r.accounts || [],
        confidence: typeof r.confidence === "number" ? r.confidence : 0.75,
        notes: r.notes || [],
      },
    };
  }

  /* ------------------------ GET /api/credit/verify ------------------------ */
  add("GET", "/api/credit/verify", async ({ url }) => {
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();
    if (!q) return json({ ok: false, error: "missing q" }, 400);

    // fuzzy includes match against queryIndex
    const hit = SAMPLE.find((r) => (r.queryIndex || []).some((s) => s.toLowerCase().includes(q)));
    await delay(200);
    if (!hit) return json({ ok: false, error: "no match" }, 404);
    return normalize(hit);
  });

  /* ----------------------- POST /api/credit/verify ------------------------ */
  add("POST", "/api/credit/verify", async ({ req }) => {
    let body = {};
    try {
      body = await req.clone().json();
    } catch {
      return json({ ok: false, error: "invalid JSON" }, 400);
    }

    const payload = body?.payload || body; // accept either shape
    const fn = (payload.firstName || "").toLowerCase();
    const ln = (payload.lastName || "").toLowerCase();
    const dob = payload.dob || "";
    const ssn4 = payload.ssn4 || "";

    const hit = SAMPLE.find(
      (r) =>
        r.consumer?.firstName?.toLowerCase() === fn &&
        r.consumer?.lastName?.toLowerCase() === ln &&
        r.consumer?.dob === dob &&
        r.consumer?.ssn4 === ssn4
    );

    await delay(280);
    if (!hit) return json({ ok: false, error: "no structured match" }, 404);
    return normalize(hit);
  });

  console.info("[mockApi] credit verify routes ready → GET/POST /api/credit/verify");
})();


/* AI_MOCK_ROUTES_WRAPPED: server-only guard */
if (typeof window === 'undefined' && typeof app !== 'undefined') {
app.get('/api/mock/pulses', (req, res) => res.json(pulses));
app.get('/api/mock/job-clock', (req, res) => res.json(jobClock));
app.get('/api/mock/ticker', (req, res) => res.json({ items: tickerItems }));
app.post('/api/mock/ai-score', async (req, res) => {
  try {
    const chunks = [];
    for await (const ch of req) chunks.push(ch);
    const body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
    return res.json(aiScore(body));
  } catch { return res.json(aiScore({})); }
});

}

// ---- Sales lead sync + pitch-pack (mock) ----

/* ---------------- Employer ↔ Sales mocks (under /__mock to avoid dev proxy) ------------------ */
(function(){
  // Install the minimal router shim once (idempotent)
  if (!window.__mockApi || !window.__mockApi.__ready__) {
    const routes = [];
    window.__mockApi = window.__mockApi || {};
    window.__mockApi.routes = routes;
    window.__mockApi.register = function(method, path, handler) {
      routes.push({ method: (method || "GET").toUpperCase(), path, handler });
    };
    window.__mockApi.__ready__ = true;

    function matchRoute(method, url) {
      try {
        const u = new URL(url, location.origin);
        const path = u.pathname;
        return routes.find(r => r.method === method && path.startsWith(r.path));
      } catch { return null; }
    }

    const _fetch = window.fetch.bind(window);
    window.fetch = async (input, init = {}) => {
      const method = (init?.method || "GET").toUpperCase();
      const url = typeof input === "string" ? input : input.url;
      const hit = matchRoute(method, url);
      if (hit) return hit.handler(new Request(url, init));
      return _fetch(input, init);
    };

    if (!window.__mockApi.__logged__) { if (!window.__mockApi.__logged__) { console.log("[mockApi] minimal router shim installed"); window.__mockApi.__logged__=true; } window.__mockApi.__logged__=true; }
  }

  try {
    // POST /__mock/api/sales/lead-sync → { ok: true }
    window.__mockApi.register("POST", "/__mock/api/sales/lead-sync", async (req) => {
      try { await req.json(); } catch {}
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    });

    // GET /__mock/api/sales/pitch-pack?pathway=&wage=&hours=&programIds=...
    window.__mockApi.register("GET", "/__mock/api/sales/pitch-pack", async (req) => {
      const url = new URL(req.url);
      const pathway = url.searchParams.get("pathway") || "tech";
      const wage = Number(url.searchParams.get("wage") || 16);
      const hours = Number(url.searchParams.get("hours") || 120);
      const programIds = (url.searchParams.get("programIds") || "").split(",").filter(Boolean);

      // Use absolute path so Vite can resolve it in-browser
      const mod = await import(/* @vite-ignore */ "/src/shared/sales/pitchPack.js");
      const pack = mod.buildPitchPack({ pathway, wage, hours, programIds });

      return new Response(JSON.stringify(pack), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    });

    console.log("[mockApi] sales routes ready → POST /__mock/api/sales/lead-sync, GET /__mock/api/sales/pitch-pack");
  } catch (e) {
    console.warn("[mockApi] sales routes init failed", e);
  }
})();
