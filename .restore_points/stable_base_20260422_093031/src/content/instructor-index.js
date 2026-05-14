// Lazy loader for instructor-facing lessons
// Looks for: src/content/lessons/asl-instructor/instructor.asl-*.json
// Slugs returned/accepted: "instructor.asl-XX" (primary)
// Also accepts numeric "XX" → resolves to "instructor.asl-XX"

const mods = import.meta.glob(
  "./lessons/asl-instructor/instructor.asl-*.json"
); // NOT eager

/** Normalize a raw slug into an "instructor.asl-XX" key if possible. */
function toInstructorSlug(raw) {
  if (!raw) return null;
  // already fully qualified
  if (/^instructor\.asl-\d{1,3}$/.test(raw)) return raw;

  // "asl-XX" or just "XX" → instructor.asl-XX
  const m =
    raw.match(/^asl-(\d{1,3})$/) ||
    raw.match(/^(\d{1,3})$/);
  if (m) return `instructor.asl-${m[1]}`;

  return null; // unknown pattern; caller can still try raw file end-match
}

/** Load one instructor lesson lazily. Returns the JSON object or null. */
export async function getInstructorLessonBySlug(slug) {
  // Prefer normalized instructor slug
  const instr = toInstructorSlug(slug) || slug;

  // Try an exact filename end-match first
  const tryKeys = [];
  if (instr) tryKeys.push(instr);
  if (slug && slug !== instr) tryKeys.push(slug);

  for (const key of tryKeys) {
    // expect filename "<...>/instructor.asl-XX.json"
    const match = Object.keys(mods).find((p) => p.endsWith(`/${key}.json`));
    if (match) {
      try {
        const m = await mods[match]();
        return m?.default ?? m ?? null;
      } catch {
        // keep looking
      }
    }
  }

  return null;
}

/** List all instructor slugs (e.g., "instructor.asl-01"), sorted numerically. */
export async function listInstructorSlugs() {
  // No dynamic imports needed to list file names
  return Object.keys(mods)
    .map((p) => p.split("/").pop().replace(/\.json$/i, "")) // filename → slug
    .sort((a, b) => {
      const an = Number((a.match(/(\d+)$/) || [])[1] || 0);
      const bn = Number((b.match(/(\d+)$/) || [])[1] || 0);
      return an - bn || a.localeCompare(b);
    });
}

/** Highest instructor lesson number (e.g., 12). */
export async function getHighestInstructorNumber() {
  const nums = Object.keys(mods)
    .map((p) => Number((p.match(/instructor\.asl-(\d+)\.json$/) || [])[1]))
    .filter((n) => Number.isFinite(n));
  return nums.length ? Math.max(...nums) : 0;
}

/** Quick existence check by number. */
export async function hasInstructor(n) {
  const key = `./lessons/asl-instructor/instructor.asl-${n}.json`;
  return Boolean(mods[key]);
}
