const TKEY = "sales:team:members";
export function seedTeamIfEmpty() {
  try {
    const existing = JSON.parse(localStorage.getItem(TKEY) || "[]");
    if (existing.length) return existing;
  } catch {}
  const seed = [
    { id:"u1", name:"Alex",     wins:7,   revenue:64000, last:Date.now()-36e5,  velocity:1.2 },
    { id:"u2", name:"Jordan",   wins:4,   revenue:42000, last:Date.now()-5e6,  velocity:0.8 },
    { id:"u3", name:"Taylor",   wins:9,   revenue:90500, last:Date.now()-9e6,  velocity:1.5 },
    { id:"u4", name:"Morgan",   wins:2,   revenue:18000, last:Date.now()-2e6,  velocity:0.6 },
  ];
  localStorage.setItem(TKEY, JSON.stringify(seed));
  return seed;
}
export function listTeam() {
  try { return JSON.parse(localStorage.getItem(TKEY) || "[]"); } catch { return []; }
}
export function bumpMember(id, delta = {}) {
  const arr = listTeam();
  const idx = arr.findIndex(x=>x.id===id);
  if (idx >= 0) {
    arr[idx] = { ...arr[idx], ...delta };
    localStorage.setItem(TKEY, JSON.stringify(arr));
  }
  return arr;
}
