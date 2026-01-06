const BASE = "https://www.indeed.com/jobs";
export function buildIndeedSearch({ q, l, utm="utm_source=shf&utm_medium=apply" }){
  const u = new URL(BASE);
  if (q) u.searchParams.set("q", q);
  if (l) u.searchParams.set("l", l);
  if (utm) u.search += (u.search ? "&" : "") + utm;
  return u.toString();
}
export function openIndeed(q, l){
  window.open(buildIndeedSearch({ q, l }), "_blank", "noopener");
  try { window.dispatchEvent(new CustomEvent("shf:apply", { detail:{ provider:"indeed", q, l } })); } catch {}
}
