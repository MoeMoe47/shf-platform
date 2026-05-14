// src/content/lessons/masterLoader.js
// Eager, simple, and reliable while we stabilize.
// Matches: src/content/lessons/<curriculum>-master/*.json  (e.g., asl-master/*.json)

const mods = import.meta.glob("./*-master/*.json", { eager: true });

function pathInfo(p) {
  // p like: "./asl-master/asl-1-foundations.json"
  const m = p.match(/\.\/([a-z0-9-]+)-master\/([^/]+)\.json$/i);
  if (!m) return null;
  const curriculum = m[1];          // "asl"
  const fileSlug = m[2];            // "asl-1-foundations"
  return { curriculum, fileSlug };
}

const ALL = Object.entries(mods).map(([p, mod]) => {
  const info = pathInfo(p);
  const data = mod?.default ?? mod ?? {};
  return { path: p, ...info, unit: data, slug: data.slug || info?.fileSlug };
});

/** Return all master units for a curriculum (e.g., "asl"). */
export async function allMasterUnits(curriculum = "asl") {
  const id = String(curriculum).toLowerCase();
  return ALL.filter(x => x?.curriculum === id).map(x => x.unit);
}

/** Return one master unit by slug within a curriculum. */
export async function getMasterUnit(curriculum = "asl", slug) {
  const id = String(curriculum).toLowerCase();
  return (
    ALL.find(x => x.curriculum === id && (x.slug === slug || x?.unit?.slug === slug))
      ?.unit || null
  );
}

/** List available master slugs for a curriculum. */
export async function listMasterSlugs(curriculum = "asl") {
  const id = String(curriculum).toLowerCase();
  return ALL.filter(x => x.curriculum === id).map(x => x.slug);
}

// Optional: expose for console debugging
export const __masterDebug = { keys: Object.keys(mods), ALL };
