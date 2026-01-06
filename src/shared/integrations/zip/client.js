const BASE = "https://www.ziprecruiter.com/candidate/search";
export function buildZipSearch({ q, l, utm="utm_source=shf&utm_medium=apply" }){
  const u = new URL(BASE);
  if (q) u.searchParams.set("search", q);
  if (l) u.searchParams.set("location", l);
  if (utm) u.search += (u.search ? "&" : "") + utm;
  return u.toString();
}
export function openZip(q, l){
  window.open(buildZipSearch({ q, l }), "_blank", "noopener");
  try { window.dispatchEvent(new CustomEvent("shf:apply", { detail:{ provider:"zip", q, l } })); } catch {}
}
