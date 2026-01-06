import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";

/**
 * Keep this file stateless. No app-specific global singletons here.
 * It just mounts a given Routes component with a router + fallback.
 * If you need app-specific providers, pass them via the `wrap` arg below.
 */

export function bootApp(RoutesComponent, wrap) {
  const mount =
    document.getElementById("app") ||
    (() => {
      const el = document.createElement("div");
      el.id = "root";
      document.body.appendChild(el);
      return el;
    })();

  const appTree = (
    <HashRouter>
      <Suspense fallback={<div className="skeleton pad">Loading…</div>}>
        <RoutesComponent />
      </Suspense>
    </HashRouter>
  );

  // Optional: allow per-app provider wrappers
  const tree = typeof wrap === "function" ? wrap(appTree) : appTree;

  createRoot(mount).render(tree);
}

// --- SHF Integrations metrics wiring (safe to include multiple times) ---
import { bump } from "@/shared/integrations/metricsClient.js";

window.addEventListener("shf:li:share", ()=>bump("li_share", { provider:"linkedin" }), { once:false });
window.addEventListener("shf:apply", (e)=>bump("apply", { provider:(e.detail||{}).provider }), { once:false });

// simulate a connect metric after OAuth completes server-side.
// For now, expose a debug trigger:
window.shfMarkLinkedInConnected = () => bump("li_connect", { provider:"linkedin" });
console.debug("[SHF] Integrations wiring ready. Call window.shfMarkLinkedInConnected() after OAuth.");
// -------------------------------------------------------------------------
