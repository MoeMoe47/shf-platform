// src/utils/lessonGuidedStages.js
//
// SHF Student Lesson Guided Experience — Phase 1 (2026-08-27).
// Adapter layer between the real, unmodified lesson JSON shape
// (src/content/lessons/asl-student/*.json) and the approved guided-flow
// stage rail (Orient -> Check-In -> Learn -> Vocabulary -> Check ->
// Practice -> Arcade -> Apply -> Assess -> Reflect -> Evidence -> Career
// -> Complete).
//
// No lesson JSON is rewritten. This only derives, at render time, which
// stages a given lesson actually has content for — a stage with no real
// backing data is left unavailable rather than fabricated (per the
// guided-experience Data Honesty Rules). Reuses normalizeAssessment()
// (src/utils/normalizeAssessment.js) rather than re-parsing the four real
// quiz shapes a second time.
import normalizeAssessment from "@/utils/normalizeAssessment.js";

export const STAGE_LABELS = {
  orient: "Orient",
  checkin: "Check-In",
  learn: "Learn",
  vocabulary: "Vocabulary",
  check: "Check",
  practice: "Practice",
  arcade: "Arcade",
  apply: "Apply",
  assess: "Assess",
  reflect: "Reflect",
  evidence: "Evidence",
  career: "Career",
  complete: "Complete",
};

const STAGE_ORDER = Object.keys(STAGE_LABELS);

/**
 * Splits the lesson's single real `quiz` field into two non-overlapping
 * assessment objects — mcq/short items (the formative "Check" stage) and
 * reflection items (the "Reflect" stage) — instead of inventing a second,
 * separate summative-assessment data source that doesn't exist in real
 * content. Both consumers pass the result straight into the existing,
 * unmodified <AssessmentRenderer/>.
 */
export function splitAssessment(lesson) {
  const normalized = normalizeAssessment(lesson?.quiz);
  const items = normalized?.items || [];
  const checkItems = items.filter((i) => i.type !== "reflection");
  const reflectItems = items.filter((i) => i.type === "reflection");

  if (lesson?.reflectionPrompt) {
    reflectItems.push({
      id: "reflectionPrompt",
      type: "reflection",
      prompt: lesson.reflectionPrompt,
    });
  }

  return {
    check: checkItems.length
      ? { title: normalized?.title || null, note: normalized?.note || null, items: checkItems }
      : null,
    reflect: reflectItems.length
      ? { title: null, note: null, items: reflectItems }
      : null,
  };
}

/**
 * Returns the ordered, canonical stage list with `available` computed from
 * real lesson fields only. Every stage key always appears (so the rail
 * itself is stable/predictable) — callers render unavailable stages as
 * quiet/disabled rather than omitting them outright, except where the
 * mock's "derive stages from data" rule calls for skipping entirely (the
 * stage rail component filters `available === false` before rendering).
 */
export function buildGuidedStages(lesson) {
  if (!lesson) return STAGE_ORDER.map((key) => ({ key, label: STAGE_LABELS[key], available: false }));

  const sections = Array.isArray(lesson.sections) ? lesson.sections : [];
  const vocab = Array.isArray(lesson.vocab) ? lesson.vocab : [];
  const games = Array.isArray(lesson.games) ? lesson.games : [];
  const suggestedGames = Array.isArray(lesson?.arcade?.suggestedGames) ? lesson.arcade.suggestedGames : [];
  const practice = Array.isArray(lesson.practice) ? lesson.practice : [];
  const { check, reflect } = splitAssessment(lesson);
  const hasApply = !!(lesson.portfolioFlag || lesson.portfolioArtifact || lesson.project);
  const hasRubric = Array.isArray(lesson?.rubric?.criteria) && lesson.rubric.criteria.length > 0;

  const availability = {
    orient: !!lesson.title,
    // No real lesson content today carries a warm-up/check-in field —
    // left unavailable rather than invented. If one is added later this
    // key is ready to light up without further wiring.
    checkin: !!lesson.checkIn || !!lesson.warmup,
    learn: sections.length > 0,
    vocabulary: vocab.length > 0,
    check: !!check,
    practice: practice.length > 0,
    arcade: games.length > 0 || suggestedGames.length > 0,
    apply: hasApply,
    assess: hasRubric,
    reflect: !!reflect,
    evidence: true, // always a safe, honest summary — even an empty one
    career: true, // always a safe, generic Career Center link
    complete: true,
  };

  return STAGE_ORDER.map((key) => ({ key, label: STAGE_LABELS[key], available: !!availability[key] }));
}

export function firstAvailableStage(stages) {
  const found = stages.find((s) => s.available);
  return found ? found.key : "orient";
}
