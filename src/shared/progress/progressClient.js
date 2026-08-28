import { appendEvent } from "../ledger/ledgerClient.js";
import {
  buildLessonCompletedOperationalEvent,
  buildAssessmentSubmittedOperationalEvent,
  buildAssessmentCompletedOperationalEvent,
  buildReflectionSubmittedOperationalEvent,
  enqueueCurriculumOperationalEvent,
  syncCurriculumIngestionQueue,
} from "./curriculumIngestionClient.js";

const PKEY = "progress:records:v1";

export function markLessonComplete({ actorId, curriculum, slug, onSyncStatus } = {}) {
  const ts = new Date().toISOString();
  const rec = {
    id: `progress_lesson_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    actorId,
    curriculum,
    slug,
    ts,
    institutionalSyncStatus: "pending",
    institutionalSyncMessage: "Pending backend synchronization",
  };
  const ledgerEvent = appendEvent({
    actorId,
    app: "curriculum",
    type: "progress",
    amount: 0,
    tags: ["lesson.completed", curriculum],
    meta: { curriculum, slug, institutionalSyncStatus: "pending" },
  });
  const queued = enqueueCurriculumOperationalEvent(buildLessonCompletedOperationalEvent({ actorId, curriculum, slug, ts }));
  rec.ledgerEventId = ledgerEvent.id;
  rec.ingestionQueueId = queued.queue_id;
  const all = readAll();
  all.push(rec);
  saveAll(all);
  notifySyncStatus(onSyncStatus, "pending", queued);
  syncCurriculumIngestionQueue()
    .then((result) => {
      const current = readCurriculumIngestionQueueSnapshot(queued.queue_id);
      const status = current?.sync_status === "synchronized" ? "synchronized" : result.failed ? "rejected" : "pending";
      updateProgressRecordSyncStatus(rec.id, status, current?.last_error || "");
      notifySyncStatus(onSyncStatus, status, current || queued);
    })
    .catch((error) => {
      updateProgressRecordSyncStatus(rec.id, "rejected", error?.message || "Synchronization failed.");
      notifySyncStatus(onSyncStatus, "rejected", { ...queued, last_error: error?.message || "Synchronization failed." });
    });
  return rec;
}

/* ---------------------------------------------------------------------
 * Phase 2B learning-primitive events. Same pattern as markLessonComplete
 * above (localStorage record + ledgerClient.appendEvent) — no second
 * progress system. Each function is only called from a real, observed
 * student action (see AssessmentRenderer.jsx / VocabularyReview.jsx) —
 * never fabricated, and completing a media item or a knowledge check
 * never implies the lesson itself is complete (see markLessonComplete,
 * still a separate, explicit student action).
 * ------------------------------------------------------------------- */

function recordEvent(tag, { actorId, curriculum, slug, meta = {} }) {
  return appendEvent({
    actorId,
    app: "curriculum",
    type: "progress",
    amount: 0,
    tags: [tag, curriculum].filter(Boolean),
    meta: { curriculum, slug, ...meta },
  });
}

export function recordVocabularyReviewed({ actorId, curriculum, slug, term }) {
  recordEvent("vocabulary.reviewed", { actorId, curriculum, slug, meta: { term } });
}

export function recordQuizStarted({ actorId, curriculum, slug, assessmentId }) {
  recordEvent("quiz.started", { actorId, curriculum, slug, meta: { assessmentId } });
}

export function recordQuizSubmitted({ actorId, curriculum, slug, assessmentId, itemId, isCorrect }) {
  recordEvent("quiz.submitted", { actorId, curriculum, slug, meta: { assessmentId, itemId, isCorrect } });
  enqueueAndSync(buildAssessmentSubmittedOperationalEvent({ actorId, curriculum, slug, assessmentId, itemId, isCorrect }));
}

export function recordQuizCompleted({ actorId, curriculum, slug, assessmentId, score, maxScore }) {
  recordEvent("quiz.completed", { actorId, curriculum, slug, meta: { assessmentId, score, maxScore } });
  enqueueAndSync(buildAssessmentCompletedOperationalEvent({ actorId, curriculum, slug, assessmentId, score, maxScore }));
}

export function recordReflectionSaved({ actorId, curriculum, slug, itemId }) {
  recordEvent("reflection.saved", { actorId, curriculum, slug, meta: { itemId } });
  enqueueAndSync(buildReflectionSubmittedOperationalEvent({ actorId, curriculum, slug, itemId }));
}

export function recordActivityCompleted({ actorId, curriculum, slug, activityId }) {
  recordEvent("activity.completed", { actorId, curriculum, slug, meta: { activityId } });
}

export function recordMediaStarted({ actorId, curriculum, slug, mediaSrc }) {
  recordEvent("media.started", { actorId, curriculum, slug, meta: { mediaSrc } });
}

export function recordMediaCompleted({ actorId, curriculum, slug, mediaSrc }) {
  recordEvent("media.completed", { actorId, curriculum, slug, meta: { mediaSrc } });
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

function updateProgressRecordSyncStatus(recordId, status, message = "") {
  const all = readAll();
  const next = all.map((record) => (
    record.id === recordId
      ? {
          ...record,
          institutionalSyncStatus: status,
          institutionalSyncMessage: status === "synchronized" ? "Synchronized with backend" : message || "Backend synchronization failed",
        }
      : record
  ));
  saveAll(next);
}

function readCurriculumIngestionQueueSnapshot(queueId) {
  try {
    const raw = localStorage.getItem("curriculum:ingestion:queue:v1");
    const queue = raw ? JSON.parse(raw) : [];
    return Array.isArray(queue) ? queue.find((item) => item.queue_id === queueId) : null;
  } catch {
    return null;
  }
}

function notifySyncStatus(handler, status, item) {
  if (typeof handler !== "function") return;
  try {
    handler({ status, item });
  } catch {}
}

function enqueueAndSync(event) {
  enqueueCurriculumOperationalEvent(event);
  syncCurriculumIngestionQueue().catch(() => {});
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
