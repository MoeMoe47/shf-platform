// Normalizes various chapter JSON shapes into the minimal fields your Lesson templates expect.
export function normalizeMergedLesson(raw = {}) {
  const title =
    raw.title ||
    raw.chapterTitle ||
    raw.name ||
    "Untitled Lesson";

  const estMinutes =
    raw.estMinutes ||
    raw.estimatedMinutes ||
    raw.duration ||
    30;

  const objectives =
    raw.objectives ||
    raw.learningObjectives ||
    raw.goals ||
    [];

  const vocabulary =
    raw.vocabulary ||
    raw.vocab ||
    raw.terms ||
    [];

  const breadcrumbs =
    raw.breadcrumbs ||
    [{ label: "Lessons", href: "/asl/lessons" }];

  const summary =
    raw.summary ||
    raw.chapterSummary ||
    null;

  const reflection =
    raw.reflection ||
    raw.studentReflection ||
    null;

  return {
    id: raw.id || raw.slug || "lesson",
    title,
    estMinutes,
    objectives,
    vocabulary,
    breadcrumbs,
    summary,
    reflection,
    _raw: raw,
  };
}

// default export too (covers `import normalizeMergedLesson from ...`)
export default normalizeMergedLesson;
