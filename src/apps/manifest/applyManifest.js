import { loadManifest } from "./index.js";
import { computeCapabilityFlags } from "./appCapabilities.js";

function setClass(el, cls, on) {
  if (!el) return;
  if (on) el.classList.add(cls);
  else el.classList.remove(cls);
}

export function applyManifest(appId) {
  const m = loadManifest(appId);
  if (!m) throw new Error(`[manifest] loadManifest("${appId}") returned null/undefined`);

  // 🔒 Contract must be explicit (no silent defaults)
  if (m.contractVersion == null) {
    throw new Error(`[manifest] "${m.id || appId}" missing required "contractVersion"`);
  }

  // ✅ Manifest is the source of truth for id
  const id = String(m.id || appId).trim();

  const caps = computeCapabilityFlags(id, m);

  const docEl = document.documentElement;
  docEl.dataset.app = id;
  docEl.dataset.contractVersion = String(m.contractVersion);

  setClass(docEl, "cap-map", !!caps.map);
  setClass(docEl, "cap-ledger", !!caps.ledger);
  setClass(docEl, "cap-analytics", !!caps.analytics);
  setClass(docEl, "cap-payments", !!caps.payments);

  const appObj = {
    id,
    manifest: m,
    caps,
    contractVersion: m.contractVersion
  };

  // Keep global (useful), but define it cleanly
  try {
    Object.defineProperty(window, "__APP__", {
      value: appObj,
      writable: true,
      configurable: true
    });
  } catch {
    window.__APP__ = appObj;
  }

  if (typeof console !== "undefined") {
    console.log("[manifest] applied", { appId: id, caps, contractVersion: m.contractVersion });
  }

  return appObj;
}
