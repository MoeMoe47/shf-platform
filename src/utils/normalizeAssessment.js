// src/utils/normalizeAssessment.js
//
// Phase 2B — quiz/assessment data-contract adapter. Real ASL student
// lesson content (src/content/lessons/asl-student/*.json) uses FOUR
// distinct `quiz` shapes today, confirmed live across all 72 lesson
// files:
//   1. { question, options, answer }                — 1 file (legacy)
//   2. { title, items:[{type,q,options,answerIndex,prompt}] } — 66 files (canonical/dominant)
//   3. [ { q, options, answer }, ... ]                — 4 files (legacy)
//   4. { title, note, items:[...] }                   — 1 file (canonical + note)
//
// Shape 2/4's own `items[].type` field already distinguishes real
// question kinds: "mcq" (scored), "short" (free response, unscored),
// "reflection" (unscored reflective prompt) — this adapter preserves
// that distinction rather than inventing a new taxonomy. No lesson JSON
// is rewritten; this only translates in memory at render time.
//
// Canonical output:
//   {
//     title: string|null,
//     note: string|null,
//     items: [
//       { id, type: "mcq", prompt, choices: string[], correctIndex, explain },
//       { id, type: "short", prompt },
//       { id, type: "reflection", prompt },
//     ]
//   }

function normalizeMcqFromFlat(q, idx) {
  const options = Array.isArray(q.options) ? q.options : [];
  const answerText = q.answer;
  let correctIndex = options.findIndex((o) => o === answerText);
  if (correctIndex < 0) correctIndex = 0;
  return {
    id: q.id || `mcq_${idx}`,
    type: "mcq",
    prompt: q.question || q.q || "",
    choices: options,
    correctIndex,
    explain: q.explain || null,
  };
}

function normalizeItem(raw, idx) {
  const type = raw.type === "mcq" || raw.type === "short" || raw.type === "reflection" ? raw.type : "mcq";
  const id = raw.id || `${type}_${idx}`;
  if (type === "mcq") {
    const choices = Array.isArray(raw.options) ? raw.options : [];
    const correctIndex = Number.isInteger(raw.answerIndex) ? raw.answerIndex : 0;
    return { id, type, prompt: raw.q || raw.question || "", choices, correctIndex, explain: raw.explain || null };
  }
  if (type === "short") {
    return { id, type, prompt: raw.q || raw.question || "" };
  }
  // reflection
  return { id, type, prompt: raw.prompt || raw.q || "" };
}

export function normalizeAssessment(quiz) {
  if (!quiz) return null;

  // Shape 3: bare array of flat mcq questions.
  if (Array.isArray(quiz)) {
    const items = quiz.map((q, i) => normalizeMcqFromFlat(q, i));
    return items.length ? { title: null, note: null, items } : null;
  }

  // Shape 2/4: { title, note?, items: [...] }
  if (Array.isArray(quiz.items)) {
    return {
      title: quiz.title || null,
      note: quiz.note || null,
      items: quiz.items.map((raw, i) => normalizeItem(raw, i)),
    };
  }

  // Shape 1: a single flat mcq object.
  if (quiz.question || quiz.q) {
    return { title: null, note: null, items: [normalizeMcqFromFlat(quiz, 0)] };
  }

  return null;
}

export default normalizeAssessment;
