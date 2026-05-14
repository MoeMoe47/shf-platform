/**
 * DEV-only network shim for /growth/*
 * - Intercepts BOTH window.fetch and XMLHttpRequest (covers axios too).
 * - Prevents Vite proxy -> 127.0.0.1:8000 ECONNREFUSED when backend isn't running.
 */
(function installGrowthMock() {
  try {
    // Only in dev
    // import.meta.env exists in Vite ESM modules; for safety also allow window.__VITE_DEV__
    const isDev = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV) || false;
    if (!isDev) return;

    if (window.__shf_growth_mock_installed__) return;
    window.__shf_growth_mock_installed__ = true;

    const nowIso = () => new Date().toISOString();

    const dashboard = () => ({
      ok: true,
      mode: "mock",
      ts: nowIso(),
      kpis: {
        signals: 19,
        attestations_24h: 11,
        mismatches: 0,
        last_export_utc: nowIso(),
      },
      agents: [
        { id: "watchtower", name: "Watchtower", streak: 7, rank: "A", score: 1320 },
        { id: "agent-alpha", name: "Agent Alpha", streak: 3, rank: "B", score: 820 },
        { id: "agent-beta", name: "Agent Beta", streak: 5, rank: "B", score: 910 },
      ],
    });

    const claims = () => ({
      ok: true,
      mode: "mock",
      ts: nowIso(),
      items: [
        { id: "c1", agentId: "watchtower", type: "SIGNAL", points: 15, intensity: 0.45, note: "New growth signal detected", ts: nowIso() },
        { id: "c2", agentId: "watchtower", type: "ATTESTED", points: 35, intensity: 0.80, note: "Attestation recorded", ts: nowIso() },
        { id: "c3", agentId: "agent-alpha", type: "WIN", points: 60, intensity: 0.95, note: "Alpha won a micro-game", ts: nowIso() },
      ],
    });

    function matchGrowth(url) {
      try {
        // axios sometimes passes full URL; normalize to path portion
        const u = new URL(url, window.location.origin);
        return u.pathname;
      } catch {
        return String(url || "");
      }
    }


    function isGrowthEndpoint(path, leaf) {
      // supports both legacy (/growth/*) and primary (/api/growth/*)
      return path === ("/growth/" + leaf) || path === ("/api/growth/" + leaf);
    }

    function makeJsonBody(obj) {
      return JSON.stringify(obj);
    }

    // -----------------------------
    // 1) fetch() interception
    // -----------------------------
    const origFetch = window.fetch ? window.fetch.bind(window) : null;

    if (origFetch) {
      window.fetch = async (input, init) => {
        const raw = typeof input === "string" ? input : (input && input.url) ? input.url : "";
        const path = matchGrowth(raw);

        if (isGrowthEndpoint(path, "dashboard")) {
          return new Response(makeJsonBody(dashboard()), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (isGrowthEndpoint(path, "claims")) {
          return new Response(makeJsonBody(claims()), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        return origFetch(input, init);
      };
    }

    // -----------------------------
    // 2) XMLHttpRequest interception (covers axios)
    // -----------------------------
    const XHR = window.XMLHttpRequest;
    if (XHR && XHR.prototype && XHR.prototype.open) {
      const origOpen = XHR.prototype.open;
      const origSend = XHR.prototype.send;

      XHR.prototype.open = function(method, url, async, user, password) {
        this.__shf_url = url;
        this.__shf_method = method;
        return origOpen.call(this, method, url, async, user, password);
      };

      XHR.prototype.send = function(body) {
        const path = matchGrowth(this.__shf_url);

        const respond = (obj) => {
          // emulate XHR readyState transitions
          try {
            this.readyState = 4;
            this.status = 200;
            this.responseText = makeJsonBody(obj);
            this.response = this.responseText;

            if (typeof this.onreadystatechange === "function") this.onreadystatechange();
            if (typeof this.onload === "function") this.onload();
          } catch (e) {
            // if we can't set props (readonly in some browsers), just fallback
          }
        };

        if (isGrowthEndpoint(path, "dashboard")) {
          respond(dashboard());
          return;
        }
        if (isGrowthEndpoint(path, "claims")) {
          respond(claims());
          return;
        }

        return origSend.call(this, body);
      };
    }

    console.log("[SHF] Growth mock shim installed (DEV) for fetch + XHR.");
  } catch (e) {
    console.warn("[SHF] Growth mock shim failed to install:", e);
  }
})();
