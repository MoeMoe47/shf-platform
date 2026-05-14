// src/content/lessons/manifest.js
// Auto-index student lessons: chapter*.json, asl/*.json, deaf/*.json
// Slugs produced:
//   chapter1.json        -> "chapter1"
//   asl/asl-01.json      -> "asl-01"
//   deaf/deaf-01.json    -> "deaf-01"

const loaders = import.meta.glob('./{chapter*.json,asl/*.json,deaf/*.json}'); // lazy

// Build slug -> loader map once
const INDEX = {};
for (const path in loaders) {
  const file = path.split('/').pop();         // e.g., "asl-01.json"
  const base = file.replace(/\.json$/i, '');  // "asl-01"
  INDEX[base] = loaders[path];
}

// Public API
export function listLessonSlugs() {
  return Object.keys(INDEX).sort();
}

export async function loadLesson(slug) {
  const fn = INDEX[slug];
  if (!fn) return null;
  const mod = await fn();
  return mod.default ?? mod;
}
