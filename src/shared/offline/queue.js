// src/shared/offline/queue.js
const KEY = "sh:offline:queue";

/**
 * Enqueue an action to be synced when online or by SW.
 * Each item = { id, type, payload, ts }
 */
export function enqueue(type, payload) {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
    const entry = { id: `${type}-${Date.now()}`, type, payload, ts: Date.now() };
    arr.push(entry);
    localStorage.setItem(KEY, JSON.stringify(arr));
    window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: "update" }));
    return entry;
  } catch (err) {
    console.error("[queue] enqueue failed", err);
    return null;
  }
}

/**
 * Read current queue
 */
export function readQueue() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

/**
 * Pop processed items (by type or all)
 */
export function clearQueue(type) {
  try {
    const items = readQueue();
    const remaining = type ? items.filter(i => i.type !== type) : [];
    localStorage.setItem(KEY, JSON.stringify(remaining));
    window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: "update" }));
  } catch {}
}

/**
 * Try to flush queue when online (stubbed)
 */
export async function flushQueue() {
  const items = readQueue();
  if (!items.length) return 0;
  console.log("[queue] flushing", items.length);
  // simulate sending to server
  await new Promise(r => setTimeout(r, 500));
  clearQueue();
  return items.length;
}

// optional: auto-flush when online
try {
  window.addEventListener("online", () => flushQueue());
} catch {}
