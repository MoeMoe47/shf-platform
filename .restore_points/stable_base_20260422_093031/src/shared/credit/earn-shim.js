// src/shared/credit/earn-shim.js
// Minimal shim: persist a running points total and broadcast events

export function earn({ kind = "event", points = 0, meta = {} } = {}) {
  try {
    const key = "rewards:points";
    const prev = Number(localStorage.getItem(key) || 0);
    const add = Number(points || 0);
    const next = prev + add;

    localStorage.setItem(key, String(next));

    // optional: append to a simple history log
    const hKey = "rewards:history";
    const hist = JSON.parse(localStorage.getItem(hKey) || "[]");
    hist.push({ at: Date.now(), kind, points: add, meta, total: next });
    localStorage.setItem(hKey, JSON.stringify(hist));

    // Cross-tab update
    try { window.dispatchEvent(new StorageEvent("storage", { key, newValue: String(next) })); } catch {}

    // Same-tab updates:
    // - generic "rewards:update" for dumb listeners (bump UI)
    // - "rewards:earned" carries details so a toast can show "+5 Points Earned!"
    window.dispatchEvent(new Event("rewards:update"));
    window.dispatchEvent(new CustomEvent("rewards:earned", {
      detail: { points: add, total: next, kind, meta }
    }));

    // console.debug("[earn-shim] +%d (%s)", add, kind, meta);
  } catch {}
}

export default earn;
