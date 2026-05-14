/**
 * aiMock.routes.js
 * Works with any shim: uses window.__aiMock.register if available,
 * otherwise installs a tiny fetch interceptor just for /api/mock/*.
 */
import { pulses, jobClock, tickerItems, aiScore } from "@/dev/aiCompass.mock.js";

function ensureRegister() {
  const g = window;
  g.__aiMock = g.__aiMock || { routes: new Map(), __shimInstalled: false };

  // If a shim already exposes register, use it.
  if (typeof g.__aiMock.register === "function") return g.__aiMock.register;

  // If no shim, install a minimal one.
  if (!g.__aiMock.__shimInstalled) {
    const routes = g.__aiMock.routes;
    const origFetch = g.fetch.bind(g);

    g.fetch = async (input, init = {}) => {
      try {
        const url = typeof input === "string" ? input : input?.url;
        const method = (init?.method || "GET").toUpperCase();
        const u = new URL(url, location.origin);

        if (u.pathname.startsWith("/api/mock/")) {
          const key = `${method} ${u.pathname}`;
          const handler = routes.get(key);
          if (!handler) {
            return new Response(
              JSON.stringify({ error: "no mock route", key }),
              { status: 404, headers: { "Content-Type": "application/json" } }
            );
          }
          const req = new Request(u.toString(), init);
          const data = await handler(req);
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      } catch (e) {
        // fall through to network
      }
      return origFetch(input, init);
    };

    g.__aiMock.__shimInstalled = true;
    console.log("[aiMock] lightweight /api/mock/* shim installed.");
  }

  g.__aiMock.register = (method, path, handler) => {
    g.__aiMock.routes.set(`${method.toUpperCase()} ${path}`, handler);
  };
  return g.__aiMock.register;
}

const register = ensureRegister();

/* ---- Declare your mock REST endpoints ---- */
register("GET",  "/api/mock/pulses",    () => pulses);
register("GET",  "/api/mock/job-clock", () => jobClock);
register("GET",  "/api/mock/ticker",    () => ({ items: tickerItems }));
register("POST", "/api/mock/ai-score",  async (req) => {
  let body = {};
  try { body = await req.json(); } catch {}
  return aiScore(body);
});

console.log("[aiMock] routes registered for /api/mock/*");
