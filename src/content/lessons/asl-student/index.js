// SANITY LOADER — eager & tiny
console.log("[content] sanity loader loaded");

const studentEager = import.meta.glob("./lessons/**/student.asl-*.json", { eager: true });

function endsWithSlug(p, slug) {
  return p.endsWith(`/${slug}.json`);
}

export function getLessonBySlug(slug) {
  // support numeric alias: /1 → student.asl-1 & student.asl-01
  const variants = new Set([slug]);
  if (/^\d+$/.test(slug)) {
    const n = String(Number(slug));
    variants.add(`student.asl-${n}`);
    variants.add(`student.asl-${String(n).padStart(2, "0")}`);
  }
  const m = slug.match(/^student\.asl-(\d+)$/);
  if (m) {
    const n = String(Number(m[1]));
    variants.add(`student.asl-${n}`);
    variants.add(`student.asl-${String(n).padStart(2, "0")}`);
  }

  for (const s of variants) {
    const hit = Object.keys(studentEager).find((p) => endsWithSlug(p, s));
    if (hit) {
      const mod = studentEager[hit];
      return mod?.default ?? mod ?? null;
    }
  }
  return null;
}

export function __debugKeys() {
  return Object.keys(studentEager);
}
