// src/companion/companionEvents.js
// Canonical event vocabulary for the SHF Learning Companion ("Brainiact").
// Pages publish these; CompanionProvider decides how Brainiact reacts.
// Nothing outside this module should hard-code an event-name string.
export const COMPANION_EVENTS = Object.freeze({
  LESSON_STARTED: "lesson_started",
  STUDENT_STUCK: "student_stuck",
  HINT_REQUESTED: "hint_requested",
  HINT_COMPLETED: "hint_completed",
  ANSWER_CORRECT: "answer_correct",
  ANSWER_INCORRECT: "answer_incorrect",
  ANSWER_STREAK: "answer_streak",
  QUIZ_PERFECT: "quiz_perfect",
  LESSON_COMPLETED: "lesson_completed",
  REFLECTION_COMPLETED: "reflection_completed",
  PORTFOLIO_COMPLETED: "portfolio_completed",
  CAREER_MATCH_FOUND: "career_match_found",
  RESUME_COMPLETED: "resume_completed",
  INTERVIEW_STARTED: "interview_started",
  INTERVIEW_COMPLETED: "interview_completed",
  CREDENTIAL_EARNED: "credential_earned",
  MAJOR_MILESTONE: "major_milestone",
  FOCUS_ENABLED: "focus_enabled",
  FOCUS_DISABLED: "focus_disabled",
});

// The DOM CustomEvent name every companion event is dispatched under, with
// the semantic event name + payload in `detail`. One wire event, many
// semantic events — mirrors this codebase's existing `rewards:earned`/
// `a11y:announce` convention (see src/components/ally/A11yTools.jsx) rather
// than inventing a new transport per event.
export const COMPANION_WIRE_EVENT = "companion:event";

/**
 * emitCompanionEvent(name, payload?) — the one function anything in the app
 * should call to talk to Brainiact. Fails safe: an unknown/malformed call
 * never throws into the caller (a lesson page's own logic must never break
 * because the companion couldn't process a signal).
 */
export function emitCompanionEvent(name, payload = {}) {
  try {
    window.dispatchEvent(new CustomEvent(COMPANION_WIRE_EVENT, { detail: { name, payload } }));
  } catch {
    /* no-op — companion signaling must never throw for the caller */
  }
}

export const COMPANION_EVENT_NAMES = Object.freeze(Object.values(COMPANION_EVENTS));
