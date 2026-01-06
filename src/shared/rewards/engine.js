import { appScope } from "@/shared/appScope.js";
import { nsStorage } from "@/utils/storage.js";
import { loadCatalog } from "./catalog.js";

export function getBadges(app = appScope()) { return loadCatalog(app).badges || []; }
export function getBadge(id, app = appScope()) { return getBadges(app).find(b => b.id === id) || null; }
export function isUnlocked(id, history = [], app = appScope()) {
  const b = getBadge(id, app);
  if (!b) return false;
  return typeof b.rule === "function" ? !!b.rule({ app, badge: b, history }) : !!b.unlocked;
}
export function award(event, app = appScope()) {
  const key = `rewards:history`;
  const list = nsStorage.get(key, app) || [];
  const entry = { ts: Date.now(), app, ...event };
  list.push(entry);
  nsStorage.set(key, list, app);
  try { window.dispatchEvent(new CustomEvent(`${app}:rewards:update`, { detail: { app } })); } catch {}
  try { window.dispatchEvent(new CustomEvent("rewards:update", { detail: { app } })); } catch {}
  return entry;
}
export function getHistory(app = appScope()) { return nsStorage.get("rewards:history", app) || []; }

(function migrate(){ try{
  const legacy = localStorage.getItem("rewards:history"); if(!legacy) return;
  const events = JSON.parse(legacy); const buckets = {};
  for (const e of events) { const a = e.app || appScope(); (buckets[a] ||= []).push({ ...e, app: a }); }
  for (const a in buckets) nsStorage.set("rewards:history", buckets[a], a);
} catch {} })();
