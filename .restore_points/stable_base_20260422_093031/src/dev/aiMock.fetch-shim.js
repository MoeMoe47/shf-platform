/* Browser-only fetch shim for /api/mock/* so you don’t need a Node server running */
import { pulses, jobClock, aiScore, tickerItems } from "./aiCompass.mock.js";

const ok = (data) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

const origFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input?.url;

  try {
    if (url?.includes("/api/mock/pulses"))     return ok(pulses);
    if (url?.includes("/api/mock/job-clock"))  return ok(jobClock);
    if (url?.includes("/api/mock/ticker"))     return ok({ items: tickerItems });

    if (url?.includes("/api/mock/ai-score")) {
      // read body just to mirror a real POST
      try { await (typeof input !== "string" ? input?.text?.() : null); } catch {}
      return ok(aiScore({}));
    }
  } catch (e) {
    console.warn("[aiMock] error in shim:", e);
  }

  return origFetch(input, init);
};

console.info("[aiMock] installed fetch shim for /api/mock/*");
