// src/companion/celebrationRegistry.js
// Centralized event → animation/tier mapping. Nothing outside this file
// should decide "which animation plays for which event" — components emit
// semantic events (companion.emit("quiz_perfect")); this registry is the
// only place that resolves what Brainiact actually does about it.
import { COMPANION_EVENTS } from "./companionEvents.js";

// Escalating celebration tiers, per the spec's explicit hierarchy: minor
// success gets a flicker, not a dance. Higher tiers are progressively
// longer/bigger, capped at "major" (~3-5s, never blocking).
export const CELEBRATION_TIERS = Object.freeze({
  NONE: "none",
  MINOR: "minor", // smile, tiny bounce
  STREAK: "streak", // short dance, stronger expression
  LESSON: "lesson", // lesson-complete celebration
  PERFECT: "perfect", // quiz perfect — victory dance
  PROJECT: "project", // portfolio / "you built that"
  CAREER: "career", // resume/interview/credential milestones
  MAJOR: "major", // biggest allowed — still capped, never blocks the student
});

// animation: a motion-token name (see companionConfig.MOTION_TOKENS).
// durationMs: upper bound the runtime enforces even if a future richer
// asset wants to run longer — "never prevent the student from continuing".
export const celebrationRegistry = Object.freeze({
  [COMPANION_EVENTS.ANSWER_CORRECT]: { tier: CELEBRATION_TIERS.MINOR, animation: "fistPump", message: "NICE!", durationMs: 1200 },
  [COMPANION_EVENTS.ANSWER_STREAK]: { tier: CELEBRATION_TIERS.STREAK, animation: "miniDance", message: "ON A ROLL!", durationMs: 1800 },
  [COMPANION_EVENTS.LESSON_COMPLETED]: { tier: CELEBRATION_TIERS.LESSON, animation: "celebrate", message: "GREAT JOB!", durationMs: 2400 },
  [COMPANION_EVENTS.QUIZ_PERFECT]: { tier: CELEBRATION_TIERS.PERFECT, animation: "victoryDance", message: "PERFECT!", durationMs: 3200 },
  [COMPANION_EVENTS.PORTFOLIO_COMPLETED]: { tier: CELEBRATION_TIERS.PROJECT, animation: "projectVictory", message: "YOU BUILT THAT!", durationMs: 2800 },
  [COMPANION_EVENTS.RESUME_COMPLETED]: { tier: CELEBRATION_TIERS.CAREER, animation: "celebrate", message: "RESUME READY!", durationMs: 2400 },
  [COMPANION_EVENTS.CAREER_MATCH_FOUND]: { tier: CELEBRATION_TIERS.CAREER, animation: "look", message: "NEW MATCH!", durationMs: 1600 },
  [COMPANION_EVENTS.INTERVIEW_COMPLETED]: { tier: CELEBRATION_TIERS.CAREER, animation: "celebrate", message: "NICE WORK!", durationMs: 2400 },
  [COMPANION_EVENTS.CREDENTIAL_EARNED]: { tier: CELEBRATION_TIERS.MAJOR, animation: "majorCelebration", message: "CREDENTIAL EARNED!", durationMs: 4000 },
  [COMPANION_EVENTS.MAJOR_MILESTONE]: { tier: CELEBRATION_TIERS.MAJOR, animation: "majorCelebration", message: "MILESTONE!", durationMs: 4000 },
});

/** Non-celebration reactive messages — short face text, no animation tier. */
export const reactionRegistry = Object.freeze({
  [COMPANION_EVENTS.ANSWER_INCORRECT]: { animation: "thinking", message: "TRY AGAIN" },
  [COMPANION_EVENTS.STUDENT_STUCK]: { animation: "look", message: "HINT?" },
  [COMPANION_EVENTS.HINT_REQUESTED]: { animation: "hint", message: "LOOK 👀" },
  [COMPANION_EVENTS.LESSON_STARTED]: { animation: "wave", message: "" },
  [COMPANION_EVENTS.INTERVIEW_STARTED]: { animation: "look", message: "YOU GOT THIS" },
});

export function resolveCelebration(eventName) {
  return celebrationRegistry[eventName] || null;
}

export function resolveReaction(eventName) {
  return reactionRegistry[eventName] || null;
}
