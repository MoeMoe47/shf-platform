// src/utils/rewards.js
export function logPoints(delta, note) {
  try {
    const pts = Number(localStorage.getItem("wallet:points") || "0") + Number(delta || 0);
    localStorage.setItem("wallet:points", String(pts));
    const raw = localStorage.getItem("wallet:history");
    const arr = raw ? JSON.parse(raw) : [];
    arr.push({ at: Date.now(), delta: Number(delta||0), note: note || "" });
    localStorage.setItem("wallet:history", JSON.stringify(arr));
  } catch {}
}

export function awardBadge(id, note) {
  try {
    localStorage.setItem(`badge:${id}`, "1");
    const raw = localStorage.getItem("wallet:history");
    const arr = raw ? JSON.parse(raw) : [];
    arr.push({ at: Date.now(), delta: 0, note: note || `Badge earned: ${id}` });
    localStorage.setItem("wallet:history", JSON.stringify(arr));
  } catch {}
}
