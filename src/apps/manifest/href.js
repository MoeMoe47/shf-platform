function cleanEntry(entry) {
  if (typeof entry !== "string") return "";
  let s = entry.trim();
  if (!s) return "";
  s = s.replace(/^\//, ""); // store as relative
  // allow "ai.html" or "solutions.html"
  return s;
}

function cleanHash(h) {
  if (typeof h !== "string") return "#/home";
  const hh = h.trim();
  if (!hh) return "#/home";
  // normalize to "#/path"
  if (hh.startsWith("#")) return hh;
  if (hh.startsWith("/")) return `#${hh}`;
  return `#/${hh}`;
}

export function buildOpenHref(manifest) {
  if (!manifest) return "";
  const entry = cleanEntry(manifest.entry);
  if (!entry) return "";
  const homeHash = manifest.homeHash || manifest.hashBase || "/home";
  const base = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  return `${base}${entry}${cleanHash(homeHash)}`;
}
