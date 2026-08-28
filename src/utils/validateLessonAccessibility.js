// src/utils/validateLessonAccessibility.js
//
// Phase 2B — lightweight accessibility linting for a lesson object.
// Warning-only: NEVER blocks rendering or throws (§31). Intended to be
// called once per lesson render, in DEV only, logging via console.warn —
// matching the same dev-diagnostic pattern already established in
// MediaRow.jsx. Does not fabricate anything; it only reports what is
// actually missing in the real content.
import normalizeLessonMedia from "./normalizeLessonMedia.js";

export function validateLessonAccessibility(lesson) {
  const warnings = [];
  if (!lesson) return warnings;

  if (!lesson.title || !String(lesson.title).trim()) {
    warnings.push({ code: "missing-title", message: "Lesson has no title." });
  }

  const sections = Array.isArray(lesson.sections) ? lesson.sections : [];
  sections.forEach((s, i) => {
    if (!s.heading || !String(s.heading).trim()) {
      warnings.push({ code: "missing-heading", message: `Section ${i + 1} has no heading.` });
    }
    if (s.media) {
      const m = normalizeLessonMedia(s.media);
      if (m) {
        if (m.type === "image" && !m.alt) {
          warnings.push({ code: "missing-alt", message: `Section "${s.heading || i + 1}" has an image with no alt text.` });
        }
        if (m.type === "video" && !m.captionsTrack && !m.transcript) {
          warnings.push({
            code: "missing-video-a11y",
            message: `Section "${s.heading || i + 1}" has instructional video with no captions or transcript metadata.`,
          });
        }
        if (m.type === "embed") {
          warnings.push({
            code: "inaccessible-iframe",
            message: `Section "${s.heading || i + 1}" uses an embedded iframe — accessibility depends entirely on the embedded provider.`,
          });
        }
      }
    }
  });

  const quiz = lesson.quiz;
  if (quiz) {
    const items = Array.isArray(quiz) ? quiz : Array.isArray(quiz.items) ? quiz.items : [quiz];
    items.forEach((q, i) => {
      const prompt = q.question || q.q || q.prompt;
      if (!prompt || !String(prompt).trim()) {
        warnings.push({ code: "unlabeled-quiz-item", message: `Quiz item ${i + 1} has no question/prompt text.` });
      }
    });
  }

  return warnings;
}

export default validateLessonAccessibility;
