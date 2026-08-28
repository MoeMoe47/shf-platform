export const CURRICULUM_INGESTION_QUEUE_KEY = "curriculum:ingestion:queue:v1";

const DEFAULT_API_BASE = "/api";

export function buildLessonCompletedOperationalEvent({ actorId, curriculum, slug, ts = new Date().toISOString() }) {
  const safeActor = String(actorId || "local-student").trim() || "local-student";
  const safeCurriculum = String(curriculum || "unknown").trim() || "unknown";
  const safeSlug = String(slug || "unknown-lesson").trim() || "unknown-lesson";
  return {
    event_type: "lesson.completed",
    schema_version: "1.0",
    producer_id: "curriculum.lesson",
    subject_type: "lesson",
    subject_id: safeSlug,
    occurred_at: ts,
    idempotency_key: `lesson.completed:${safeActor}:${safeCurriculum}:${safeSlug}`,
    data_classification: "student_activity",
    payload: {
      curriculum: safeCurriculum,
      slug: safeSlug,
      sync_origin: "browser_transport_queue",
    },
    evidence_references: [],
  };
}

export function buildAssessmentSubmittedOperationalEvent({
  actorId,
  curriculum,
  slug,
  assessmentId,
  itemId,
  isCorrect,
  ts = new Date().toISOString(),
}) {
  const base = baseCurriculumFields({ actorId, curriculum, slug });
  const safeAssessmentId = String(assessmentId || "assessment").trim() || "assessment";
  const safeItemId = String(itemId || "item").trim() || "item";
  return {
    event_type: "assessment.submitted",
    schema_version: "1.0",
    producer_id: "curriculum.assessment",
    subject_type: "assessment",
    subject_id: `${safeAssessmentId}:${safeItemId}`,
    occurred_at: ts,
    idempotency_key: `assessment.submitted:${base.safeActor}:${base.safeCurriculum}:${base.safeSlug}:${safeAssessmentId}:${safeItemId}`,
    data_classification: "student_assessment",
    payload: {
      curriculum: base.safeCurriculum,
      slug: base.safeSlug,
      assessmentId: safeAssessmentId,
      itemId: safeItemId,
      isCorrect: Boolean(isCorrect),
      sync_origin: "browser_transport_queue",
    },
    evidence_references: [],
  };
}

export function buildAssessmentCompletedOperationalEvent({
  actorId,
  curriculum,
  slug,
  assessmentId,
  score,
  maxScore,
  ts = new Date().toISOString(),
}) {
  const base = baseCurriculumFields({ actorId, curriculum, slug });
  const safeAssessmentId = String(assessmentId || "assessment").trim() || "assessment";
  return {
    event_type: "assessment.completed",
    schema_version: "1.0",
    producer_id: "curriculum.assessment",
    subject_type: "assessment",
    subject_id: safeAssessmentId,
    occurred_at: ts,
    idempotency_key: `assessment.completed:${base.safeActor}:${base.safeCurriculum}:${base.safeSlug}:${safeAssessmentId}`,
    data_classification: "student_assessment",
    payload: {
      curriculum: base.safeCurriculum,
      slug: base.safeSlug,
      assessmentId: safeAssessmentId,
      score: Number(score) || 0,
      maxScore: Number(maxScore) || 0,
      sync_origin: "browser_transport_queue",
    },
    evidence_references: [],
  };
}

export function buildReflectionSubmittedOperationalEvent({
  actorId,
  curriculum,
  slug,
  itemId,
  ts = new Date().toISOString(),
}) {
  const base = baseCurriculumFields({ actorId, curriculum, slug });
  const safeItemId = String(itemId || "reflection").trim() || "reflection";
  return {
    event_type: "reflection.submitted",
    schema_version: "1.0",
    producer_id: "curriculum.reflection",
    subject_type: "assessment",
    subject_id: safeItemId,
    occurred_at: ts,
    idempotency_key: `reflection.submitted:${base.safeActor}:${base.safeCurriculum}:${base.safeSlug}:${safeItemId}`,
    data_classification: "student_generated_content",
    payload: {
      curriculum: base.safeCurriculum,
      slug: base.safeSlug,
      itemId: safeItemId,
      sync_origin: "browser_transport_queue",
    },
    evidence_references: [],
  };
}

export function enqueueCurriculumOperationalEvent(event, now = new Date().toISOString()) {
  const queue = readCurriculumIngestionQueue();
  const existing = queue.find((item) => item.event?.idempotency_key === event.idempotency_key);
  if (existing) return existing;
  const item = {
    queue_id: `curriculum_sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    created_at: now,
    updated_at: now,
    sync_status: "pending",
    attempt_count: 0,
    last_error: "",
    backend_event_id: "",
    event,
  };
  writeCurriculumIngestionQueue([item, ...queue]);
  return item;
}

export function readCurriculumIngestionQueue() {
  try {
    const raw = globalThis.localStorage?.getItem(CURRICULUM_INGESTION_QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCurriculumIngestionQueue(queue) {
  try {
    globalThis.localStorage?.setItem(CURRICULUM_INGESTION_QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

export async function syncCurriculumIngestionQueue({ fetchImpl = globalThis.fetch, apiBase = DEFAULT_API_BASE } = {}) {
  const queue = readCurriculumIngestionQueue();
  const pending = queue.filter((item) => item.sync_status === "pending" || item.sync_status === "rejected");
  let synchronized = 0;
  let failed = 0;
  const next = [...queue];

  for (const item of pending) {
    const index = next.findIndex((candidate) => candidate.queue_id === item.queue_id);
    if (index < 0) continue;
    try {
      const result = await postOperationalEvent(item.event, { fetchImpl, apiBase });
      synchronized += 1;
      next[index] = {
        ...next[index],
        sync_status: "synchronized",
        updated_at: new Date().toISOString(),
        attempt_count: Number(next[index].attempt_count || 0) + 1,
        last_error: "",
        backend_event_id:
          result?.data?.outbox_event_id
          || result?.data?.completion?.completion_id
          || result?.event?.event_id
          || next[index].backend_event_id
          || "",
      };
    } catch (error) {
      failed += 1;
      next[index] = {
        ...next[index],
        sync_status: "rejected",
        updated_at: new Date().toISOString(),
        attempt_count: Number(next[index].attempt_count || 0) + 1,
        last_error: error?.message || "Synchronization failed.",
      };
    }
    writeCurriculumIngestionQueue(next);
  }

  return { attempted: pending.length, synchronized, failed, queue: next };
}

export async function postOperationalEvent(event, { fetchImpl = globalThis.fetch, apiBase = DEFAULT_API_BASE } = {}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("Network unavailable");
  }
  const identity = await requestJson(`${apiBase}/auth/me`, {
    credentials: "include",
    cache: "no-store",
  }, fetchImpl);
  const csrfToken = identity?.csrf_token || "";
  if (!csrfToken) {
    throw new Error("Authenticated session required");
  }
  const completionPath = event?.event_type === "lesson.completed"
    ? `${apiBase}/curriculum/lessons/${encodeURIComponent(event.subject_id)}/complete`
    : `${apiBase}/shf/ingestion/events`;
  const completionBody = event?.event_type === "lesson.completed"
    ? { curriculum: event.payload?.curriculum }
    : event;
  return requestJson(completionPath, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
      "X-Correlation-Id": event.idempotency_key,
    },
    body: JSON.stringify(completionBody),
  }, fetchImpl);
}

async function requestJson(url, init, fetchImpl) {
  const response = await fetchImpl(url, init);
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : data?.detail?.error || data?.error;
    const error = new Error(detail || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

function baseCurriculumFields({ actorId, curriculum, slug }) {
  return {
    safeActor: String(actorId || "local-student").trim() || "local-student",
    safeCurriculum: String(curriculum || "unknown").trim() || "unknown",
    safeSlug: String(slug || "unknown-lesson").trim() || "unknown-lesson",
  };
}
