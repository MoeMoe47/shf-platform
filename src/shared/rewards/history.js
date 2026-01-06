// src/shared/rewards/history.js
export const HISTORY_KEY = "wallet:history";
const MAX_ENTRIES = 250;

export function readJSON(k, d){
  try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); }
  catch { return d; }
}
export function saveJSON(k, v){
  try {
    localStorage.setItem(k, JSON.stringify(v));
    // nudge listeners
    try { window.dispatchEvent(new StorageEvent("storage", { key: k, newValue: "updated" })); } catch {}
  } catch {}
}

/**
 * logWallet({ note, delta, meta })
 * - Appends a wallet history entry and caps to last 250
 * - { note: string, delta: number, meta?: object }
 */
export function logWallet({ note = "", delta = 0, meta = null } = {}){
  const now = Date.now();
  const entry = { at: now, note: String(note || ""), delta: Number(delta || 0), meta: meta ?? undefined };
  const arr = readJSON(HISTORY_KEY, []);
  const next = [...arr, entry].slice(-MAX_ENTRIES);
  saveJSON(HISTORY_KEY, next);
  return entry;
}
