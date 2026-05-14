import "@/styles/tesla-apple.css";

// SHF_PANIC_ADMIN_ONLY
const __SHF_PANIC_ENABLED__ = (() => {
  try {
    const byPath = String(window?.location?.pathname || "").includes("admin");
    const byHtml = String(window?.location?.href || "").includes("admin.html");
    const byAttr = String(document?.querySelector("[data-app]")?.getAttribute("data-app") || "") === "admin";
    return !!(byPath || byHtml || byAttr);
  } catch {
    return false;
  }
})();
// safetyOverlay disabled
// src/boot.jsx
if (typeof window !== "undefined") {
  if (__SHF_PANIC_ENABLED__) window.addEventListener("error", e => {
    const msg = (e?.error?.stack || e?.message || String(e)).slice(0, 4000);
    const box = document.createElement("pre");
    box.style.cssText = "position:fixed;inset:auto 8px 8px 8px;max-height:40vh;overflow:auto;background:#111;color:#0f0;padding:12px;border-radius:8px;z-index:99999;font:12px/1.4 ui-monospace,monospace";
    box.textContent = "Window Error:\n" + msg;
    document.body.appendChild(box);
  });
  if (__SHF_PANIC_ENABLED__) window.addEventListener("unhandledrejection", e => {
    const msg = (e?.reason?.stack || e?.reason?.message || String(e?.reason)).slice(0, 4000);
    const box = document.createElement("pre");
    box.style.cssText = "position:fixed;inset:auto 8px 56px 8px;max-height:40vh;overflow:auto;background:#111;color:#ffb;padding:12px;border-radius:8px;z-index:99999;font:12px/1.4 ui-monospace,monospace";
    box.textContent = "Unhandled Rejection:\n" + msg;
    document.body.appendChild(box);
  });
}
// (disabled) import "./boot.integrations.js";