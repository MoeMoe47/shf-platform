// Universal lazy loader for ANY curriculum in folders ending with "-instructor"

const fileModules = import.meta.glob("./**/*-instructor/*.json", { import: "default" });

function parseCurriculumId(path) {
  const parts = path.split("/");
  const folder = parts.find((p) => p.endsWith("-instructor"));
  return folder ? folder.replace(/-instructor$/, "") : "unknown";
}

export function listCurricula() {
  const s = new Set();
  Object.keys(fileModules).forEach((p) => s.add(parseCurriculumId(p)));
  return Array.from(s).sort();
}

export async function allInstructorUnits(curriculumId) {
  const entries = Object.entries(fileModules).filter(([p]) =>
    p.includes(`/${curriculumId}-instructor/`)
  );
  const units = await Promise.all(entries.map(([_, loader]) => loader()));
  return units.map(validateInstructorUnit);
}

export async function getInstructorUnit(curriculumId, slug) {
  const path = Object.keys(fileModules).find(
    (p) => p.includes(`/${curriculumId}-instructor/`) && p.endsWith(`/${slug}.json`)
  );
  if (!path) return null;
  const mod = await fileModules[path]();
  return validateInstructorUnit(mod);
}

/* ---------- tiny schema guard (no deps) ---------- */
function validateInstructorUnit(u) {
  if (!u || typeof u !== "object") return u;
  if (typeof u.slug !== "string") console.warn("[instructorLoader] Missing slug in", u);
  if (typeof u.title !== "string") console.warn("[instructorLoader] Missing title in", u);
  u.procedures = Array.isArray(u.procedures) ? u.procedures : [];
  u.checks = Array.isArray(u.checks) ? u.checks : [];
  u.materials = Array.isArray(u.materials) ? u.materials : [];
  u.objectives = Array.isArray(u.objectives) ? u.objectives : [];
  u.misconceptions = Array.isArray(u.misconceptions) ? u.misconceptions : [];
  u.assessment = u.assessment || {};
  u.assessment.formative = Array.isArray(u.assessment.formative) ? u.assessment.formative : [];
  u.assessment.quiz = Array.isArray(u.assessment.quiz) ? u.assessment.quiz : [];
  u.assessment.rubric = Array.isArray(u.assessment.rubric) ? u.assessment.rubric : [];
  return u;
}
