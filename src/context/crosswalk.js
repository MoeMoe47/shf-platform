// src/content/crosswalk.js

/**
 * Crosswalk helpers to translate between Student/Instructor/Master slugs.
 * These are conservative defaults that won't break if your slugs already match.
 * You can extend the maps below to enforce custom mappings.
 */

// Optional explicit overrides if any slug names don't follow simple conventions.
const STUDENT_TO_MASTER = {
  // Example:
  // "asl-01": "asl-1-foundations",
  // "asl-02": "asl-2-communication-basics",
};
const MASTER_TO_STUDENT = invertMap(STUDENT_TO_MASTER);

// ---- Public API ----

/** Convert a student-facing slug to its Master (curriculum) slug. */
export function getMasterSlug(studentSlug = "") {
  const s = String(studentSlug || "").trim();
  if (!s) return "";

  // explicit map wins
  if (STUDENT_TO_MASTER[s]) return STUDENT_TO_MASTER[s];

  // heuristic: "asl-01" -> "asl-1", then try to attach a master suffix if needed
  const m = s.replace(/^([a-z]+)-0?(\d+)$/i, "$1-$2");
  return m;
}

/** Convert a master slug to a reasonable student slug. */
export function getStudentSlug(masterSlug = "") {
  const m = String(masterSlug || "").trim();
  if (!m) return "";

  // explicit map wins
  if (MASTER_TO_STUDENT[m]) return MASTER_TO_STUDENT[m];

  // heuristic: "asl-1-foundations" -> "asl-01"
  const num = m.match(/^[a-z]+-(\d+)/i)?.[1];
  const base = m.match(/^([a-z]+)-/i)?.[1];
  if (base && num) return `${base}-${num.padStart(2, "0")}`;

  // fallback: pass-through
  return m;
}

/** Optionally expose both directions together (handy for admin tools). */
export function crosswalk(slug) {
  const master = getMasterSlug(slug);
  const student = getStudentSlug(master);
  return { student, master };
}

// ---- Utils ----
function invertMap(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[v] = k;
  return out;
}
