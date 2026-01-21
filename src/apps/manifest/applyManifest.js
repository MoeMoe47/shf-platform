import { loadManifest } from "./index.js";
import { computeCapabilityFlags } from "./appCapabilities.js";

function setClass(el, cls, on) {
  if (!el) return;
  if (on) el.classList.add(cls);
  else el.classList.remove(cls);
}

export function applyManifest(appId) {
  const m = loadManifest(appId);
  const caps = computeCapabilityFlags(appId, m);

  const docEl = document.documentElement;
  docEl.dataset.app = appId;
  docEl.dataset.contractVersion = String(m.contractVersion || 1);

  setClass(docEl, "cap-map", caps.map);
  setClass(docEl, "cap-ledger", caps.ledger);
  setClass(docEl, "cap-analytics", caps.analytics);
  setClass(docEl, "cap-payments", caps.payments);

  window.__APP__ = {
    id: appId,
    manifest: m,
    caps
  };

  if (typeof console !== "undefined") {
    console.log("[manifest] applied", { appId, caps, contractVersion: m.contractVersion });
  }

  return window.__APP__;
}
