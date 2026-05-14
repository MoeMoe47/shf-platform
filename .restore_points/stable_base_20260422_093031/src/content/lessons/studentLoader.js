// Universal lazy loader for ANY curriculum in folders ending with "-student"
// e.g. src/content/lessons/asl-student/*.json, cdl-student/*.json, etc.

const fileModules = import.meta.glob("./**/*-student/*.json", { import: "default" });

// Parse curriculumId from a module path that includes ".../<id>-student/<file>.json"
function parseCurriculumId(path) {
  const parts = path.split("/");
  const folder = parts.find((p) => p.endsWith("-student"));
  return folder ? folder.replace(/-student$/, "") : "unknown";
}

// List distinct curricula without loading JSON
export function listCurricula() {
  const s = new Set();
  Object.keys(fileModules).forEach((p) => s.add(parseCurriculumId(p)));
  return Array.from(s).sort();
}

// Load all units for a curriculum (lazy)
export async function allStudentUnits(curriculumId) {
  const entries = Object.entries(fileModules).filter(([p]) =>
    p.includes(`/${curriculumId}-student/`)
  );
  const units = await Promise.all(entries.map(([_, loader]) => loader()));
  return units.map(validateStudentUnit);
}

// Load a single unit (lazy)
export async function getStudentUnit(curriculumId, slug) {
  const path = Object.keys(fileModules).find(
    (p) => p.includes(`/${curriculumId}-student/`) && p.endsWith(`/${slug}.json`)
  );
  if (!path) return null;
  const mod = await fileModules[path]();
  return validateStudentUnit(mod);
}

/* ---------- tiny schema guard (no deps) ---------- */
function validateStudentUnit(u) {
  if (!u || typeof u !== "object") return u;
  if (typeof u.slug !== "string") console.warn("[studentLoader] Missing slug in", u);
  if (typeof u.title !== "string") console.warn("[studentLoader] Missing title in", u);
  // normalize common fields to avoid undefined errors in UI
  u.objectives = Array.isArray(u.objectives) ? u.objectives : [];
  u.sections = Array.isArray(u.sections) ? u.sections : [];
  u.practice = Array.isArray(u.practice) ? u.practice : [];
  return u;
}
