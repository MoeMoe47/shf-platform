// Eager (simple) loader for student JSON while we stabilize.
// Looks for: src/content/lessons/**/student.asl-*.json
console.log("[content] eager student loader active");

const studentEager = import.meta.glob("./lessons/**/student.asl-*.json", { eager: true });

export function __debugKeys() {
  return Object.keys(studentEager);
}

function pad2(n) { return String(n).padStart(2, "0"); }
function ends(p, slug) { return p.endsWith(`/${slug}.json`); }

function variantsFor(slug) {
  const v = new Set([slug]);
  if (/^\d+$/.test(slug)) {
    const n = String(Number(slug));
    v.add(`student.asl-${n}`);
    v.add(`student.asl-${pad2(n)}`);
  }
  const m = slug.match(/^student\.asl-(\d+)$/);
  if (m) {
    const n = String(Number(m[1]));
    v.add(`student.asl-${n}`);
    v.add(`student.asl-${pad2(n)}`);
  }
  return Array.from(v);
}

export function getLessonBySlug(slug) {
  if (!slug) return null;
  for (const s of variantsFor(slug)) {
    const hit = Object.keys(studentEager).find((p) => ends(p, s));
    if (hit) return studentEager[hit]?.default ?? studentEager[hit] ?? null;
  }
  return null;
}
