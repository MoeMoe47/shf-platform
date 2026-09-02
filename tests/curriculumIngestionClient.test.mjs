import assert from "node:assert/strict";

import {
  CURRICULUM_INGESTION_QUEUE_KEY,
  CANONICAL_BROWSER_EVENT_TYPES,
  buildAssessmentCompletedOperationalEvent,
  buildAssessmentSubmittedOperationalEvent,
  buildLessonCompletedOperationalEvent,
  buildReflectionSubmittedOperationalEvent,
  enqueueCurriculumOperationalEvent,
  readCurriculumIngestionQueue,
  syncCurriculumIngestionQueue,
} from "../src/shared/progress/curriculumIngestionClient.js";
import {
  markLessonComplete,
  recordQuizCompleted,
  recordQuizSubmitted,
  recordReflectionSaved,
} from "../src/shared/progress/progressClient.js";

function createStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

globalThis.localStorage = createStorage();

const baseInput = {
  actorId: "student@example.test",
  curriculum: "asl",
  slug: "student.asl-01",
  ts: "2026-08-25T12:00:00.000Z",
};

async function testBuildsIdempotentLessonCompletedEvent() {
  const event = buildLessonCompletedOperationalEvent(baseInput);

  assert.equal(event.event_type, "lesson.completed");
  assert.equal(event.producer_id, "curriculum.lesson");
  assert.equal(event.subject_type, "lesson");
  assert.equal(event.subject_id, "student.asl-01");
  assert.equal(event.idempotency_key, "lesson.completed:student@example.test:asl:student.asl-01");
  assert.equal(event.payload.curriculum, "asl");
  assert.equal(event.payload.slug, "student.asl-01");
  assert.equal(event.payload.sync_origin, "browser_transport_queue");
}

async function testBuildsSupportedAssessmentAndReflectionEvents() {
  const submitted = buildAssessmentSubmittedOperationalEvent({
    ...baseInput,
    assessmentId: "quiz-1",
    itemId: "q1",
    isCorrect: true,
  });
  const completed = buildAssessmentCompletedOperationalEvent({
    ...baseInput,
    assessmentId: "quiz-1",
    score: 1,
    maxScore: 1,
  });
  const reflection = buildReflectionSubmittedOperationalEvent({
    ...baseInput,
    itemId: "reflection-1",
  });

  assert.equal(submitted.event_type, "assessment.submitted");
  assert.equal(submitted.subject_type, "assessment");
  assert.equal(submitted.subject_id, "quiz-1:q1");
  assert.equal(completed.event_type, "assessment.completed");
  assert.equal(completed.subject_id, "quiz-1");
  assert.equal(reflection.event_type, "reflection.submitted");
  assert.equal(reflection.subject_type, "assessment");
  assert.equal(reflection.subject_id, "reflection-1");
}

async function testSuccessfulSyncMarksRecordSynchronizedWithoutDeletingIt() {
  localStorage.removeItem(CURRICULUM_INGESTION_QUEUE_KEY);
  const queued = enqueueCurriculumOperationalEvent(buildLessonCompletedOperationalEvent(baseInput));
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, init });
    if (url === "/api/auth/me") {
      return response(200, { csrf_token: "csrf-test", authenticated: true, session_status: "active" });
    }
    if (url === "/api/curriculum/lessons/student.asl-01/complete") {
      return response(200, { ok: true, event: { event_id: "op_evt_test" }, idempotent_replay: false });
    }
    return response(404, {});
  };

  const result = await syncCurriculumIngestionQueue({ fetchImpl });
  const after = readCurriculumIngestionQueue();

  assert.equal(result.synchronized, 1);
  assert.equal(result.failed, 0);
  assert.equal(after.length, 1);
  assert.equal(after[0].queue_id, queued.queue_id);
  assert.equal(after[0].sync_status, "synchronized");
  assert.equal(after[0].backend_event_id, "op_evt_test");
  assert.equal(calls[1].init.credentials, "include");
  assert.equal(calls[1].init.headers["X-CSRF-Token"], "csrf-test");
  assert.deepEqual(JSON.parse(calls[1].init.body), { curriculum: "asl" });
}

async function testFailurePreservesRecordForRetry() {
  localStorage.removeItem(CURRICULUM_INGESTION_QUEUE_KEY);
  const queued = enqueueCurriculumOperationalEvent(buildLessonCompletedOperationalEvent(baseInput));
  const fetchImpl = async (url) => {
    if (url === "/api/auth/me") {
      return response(200, { csrf_token: "csrf-test", authenticated: true, session_status: "active" });
    }
    return response(503, { detail: "offline" });
  };

  const result = await syncCurriculumIngestionQueue({ fetchImpl });
  const after = readCurriculumIngestionQueue();

  assert.equal(result.synchronized, 0);
  assert.equal(result.failed, 1);
  assert.equal(after.length, 1);
  assert.equal(after[0].queue_id, queued.queue_id);
  assert.equal(after[0].sync_status, "rejected");
  assert.equal(after[0].last_error, "offline");
}

async function testLessonCompletionLocalProgressSurvivesFailedBackendSync() {
  localStorage.removeItem("progress:records:v1");
  localStorage.removeItem("ledger:events:v1");
  localStorage.removeItem(CURRICULUM_INGESTION_QUEUE_KEY);
  globalThis.fetch = async () => response(503, { detail: "backend unavailable" });

  const statusEvents = [];
  markLessonComplete({ ...baseInput, onSyncStatus: (event) => statusEvents.push(event.status) });
  await new Promise((resolve) => setTimeout(resolve, 10));

  const progress = JSON.parse(localStorage.getItem("progress:records:v1") || "[]");
  const ledger = JSON.parse(localStorage.getItem("ledger:events:v1") || "[]");
  const queue = readCurriculumIngestionQueue();
  assert.equal(progress.length, 1);
  assert.equal(progress[0].slug, "student.asl-01");
  assert.equal(progress[0].institutionalSyncStatus, "rejected");
  assert.equal(ledger.length, 1);
  assert.equal(queue.length, 1);
  assert.equal(queue[0].sync_status, "rejected");
  assert.deepEqual(statusEvents, ["pending", "rejected"]);
}

async function testQuizAndReflectionRecordersRemainLocalOnly() {
  localStorage.removeItem("ledger:events:v1");
  localStorage.removeItem(CURRICULUM_INGESTION_QUEUE_KEY);
  globalThis.fetch = async () => response(503, { detail: "backend unavailable" });

  recordQuizSubmitted({ ...baseInput, assessmentId: "quiz-1", itemId: "q1", isCorrect: true });
  recordQuizCompleted({ ...baseInput, assessmentId: "quiz-1", score: 1, maxScore: 1 });
  recordReflectionSaved({ ...baseInput, itemId: "reflection-1" });
  await new Promise((resolve) => setTimeout(resolve, 10));

  const ledger = JSON.parse(localStorage.getItem("ledger:events:v1") || "[]");
  assert.equal(ledger.length, 3);
  assert.equal(readCurriculumIngestionQueue().length, 0);
  assert.equal(CANONICAL_BROWSER_EVENT_TYPES.has("assessment.completed"), false);
  assert.equal(CANONICAL_BROWSER_EVENT_TYPES.has("reflection.submitted"), false);
}

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return JSON.stringify(body);
    },
  };
}

await testBuildsIdempotentLessonCompletedEvent();
await testBuildsSupportedAssessmentAndReflectionEvents();
await testSuccessfulSyncMarksRecordSynchronizedWithoutDeletingIt();
await testFailurePreservesRecordForRetry();
await testLessonCompletionLocalProgressSurvivesFailedBackendSync();
await testQuizAndReflectionRecordersRemainLocalOnly();
