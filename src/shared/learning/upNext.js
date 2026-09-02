// src/shared/learning/upNext.js
//
// SHF Curriculum Phase 5.5 — the ONE place that merges the three already-
// real data sources (assignments, live sessions, course next-lesson) into
// a single "what's next" signal for the Learning landing and Course
// Workspace Overview. This is presentation-layer merging of already-
// canonical facts (each source is already backend-resolved — see
// assignment-entitlement-service.ts and student-catalog-service.ts), not
// a second truth source, and not a re-derivation of completion/access
// state. Reused by both callers so this logic exists exactly once, per
// the "no separate frontend next-work algorithm" requirement.
export function pickNextAssignment(assignments, { courseStableKey } = {}) {
  const pool = (assignments || []).filter((a) => a.accessState !== "COMPLETED" && a.accessState !== "LOCKED");
  const scoped = courseStableKey ? pool.filter((a) => a.curriculumRelease?.courseStableKey === courseStableKey) : pool;
  return [...scoped].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))[0] || null;
}

export function pickNextLiveSession(sessions, { courseStableKey } = {}) {
  const now = Date.now();
  const pool = (sessions || []).filter((s) => (s.status === "scheduled" || s.status === "open") && new Date(s.startsAt).getTime() >= now);
  const scoped = courseStableKey ? pool.filter((s) => s.courseId === courseStableKey) : pool;
  return [...scoped].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))[0] || null;
}

export function assignmentsDueThisWeek(assignments, { courseStableKey } = {}) {
  const now = Date.now();
  const weekOut = now + 7 * 86_400_000;
  const pool = (assignments || []).filter((a) => {
    if (a.accessState === "COMPLETED" || a.accessState === "LOCKED") return false;
    const due = new Date(a.dueAt).getTime();
    return due >= now && due <= weekOut;
  });
  return courseStableKey ? pool.filter((a) => a.curriculumRelease?.courseStableKey === courseStableKey) : pool;
}

export function buildUpNext({ assignments, liveSessions, course } = {}) {
  const courseStableKey = course?.stableKey;
  return {
    nextAssignment: pickNextAssignment(assignments, { courseStableKey }),
    nextLive: pickNextLiveSession(liveSessions, { courseStableKey }),
    nextLesson: course?.nextLesson || null,
  };
}
