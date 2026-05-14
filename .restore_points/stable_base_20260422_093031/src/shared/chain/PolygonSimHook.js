// src/shared/chain/PolygonSimHook.js
(() => {
  if (typeof window === "undefined" || window.__polySim) return;
  window.__polySim = true;
  window.addEventListener("polygon:simulate:tx", (e) => {
    const d = e?.detail || {};
    console.log("[Polygon:simulate]", d.op, d.payload);
    window.shToast?.("⛓️ Polygon log (simulate)");
  });
})();
