// src/panic/panic.js
(function () {
    const APP = (document.querySelector("[data-app]")?.dataset?.app) || "unknown";
    const banner = document.createElement("div");
    banner.id = "PANIC_BANNER";
    banner.innerHTML = `🚨 PANIC MODE — <b>${APP}</b> <small>(html+js loaded)</small>`;
    document.addEventListener("DOMContentLoaded", () => document.body.appendChild(banner), {once:true});
  
    // Live error well
    const well = document.createElement("div"); well.id = "PANIC_ERRORS";
    const push = (msg) => { well.textContent += msg + "\n"; if (!well.isConnected) document.body.appendChild(well); };
    window.addEventListener("error", (e) => push(`❌ ${e.message}\n  at ${e.filename}:${e.lineno}:${e.colno}`));
    window.addEventListener("unhandledrejection", (e) => push(`❌ UnhandledRejection: ${e.reason?.message || e.reason}`));
  
    // Quick environment breadcrumb
    console.log("[PANIC] APP =", APP, "ENV =", import.meta.env);
  })();
  