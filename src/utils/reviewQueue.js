// src/utils/reviewQueue.js
import { readJSON, safeSet } from "@/utils/storage.js";

const KEY = "rq.items";

// append an item { id, at, meta }
export function enqueue(item){
  const cur = readJSON(KEY, []);
  cur.push(item);
  safeSet(KEY, cur);
}

// simple getters
export function all(){ return readJSON(KEY, []); }
export function clear(){ safeSet(KEY, []); }

// naive “due” logic (stub for now)
export function due(){
  const now = Date.now();
  const items = readJSON(KEY, []);
  return items.filter(x => now - x.at > 60_000); // due after 1 min (demo)
}
