/**
 * Usage:
 *   import { queueEvent } from "@/shared/sync/syncQueue.js";
 *   queueEvent("/api/analytics", { name:"civic.lesson.view", id });
 *
 * Stores events offline in caches (works w/ SW) and tries to flush on 'online'.
 */
const QUEUE_CACHE = "sh-sync-queue";
const KEY = "/__queue__";

export async function queueEvent(url, body){
  try{
    if (navigator.onLine) {
      // try direct first
      await fetch(url, { method:"POST", headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      return;
    }
  }catch{}
  try{
    const cache = await caches.open(QUEUE_CACHE);
    const hit = await cache.match(KEY);
    const data = hit ? await hit.json() : {events:[]};
    data.events.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, url, body });
    await cache.put(KEY, new Response(JSON.stringify(data), {headers:{'Content-Type':'application/json'}}));
    // Ask SW to sync if available
    const reg = await navigator.serviceWorker.getRegistration();
    await reg?.sync?.register?.("sh-sync-queue");
  }catch{}
}
