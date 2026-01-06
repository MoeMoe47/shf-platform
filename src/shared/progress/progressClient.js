import { appendEvent } from "@/shared/ledger/ledgerClient.js";

const PKEY = "progress:records:v1";

export function markLessonComplete({ actorId, curriculum, slug }) {
  const rec = { actorId, curriculum, slug, ts: new Date().toISOString() };
  const all = readAll();
  all.push(rec);
  saveAll(all);

  appendEvent({
    actorId,
    app: "curriculum",
    type: "progress",
    amount: 0,
    tags: ["lesson.completed", curriculum],
    meta: { curriculum, slug },
  });
  return rec;
}

export function getProgress(actorId) {
  return readAll().filter(r => r.actorId === actorId);
}

function readAll(){
  try { return JSON.parse(localStorage.getItem(PKEY) || "[]"); } catch { return []; }
}
function saveAll(all){
  try { localStorage.setItem(PKEY, JSON.stringify(all)); } catch {}
}

/* ---------- External Course Helpers (added by SHF Partner Layer) ---------- */

/** Seed a pending record for an external course launch */
export function seedExternal({ userId, courseId }) {
  try {
    const key = getProgressKey(userId, courseId);
    const cur = JSON.parse(localStorage.getItem(key) || "{}");
    const next = {
      status: "pending_proof",
      pct: cur.pct || 0,
      lastLessonId: cur.lastLessonId || null,
      updatedAt: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(next));
    return next;
  } catch (e) {
    console.error("seedExternal error", e);
    return null;
  }
}

/** Mark an external course complete after verification */
export function completeExternal({ userId, courseId }) {
  try {
    const key = getProgressKey(userId, courseId);
    const cur = JSON.parse(localStorage.getItem(key) || "{}");
    const next = { ...cur, status: "complete", pct: 100, updatedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(next));
    return next;
  } catch (e) {
    console.error("completeExternal error", e);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
