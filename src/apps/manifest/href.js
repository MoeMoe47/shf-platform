function cleanEntry(entry) {
  const e = String(entry || "").trim();
  return e.replace(/^\//, ""); // normalize to relative so BASE_URL works
}

function cleanHash(hash) {
  const h = String(hash || "/home").trim();
  const hh = h.startsWith("/") ? h : `/${h}`;
  return `#${hh}`;
}

export function buildOpenHref(manifest) {
  if (!manifest) return "";
  const entry = cleanEntry(manifest.entry);
  if (!entry) return "";

  const homeHash = manifest.homeHash || manifest.hashBase || "/home";
  const base = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  return `${base}${entry}${cleanHash(homeHash)}`;
}
