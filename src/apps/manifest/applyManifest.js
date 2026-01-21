import { loadManifest } from "./index.js";
import { computeCapabilityFlags } from "./appCapabilities.js";
import { resolveAppEnabledWithSource, hasAnyOverride } from "./overrides.js";

function setClass(el, cls, on) {
  if (!el) return;
  if (on) el.classList.add(cls);
  else el.classList.remove(cls);
}

function ensureDemoBadge(on) {
  if (typeof document === "undefined") return;

  const id = "shf-demo-badge";
  const existing = document.getElementById(id);

  if (!on) {
    if (existing) existing.remove();
    return;
  }

  if (existing) return;

  const el = document.createElement("div");
  el.id = id;
  el.textContent = "Demo Mode — runtime overrides active";
  el.setAttribute("role", "status");
  el.style.position = "fixed";
  el.style.right = "12px";
  el.style.bottom = "12px";
  el.style.zIndex = "999999";
  el.style.padding = "8px 10px";
  el.style.borderRadius = "999px";
  el.style.border = "1px solid rgba(255,255,255,.18)";
  el.style.background = "rgba(0,0,0,.55)";
  el.style.backdropFilter = "blur(8px)";
  el.style.webkitBackdropFilter = "blur(8px)";
  el.style.color = "rgba(255,255,255,.92)";
  el.style.fontSize = "12px";
  el.style.letterSpacing = ".02em";
  el.style.boxShadow = "0 10px 28px rgba(0,0,0,.28)";
  el.style.pointerEvents = "none";

  document.body.appendChild(el);
}

export function applyManifest(appId) {
  const m = loadManifest(appId);
  const caps = computeCapabilityFlags(appId, m);

  // Enabled resolution + source (session/persisted/manifest/default)
  const enabledInfo = resolveAppEnabledWithSource(appId, m);
  const enabled = enabledInfo.enabled;
  const enabledSource = enabledInfo.source;

  const docEl = document.documentElement;

  // Required / foundational signals
  docEl.dataset.app = appId;
  docEl.dataset.contractVersion = String(m.contractVersion);
  docEl.dataset.appEnabled = String(enabled);
  docEl.dataset.appEnabledSource = String(enabledSource);

  // Capability classes (CSS can key off these)
  setClass(docEl, "cap-map", caps.map);
  setClass(docEl, "cap-ledger", caps.ledger);
  setClass(docEl, "cap-analytics", caps.analytics);
  setClass(docEl, "cap-payments", caps.payments);

  // Optional "disabled" class for global styling if you want it
  setClass(docEl, "app-disabled", !enabled);

  // Demo flag (any runtime override anywhere)
  const demoOn = hasAnyOverride();
  docEl.dataset.demo = demoOn ? "true" : "false";
  ensureDemoBadge(demoOn);

  // Global object (stable integration point)
  const appObj = {
    id: appId,
    manifest: m,
    caps,
    enabled,
    enabledSource,
    demo: demoOn
  };

  try {
    Object.defineProperty(window, "__APP__", {
      value: appObj,
      writable: false,
      enumerable: true,
      configurable: true
    });
  } catch {
    window.__APP__ = appObj;
  }

  // 🔔 Event emission (observable platform signal)
  try {
    window.dispatchEvent(
      new CustomEvent("shf:app-state", {
        detail: {
          appId,
          enabled,
          source: enabledSource,
          caps,
          contractVersion: m.contractVersion,
          demo: demoOn
        }
      })
    );
  } catch {}

  if (typeof console !== "undefined") {
    console.log("[manifest] applied", {
      appId,
      enabled,
      source: enabledSource,
      caps,
      contractVersion: m.contractVersion,
      demo: demoOn
    });
  }

  return appObj;
}
