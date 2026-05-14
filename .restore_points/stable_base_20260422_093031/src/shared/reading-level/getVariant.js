// src/shared/reading-level/getVariant.js
/**
 * getVariant(lesson, level, locale)
 * - Returns a shaped copy of the lesson adapted for reading-level + locale.
 * - Level: "standard" | "simple" | "advanced"
 * - Locale: e.g., "en", "es"
 *
 * This is a safe, dependency-free placeholder you can enhance later.
 */

function simplifySentence(s) {
  if (!s) return s;
  // crude: shorten long sentences and strip parentheticals
  let out = String(s)
    .replace(/\([^)]*\)/g, "")        // remove ( ... )
    .replace(/\s+/g, " ")             // normalize spaces
    .trim();
  if (out.length > 180) out = out.slice(0, 170).trim() + "…";
  return out;
}

function advancedExpand(s) {
  if (!s) return s;
  // crude: add a short “why it matters” tail if not already present
  const base = String(s).trim();
  if (base.endsWith(")")) return base; // avoid over-appending on structured lines
  return base + " — Why it matters: consider the broader civic impact in your community.";
}

// minimal dictionary for demo (extend later or plug real i18n)
const DICT = {
  es: {
    Objectives: "Objetivos",
    Vocabulary: "Vocabulario",
    Lesson: "Lección",
    Reflection: "Reflexión",
  },
};

export function getVariant(lesson, level = "standard", locale = "en") {
  if (!lesson || typeof lesson !== "object") return lesson;

  const t = (key) => (DICT[locale]?.[key] || key);

  // clone shallowly to avoid mutating source
  const out = {
    ...lesson,
    title: lesson.title,
    labels: {
      objectives: t("Objectives"),
      vocab: t("Vocabulary"),
      content: t("Lesson"),
      reflection: t("Reflection"),
    },
  };

  const arr = (x) => (Array.isArray(x) ? x.slice() : [x].filter(Boolean));

  if (level === "simple") {
    out.overview = arr(lesson.overview).map(simplifySentence);
    out.content = arr(lesson.content).map(simplifySentence);
  } else if (level === "advanced") {
    out.overview = arr(lesson.overview).map(advancedExpand);
    out.content = arr(lesson.content).map(advancedExpand);
  } else {
    out.overview = arr(lesson.overview);
    out.content = arr(lesson.content);
  }

  // vocabulary passthrough
  out.vocab = Array.isArray(lesson.vocab) ? lesson.vocab.slice() : [];

  // media passthrough
  out.media = lesson.media ? { ...lesson.media } : undefined;

  return out;
}
