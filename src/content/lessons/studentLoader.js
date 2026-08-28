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

// Guided Lesson Experience Phase 1 correction (2026-08-27): the canonical
// /curriculum/lessons/:slug route has no :curriculum URL segment, so a
// caller that only has a slug (StudentUnit.jsx) has no real curriculum id
// to pass into getStudentUnit() above — it must not guess/default one.
// This scans every known "-student" folder for the matching slug and
// returns the curriculum id actually derived from the real file path
// (via the same parseCurriculumId() every other loader function here
// uses), so lesson context is never hardcoded to a single curriculum.
export async function getStudentUnitBySlug(slug) {
  const path = Object.keys(fileModules).find((p) => p.endsWith(`/${slug}.json`));
  if (!path) return null;
  const curriculum = parseCurriculumId(path);
  const mod = await fileModules[path]();
  return { curriculum, unit: validateStudentUnit(mod) };
}

function parseSlugFromPath(path) {
  const m = path.match(/\/([^/]+)\.json$/);
  return m ? m[1] : null;
}

// Lessons-navigation correction (2026-08-27): real content proved
// inconsistent about carrying a `slug`/`id` field that actually matches
// its own filename — e.g. student.asl-21.json's internal `id` is "asl-21",
// not "student.asl-21" (confirmed live: only 2 of 72 real asl-student
// files even have a `slug` field, and several `id` values diverge from
// their filename). Since getStudentUnit()/getStudentUnitBySlug() both
// match a route slug against the real FILENAME, that filename — not any
// JSON content field — is the only reliable routable slug. This is the
// canonical source for a real lessons catalog (see MyLessons.jsx); it
// must never be reconstructed from localStorage or from unit.slug/id.
export async function allStudentUnitsCatalog() {
  const entries = Object.entries(fileModules);
  const loaded = await Promise.all(
    entries.map(async ([path, loader]) => ({
      curriculum: parseCurriculumId(path),
      routeSlug: parseSlugFromPath(path),
      unit: validateStudentUnit(await loader()),
    }))
  );
  return loaded.filter((e) => e.routeSlug);
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
